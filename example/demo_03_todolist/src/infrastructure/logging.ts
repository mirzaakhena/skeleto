import { AppConfig, Logging } from "../app/types.js";

/**
 * It has a higher ordinal than validation, so it wraps validation and also logs the rejected requests.
 *
 * @Wrapper {"ordinal": 2}
 */
export function implLogging(config: AppConfig): Logging {
  return (handler, fm) => {
    if (!config.logging) return handler;

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
