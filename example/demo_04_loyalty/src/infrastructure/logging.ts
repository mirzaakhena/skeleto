import { WrapperHandler } from "skeleto";
import { AppConfig } from "../app/config.js";

export type Logging = WrapperHandler;

/**
 * It only logs the use cases exposed by a controller, so the gateways do not fill the log with noise.
 *
 * @Wrapper {"ordinal": 3}
 */
export function implLogging(config: AppConfig): Logging {
  return (handler, fm) => {
    if (!config.logging || !fm.additionalDecorators.some((x) => x.name === "Controller")) return handler;

    return async (ctx, req) => {
      const start = Date.now();

      try {
        const result = await handler(ctx, req);
        console.log(`[${ctx.traceId}] ${fm.name} ok ${Date.now() - start}ms`);
        return result;
      } catch (error: any) {
        console.log(`[${ctx.traceId}] ${fm.name} failed ${Date.now() - start}ms: ${error.message}`);
        throw error;
      }
    };
  };
}
