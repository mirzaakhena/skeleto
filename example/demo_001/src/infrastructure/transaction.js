/**
 *
 * @Wrapper { "ordinal": 2 }
 */
export function implTransaction(ds, log) {
    //
    return (handler, functionMetadata) => {
        //
        // not found transaction
        if (!functionMetadata.additionalDecorators.some((d) => d.name === "Transaction")) {
            return handler;
        }
        // found transaction
        return async (ctx, req) => {
            return await ds.transaction(async (em) => {
                try {
                    log.info(">>>>>> START    TRANSACTION", functionMetadata.name);
                    const result = await handler({ ...ctx, data: { ...ctx.data, ["transaction"]: em } }, req);
                    log.info(">>>>>> COMMIT   TRANSACTION", functionMetadata.name);
                    return result;
                }
                catch (error) {
                    log.info(">>>>>> ROLLBACK TRANSACTION", functionMetadata.name);
                    throw error;
                }
            });
        };
    };
}
export function getDataSourceFromContext(ctx, ds) {
    return ctx.data?.["transaction"] ? ctx.data["transaction"] : ds;
}
// extract transaction
export function transactionHandling(handler, fm, ds) {
    // not found transaction
    if (!fm.additionalDecorators.some((d) => d.name === "Transaction")) {
        return handler;
    }
    // found transaction
    return async (ctx, req) => {
        return await ds.transaction(async (em) => {
            try {
                console.log(">>>>>> START    TRANSACTION", fm.name);
                const result = await handler({ ...ctx, data: { ...ctx.data, ["transaction"]: em } }, req);
                console.log(">>>>>> COMMIT   TRANSACTION", fm.name);
                return result;
            }
            catch (error) {
                console.log(">>>>>> ROLLBACK TRANSACTION", fm.name);
                throw error;
            }
        });
    };
}
//# sourceMappingURL=transaction.js.map