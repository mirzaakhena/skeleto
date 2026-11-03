import { randomUUID } from "node:crypto";
import express from "express";
import { ActionHandler, FuncInstanceMetadata, newContext, TypeField } from "skeleto";
import { ConflictError, NotFoundError, ValidationError } from "../app/model/error.js";

type ControllerData = { method: "get" | "post" | "put" | "patch" | "delete"; path: string; tag: string; status?: number };

function getControllerData(fm: FuncInstanceMetadata) {
  return fm.getMetadata().additionalDecorators.find((x) => x.name === "Controller")?.data as ControllerData | undefined;
}

// everything from the url and the headers is a string, so a number field is converted from its type metadata
function convertText(field: TypeField, value: unknown) {
  if (typeof value !== "string" || !field.type.startsWith("number")) return value;

  const converted = Number(value);
  return value.trim() === "" || Number.isNaN(converted) ? value : converted;
}

function readPayload(fm: FuncInstanceMetadata, req: express.Request) {
  const payload: Record<string, unknown> = {};

  fm.getMetadata().request?.structure?.forEach((field) => {
    const part = field.decorators.find((x) => x.name === "RequestPart")?.data;

    if (part === "body") payload[field.name] = req.body?.[field.name];
    if (part === "query") payload[field.name] = convertText(field, req.query[field.name]);
    if (part === "param") payload[field.name] = convertText(field, req.params[field.name]);
    if (part === "header") payload[field.name] = convertText(field, req.get(field.name));
  });

  return payload;
}

function toHttpStatus(error: unknown) {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  return 500;
}

export function getControllers(functions: Iterable<FuncInstanceMetadata>) {
  return Array.from(functions).filter((fm) => getControllerData(fm));
}

export function generateRouter(controllers: FuncInstanceMetadata[]) {
  const router = express.Router();

  controllers.forEach((fm) => {
    const data = getControllerData(fm) as ControllerData;
    const useCase = fm.getInstance() as ActionHandler;

    router[data.method](data.path, async (req, res) => {
      const traceId = randomUUID();
      res.setHeader("Trace-Id", traceId);

      try {
        const result = await useCase({ ...newContext(), traceId }, readPayload(fm, req));
        res.status(data.status ?? 200).json(result);
      } catch (error: any) {
        const status = toHttpStatus(error);
        // the detail of an unexpected error stays in the log
        res.status(status).json({ message: status === 500 ? "internal server error" : error.message, traceId });
      }
    });
  });

  return router;
}

export function handleInvalidJson(error: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: "invalid JSON body" });
    return;
  }

  next(error);
}

export function printControllers(controllers: FuncInstanceMetadata[]) {
  return controllers
    .map((fm) => {
      const data = getControllerData(fm) as ControllerData;
      return { tag: data.tag, usecase: fm.getMetadata().name, method: data.method.toUpperCase(), path: data.path };
    })
    .sort((a, b) => a.tag.localeCompare(b.tag));
}
