import { Receipt, ReceiptID } from "./model/receipt.js";
import { Reward, RewardID } from "./model/reward.js";
import { User, UserID } from "./model/user.js";
import { UserPoint, UserPointID } from "./model/user_point.js";
import { UserReward, UserRewardID } from "./model/user_reward.js";

export type AppConfig = { port: number; logging: boolean };

export type Database = {
  users: Map<UserID, User>;
  rewards: Map<RewardID, Reward>;
  receipts: Map<ReceiptID, Receipt>;
  userRewards: Map<UserRewardID, UserReward>;
  userPoints: Map<UserPointID, UserPoint>;
};

/**
 * @Config
 */
export function implAppConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3003),
    logging: process.env.LOGGING !== "false",
  };
}

/**
 * The data lives in memory, so this demo can run without a database
 * @Config
 */
export function implDatabase(): Database {
  return {
    users: new Map(),
    rewards: new Map(),
    receipts: new Map(),
    userRewards: new Map(),
    userPoints: new Map(),
  };
}
