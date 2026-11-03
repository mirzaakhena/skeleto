import express from "express";
import { Skeleto } from "skeleto";
import { AppConfig } from "./app/types.js";
import { generateRouter, getControllers, printControllers } from "./infrastructure/controller.js";
import { decoratorOptions } from "./infrastructure/decorators.js";

async function main() {
  const application = await Skeleto.start("src", decoratorOptions);
  const container = application.getContainer();

  const config = container.get("AppConfig")?.getInstance() as AppConfig;
  const controllers = getControllers(container.values());

  const app = express();
  app.use(express.json());
  app.use(generateRouter(controllers));

  console.table(printControllers(controllers));

  app.listen(config.port, () => {
    console.log(`Server is running on : http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
