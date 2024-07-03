import { DataSource } from "typeorm";
import winston, { createLogger, format, transports } from "winston";

/**
 *
 * @Config
 */
export function implDatabase(): DataSource {
  return new DataSource({
    type: "postgres" as const,
    port: 5432,
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
    synchronize: true,
    connectTimeoutMS: 500,
    // logging: true,
    entities: ["src/app/model_*{.js,.ts}"],
  });
}

/**
 *
 * @Config
 */
export function implLogger(): winston.Logger {
  return createLogger({
    level: "info",
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      //
      // new transports.Console(),
      new transports.File({ filename: "logs/app.log" }),
    ],
  });
}
