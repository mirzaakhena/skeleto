import express from "express";
import { newContext } from "../core/core.js";
import { FuncInstanceMetadata, UsecaseHandler } from "../core/type.js";
import { Methods } from "./helper.js";

export type RequestWithContext = express.Request & {
  context?: Record<string, any>;
};

export const getRequestWithContext = (req: express.Request) => {
  return (req as RequestWithContext).context;
};

export function generateController(router: express.Router, usecases: FuncInstanceMetadata[]) {
  //

  usecases.forEach(({ funcInstance, funcMetadata }) => {
    //

    const usecase = funcInstance as UsecaseHandler;

    const data = funcMetadata.decorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };

    if (!data) throw new Error("undefined path and method");

    router[data.method as Methods](data.path, async (req, res) => {
      //

      const ctx = getRequestWithContext(req);

      let payload = {};

      funcMetadata.request?.structure.forEach((x) => {
        //

        x.decorator.forEach((y) => {
          //

          if (y.name !== "RequestPart") return;

          if (y.data === "query") {
            payload = { ...payload, [x.name]: req.query[x.name] };
            return;
          }
          if (y.data === "param") {
            payload = { ...payload, [x.name]: req.params[x.name] };
            return;
          }
          if (y.data === "body") {
            payload = { ...payload, [x.name]: req.body[x.name] };
            return;
          }
          if (y.data === "header") {
            payload = { ...payload, [x.name]: req.get(x.name) };
            return;
          }

          if (y.data === "local" && ctx) {
            payload = { ...payload, [x.name]: ctx[x.name] };
            return;
          }
        });
      });
      const result = await usecase(newContext(), payload);
      res.json(result);
    });
  });
}
