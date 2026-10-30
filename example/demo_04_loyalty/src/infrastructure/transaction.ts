import { WrapperHandler } from "skeleto";
import { Database } from "../app/config.js";

export type Transaction = WrapperHandler;

function takeSnapshot(db: Database): Database {
  return {
    users: new Map(db.users),
    rewards: new Map(db.rewards),
    receipts: new Map(db.receipts),
    userRewards: new Map(db.userRewards),
    userPoints: new Map(db.userPoints),
  };
}

function restore<K, V>(target: Map<K, V>, source: Map<K, V>) {
  target.clear();
  source.forEach((value, key) => target.set(key, value));
}

/**
 * Transactions run one at a time, and a failed one puts the data back. The models are never changed in place, so
 * copying the maps is enough. A real database would replace this file, and the use cases would not change.
 *
 * @Wrapper {"ordinal": 1}
 */
export function implTransaction(db: Database): Transaction {
  let queue: Promise<unknown> = Promise.resolve();

  return (handler, fm) => {
    if (!fm.additionalDecorators.some((x) => x.name === "Transaction")) return handler;

    return (ctx, req) => {
      const run = async () => {
        const snapshot = takeSnapshot(db);

        try {
          return await handler(ctx, req);
        } catch (error) {
          restore(db.users, snapshot.users);
          restore(db.rewards, snapshot.rewards);
          restore(db.receipts, snapshot.receipts);
          restore(db.userRewards, snapshot.userRewards);
          restore(db.userPoints, snapshot.userPoints);
          throw error;
        }
      };

      const result = queue.then(run, run);
      queue = result.catch(() => undefined);

      return result;
    };
  };
}
