import { ConflictError, ValidationError } from "./error.js";
import { Pagination } from "./pagination.js";

export type RewardID = string;

export type Reward = {
  id: RewardID;
  createdDate: string;
  title: string;
  description: string;
  point: number;
  stock: number;
};

export type FindManyRewardFilter = Pagination;

type NewReward = Pick<Reward, "title" | "description" | "point" | "stock">;

export function newReward(id: RewardID, data: NewReward, now: Date): Reward {
  if (data.title.trim() === "") {
    throw new ValidationError("title must not be empty");
  }

  if (!Number.isInteger(data.point) || data.point < 0) {
    throw new ValidationError("point must be a non negative integer");
  }

  if (!Number.isInteger(data.stock) || data.stock < 0) {
    throw new ValidationError("stock must be a non negative integer");
  }

  return { ...data, id, title: data.title.trim(), createdDate: now.toISOString() };
}

export function reduceRewardStock(reward: Reward): Reward {
  if (reward.stock - 1 < 0) {
    throw new ConflictError("not enough stock");
  }

  return { ...reward, stock: reward.stock - 1 };
}
