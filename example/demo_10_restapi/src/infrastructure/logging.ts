import winston from "winston";
import { Logging } from "../app/types.js";

/**
 *
 * @Wrapper {"ordinal": 2 }
 */
export function implLogging(logger: winston.Logger): Logging {
  return (handler, fm) => {
    return async (ctx, request) => {
      //

      logger.info({ name: fm.name, data: request, type: "request" });

      const result = await handler(ctx, request);

      logger.info({ name: fm.name, data: result, type: "response" });

      //
      return result;
    };
  };
}
