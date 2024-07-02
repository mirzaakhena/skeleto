import { Context, FuncMetadata, ActionHandler } from "skeleto";
import { DataSource } from "typeorm";
import { AppDataSource, Transaction } from "./types.js";

/**
 *
 * @Middleware
 */
export function implTransaction(ds: AppDataSource): Transaction {
  return (handler, fm) => transactionHandling(handler, fm, ds);
}

export function getDataSourceFromContext(ctx: Context, ds: DataSource): DataSource {
  return ctx.data?.["transaction"] ? (ctx.data["transaction"] as DataSource) : ds;
}

export function transactionHandling(handler: ActionHandler<any, any>, fm: FuncMetadata, ds: DataSource): ActionHandler<any, any> {
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
      } catch (error: any) {
        console.log(">>>>>> ROLLBACK TRANSACTION", fm.name);
        throw error;
      }
    });
  };
}
