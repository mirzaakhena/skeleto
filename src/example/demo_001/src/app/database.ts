import { DataSource } from "typeorm";
import { AppDataSource } from "./types.js";

/**
 *
 * @Config
 */
export function implDatabase(): AppDataSource {
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
