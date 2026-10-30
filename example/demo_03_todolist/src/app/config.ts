import { AppConfig, TodoStore } from "./types.js";

/**
 * @Config
 */
export function implAppConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3002),
    logging: process.env.LOGGING !== "false",
  };
}

/**
 * The data lives in memory, so this demo can run without a database
 * @Config
 */
export function implTodoStore(): TodoStore {
  return new Map();
}
