/**
 *
 * @Wrapper { "ordinal": 1 }
 */
export function implTransaction(logger) {
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
//# sourceMappingURL=logging.js.map