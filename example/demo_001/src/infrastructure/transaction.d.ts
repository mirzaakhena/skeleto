import { Context, FuncMetadata, ActionHandler } from "skeleto";
import { DataSource } from "typeorm";
import { Transaction } from "../app/types.js";
import winston from "winston";
/**
 *
 * @Wrapper { "ordinal": 2 }
 */
export declare function implTransaction(ds: DataSource, log: winston.Logger): Transaction;
export declare function getDataSourceFromContext(ctx: Context, ds: DataSource): DataSource;
export declare function transactionHandling(handler: ActionHandler<any, any>, fm: FuncMetadata, ds: DataSource): ActionHandler<any, any>;
//# sourceMappingURL=transaction.d.ts.map