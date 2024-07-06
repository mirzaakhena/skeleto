import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import "reflect-metadata";
import { Skeleto } from "skeleto";
import { DataSource } from "typeorm";
import YAML from "yaml";
import { generateRouter, handleJWTAuth, printController } from "./infrastructure/controller.js";
import { generateOpenAPIObject } from "./infrastructure/open_api.js";

async function main() {
  //

  dotenv.config();

  const application = await Skeleto.start();

  const dataSource = application.getContainer().get("DataSource")?.funcInstance as DataSource;
  await dataSource.initialize();

  const app = express();
  const port = 3001;

  const usecases = Array.from(application.getContainer().values()) // //
    .filter((x) => x.funcMetadata.additionalDecorators.some((y) => y.name === "Controller"));

  const router = generateRouter(usecases);

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
  app.use(express.json());
  app.use("/", handleJWTAuth("SECRET_KEY", "userLogin"), router);

  console.table(printController(usecases));

  app.listen(port, () => {
    console.log(`Server is running on : http://localhost:${port}`);
    console.log(`OpenAPI              : https://editor.swagger.io/?url=http://localhost:3001/openapi`);
  });
}

main();
