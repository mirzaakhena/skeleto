import { Context, FuncMetadata, ActionHandler } from "skeleto";
import { DataSource } from "typeorm";
import { Transaction } from "../app/types.js";
import winston from "winston";

/**
 *
 * @Middleware { "ordinal": 2 }
 */
export function implTransaction(ds: DataSource, log: winston.Logger): Transaction {
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
        } catch (error: any) {
          log.info(">>>>>> ROLLBACK TRANSACTION", functionMetadata.name);
          throw error;
        }
      });
    };
  };
}

export function getDataSourceFromContext(ctx: Context, ds: DataSource): DataSource {
  return ctx.data?.["transaction"] ? (ctx.data["transaction"] as DataSource) : ds;
}

// extract transaction
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
