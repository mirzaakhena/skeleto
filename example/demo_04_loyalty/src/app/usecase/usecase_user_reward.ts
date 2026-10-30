import { ActionHandler } from "skeleto";
import { FindManyUserReward, FindOneReward, FindOneUser, FindOneUserReward, GenerateID, SaveReward, SaveUser, SaveUserPoint, SaveUserReward } from "../gateway/contracts.js";
import { ApprovalAction, ApprovalStatus, applyApproval } from "../model/approval.js";
import { NotFoundError } from "../model/error.js";
import { reduceRewardStock } from "../model/reward.js";
import { decreaseUserPoint, UserID } from "../model/user.js";
import { newUserPoint } from "../model/user_point.js";
import { UserReward, UserRewardID } from "../model/user_reward.js";

type UserRewardGetAllRequest = {
  /**
   * @RequestPart query
   */
  page?: number;

  /**
   * @RequestPart query
   */
  size?: number;

  /**
   * @RequestPart query
   */
  userID?: UserID;
};

export type UserRewardGetAll = ActionHandler<UserRewardGetAllRequest, { items: UserReward[]; count: number }>;

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "get", "path": "/api/v1/userreward", "tag": "user_reward" }
 */
export function implUserRewardGetAll(findManyUserReward: FindManyUserReward): UserRewardGetAll {
  return async (ctx, req) => {
    const [items, count] = await findManyUserReward(ctx, req);

    return { items, count };
  };
}

type UserRewardApprovalRequest = {
  /**
   * @RequestPart param
   * @Required
   */
  userRewardID: UserRewardID;

  /**
   * @RequestPart body
   * @Required
   * @OneOf {"values": ["APPROVE", "REJECT"]}
   */
  status: ApprovalAction;
};

export type UserRewardApproval = ActionHandler<UserRewardApprovalRequest, { id: UserRewardID; status: ApprovalStatus }>;

/**
 * The status is saved first. When the stock or the points are not enough, @Transaction rolls it back.
 *
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller { "method": "post", "path": "/api/v1/userreward/:userRewardID/approval", "tag": "user_reward" }
 */
export function implUserRewardApproval(
  findOneUserReward: FindOneUserReward,
  saveUserReward: SaveUserReward,
  findOneReward: FindOneReward,
  saveReward: SaveReward,
  findOneUser: FindOneUser,
  saveUser: SaveUser,
  generateID: GenerateID,
  saveUserPoint: SaveUserPoint
): UserRewardApproval {
  return async (ctx, req) => {
    const userReward = await findOneUserReward(ctx, req.userRewardID);
    if (!userReward) {
      throw new NotFoundError("user reward not found");
    }

    const updatedUserReward = applyApproval(userReward, req.status, ctx.date);
    await saveUserReward(ctx, updatedUserReward);

    if (updatedUserReward.status === "REJECTED") {
      return { id: updatedUserReward.id, status: updatedUserReward.status };
    }

    const reward = await findOneReward(ctx, updatedUserReward.rewardID);
    if (!reward) {
      throw new NotFoundError("reward not found");
    }

    await saveReward(ctx, reduceRewardStock(reward));

    const user = await findOneUser(ctx, updatedUserReward.userID);
    if (!user) {
      throw new NotFoundError("user not found");
    }

    await saveUser(ctx, decreaseUserPoint(user, reward.point));
    await saveUserPoint(ctx, newUserPoint(await generateID(ctx), user.id, -reward.point, ctx.date));

    return { id: updatedUserReward.id, status: updatedUserReward.status };
  };
}
