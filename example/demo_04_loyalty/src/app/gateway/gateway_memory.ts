import { randomUUID } from "node:crypto";
import { Database } from "../config.js";
import { paginate } from "../model/pagination.js";
import {
  FindManyReceipt,
  FindManyReward,
  FindManyUser,
  FindManyUserPoint,
  FindManyUserReward,
  FindOneReceipt,
  FindOneReward,
  FindOneUser,
  FindOneUserReward,
  GenerateID,
  SaveReceipt,
  SaveReward,
  SaveUser,
  SaveUserPoint,
  SaveUserReward,
} from "./contracts.js";

/**
 * @Action
 */
export function implGenerateID(): GenerateID {
  return async () => randomUUID();
}

/**
 * @Action
 */
export function implSaveUser(db: Database): SaveUser {
  return async (ctx, req) => {
    db.users.set(req.id, req);
    return req.id;
  };
}

/**
 * @Action
 */
export function implFindOneUser(db: Database): FindOneUser {
  return async (ctx, req) => db.users.get(req) ?? null;
}

/**
 * @Action
 */
export function implFindManyUser(db: Database): FindManyUser {
  return async (ctx, req) => {
    const nameLike = req.nameLike?.toLowerCase();

    const users = Array.from(db.users.values()).filter(
      (x) =>
        (nameLike === undefined || x.name.toLowerCase().includes(nameLike)) &&
        (req.totalPointMin === undefined || x.totalPoints >= req.totalPointMin) &&
        (req.totalPointMax === undefined || x.totalPoints <= req.totalPointMax) &&
        (req.status === undefined || x.status === req.status)
    );

    return paginate(users, req);
  };
}

/**
 * @Action
 */
export function implSaveReward(db: Database): SaveReward {
  return async (ctx, req) => {
    db.rewards.set(req.id, req);
    return req.id;
  };
}

/**
 * @Action
 */
export function implFindOneReward(db: Database): FindOneReward {
  return async (ctx, req) => db.rewards.get(req) ?? null;
}

/**
 * @Action
 */
export function implFindManyReward(db: Database): FindManyReward {
  return async (ctx, req) => paginate(Array.from(db.rewards.values()), req);
}

/**
 * @Action
 */
export function implSaveReceipt(db: Database): SaveReceipt {
  return async (ctx, req) => {
    db.receipts.set(req.id, req);
    return req.id;
  };
}

/**
 * @Action
 */
export function implFindOneReceipt(db: Database): FindOneReceipt {
  return async (ctx, req) => db.receipts.get(req) ?? null;
}

/**
 * @Action
 */
export function implFindManyReceipt(db: Database): FindManyReceipt {
  return async (ctx, req) => {
    const receipts = Array.from(db.receipts.values()).filter(
      (x) =>
        (req.userID === undefined || x.userID === req.userID) &&
        (req.billNumber === undefined || x.billNumber === req.billNumber) &&
        (req.status === undefined || x.status === req.status)
    );

    return paginate(receipts, req);
  };
}

/**
 * @Action
 */
export function implSaveUserReward(db: Database): SaveUserReward {
  return async (ctx, req) => {
    db.userRewards.set(req.id, req);
    return req.id;
  };
}

/**
 * @Action
 */
export function implFindOneUserReward(db: Database): FindOneUserReward {
  return async (ctx, req) => db.userRewards.get(req) ?? null;
}

/**
 * @Action
 */
export function implFindManyUserReward(db: Database): FindManyUserReward {
  return async (ctx, req) => {
    const userRewards = Array.from(db.userRewards.values()).filter((x) => req.userID === undefined || x.userID === req.userID);

    return paginate(userRewards, req);
  };
}

/**
 * @Action
 */
export function implSaveUserPoint(db: Database): SaveUserPoint {
  return async (ctx, req) => {
    db.userPoints.set(req.id, req);
    return req.id;
  };
}

/**
 * @Action
 */
export function implFindManyUserPoint(db: Database): FindManyUserPoint {
  return async (ctx, req) => paginate(Array.from(db.userPoints.values()), req);
}
