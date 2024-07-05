import winston from "winston";
import { ErrorHandler } from "../app/types.js";

/**
 *
 * @Wrapper {"ordinal": 1 }
 */
export function implErrorHandler(logger: winston.Logger): ErrorHandler {
  return (handler, fm) => {
    return async (ctx, request) => {
      //

      try {
        const result = await handler(ctx, request);
        return result;
      } catch (error: any) {
        logger.error({ name: fm.name, data: error.message, type: "error" });
        throw error;
      }
    };
  };
}
