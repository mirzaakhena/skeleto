import { ActionHandler } from "skeleto";
import { FindManyReceiptFilter, Receipt, ReceiptID } from "../model/receipt.js";
import { FindManyRewardFilter, Reward, RewardID } from "../model/reward.js";
import { FindManyUserFilter, User, UserID } from "../model/user.js";
import { FindManyUserPointFilter, UserPoint, UserPointID } from "../model/user_point.js";
import { FindManyUserRewardFilter, UserReward, UserRewardID } from "../model/user_reward.js";

// Save always receives an object and returns its id
// FindOne always receives an id and returns the object or null
// FindMany always receives a filter and returns the items of the page and the total count

export type GenerateID = ActionHandler<void, string>;

export type SaveUser = ActionHandler<User, UserID>;
export type FindOneUser = ActionHandler<UserID, User | null>;
export type FindManyUser = ActionHandler<FindManyUserFilter, [User[], number]>;

export type SaveReward = ActionHandler<Reward, RewardID>;
export type FindOneReward = ActionHandler<RewardID, Reward | null>;
export type FindManyReward = ActionHandler<FindManyRewardFilter, [Reward[], number]>;

export type SaveReceipt = ActionHandler<Receipt, ReceiptID>;
export type FindOneReceipt = ActionHandler<ReceiptID, Receipt | null>;
export type FindManyReceipt = ActionHandler<FindManyReceiptFilter, [Receipt[], number]>;

export type SaveUserReward = ActionHandler<UserReward, UserRewardID>;
export type FindOneUserReward = ActionHandler<UserRewardID, UserReward | null>;
export type FindManyUserReward = ActionHandler<FindManyUserRewardFilter, [UserReward[], number]>;

export type SaveUserPoint = ActionHandler<UserPoint, UserPointID>;
export type FindManyUserPoint = ActionHandler<FindManyUserPointFilter, [UserPoint[], number]>;
