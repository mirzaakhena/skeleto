import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import YAML from "yaml";
import "reflect-metadata";
import { newContext, Skeleto, ActionHandler } from "skeleto";
import { AppDataSource } from "./app/types.js";
import { generateController, handleJWTAuth, printController } from "./app/controller.js";
import { generateOpenAPIObject } from "./app/open_api.js";

async function main() {
  //

  dotenv.config();

  const application = await Skeleto.getInstance().startScan();

  const dataSource = application.getContainer().get("AppDataSource")?.funcInstance as AppDataSource;

  await dataSource.initialize();

  const app = express();
  const port = 3001;
  const router = express.Router();

  const usecases = Array.from(application.getContainer().values()) //
    .filter((x) => x.funcMetadata.additionalDecorators.some((y) => y.name === "Controller"));

  generateController(router, usecases);

  const securitySchema = {
    bearerAuth: {
      type: "http" as const,
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  };

  app.use(cors({ exposedHeaders: ["Trace-Id", "Date"] }));
  router.get("/openapi", (req, res) => {
    res.setHeader("Content-Type", "application/x-yaml");
    res.send(
      YAML.stringify(
        generateOpenAPIObject(
          usecases.map((x) => x.funcMetadata),
          securitySchema
        )
      )
    );
  });

  app.use("/", handleJWTAuth("SECRET_KEY", "userLogin"), router);

  console.table(printController(usecases));

  app.listen(port, () => {
    console.log(`Server is running on : http://localhost:${port}`);
    console.log(`OpenAPI              : https://editor.swagger.io/?url=http://localhost:3001/openapi`);
  });
}

main();
