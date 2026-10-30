import express from "express";
import { Skeleto } from "skeleto";
import { AppConfig } from "./app/config.js";
import { generateRouter, getControllers, handleInvalidJson } from "./infrastructure/controller.js";
import { decoratorOptions } from "./infrastructure/decorators.js";

export async function createServer() {
  const application = await Skeleto.start("src", decoratorOptions);
  const container = application.getContainer();

  const config = container.get("AppConfig")?.getInstance() as AppConfig;
  const controllers = getControllers(container.values());

  const app = express();
  app.use(express.json());
  app.use(handleInvalidJson);
  app.use(generateRouter(controllers));

  return { app, config, controllers };
}
