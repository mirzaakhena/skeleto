import { Approval } from "./approval.js";
import { Pagination } from "./pagination.js";
import { RewardID } from "./reward.js";
import { UserID } from "./user.js";

export type UserRewardID = string;

export type UserReward = Approval & {
  id: UserRewardID;
  userID: UserID;
  rewardID: RewardID;
  createdDate: string;
};

export type FindManyUserRewardFilter = Pagination & {
  userID?: UserID;
};

export function newUserReward(id: UserRewardID, userID: UserID, rewardID: RewardID, now: Date): UserReward {
  return { id, userID, rewardID, createdDate: now.toISOString(), status: "PENDING", approvalDate: null };
}
