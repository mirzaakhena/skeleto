import { ActionHandler } from "skeleto";
import { FindManyReward, FindOneReward, FindOneUser, GenerateID, SaveReward, SaveUserReward } from "../gateway/contracts.js";
import { NotFoundError } from "../model/error.js";
import { newReward, Reward, RewardID } from "../model/reward.js";
import { assertUserIsActive, UserID } from "../model/user.js";
import { newUserReward, UserRewardID } from "../model/user_reward.js";

type RewardCreateRequest = {
  /**
   * @RequestPart body
   * @Required
   */
  title: string;

  /**
   * @RequestPart body
   * @Required
   */
  description: string;

  /**
   * @RequestPart body
   * @Required
   */
  point: number;

  /**
   * @RequestPart body
   * @Required
   */
  stock: number;
};

export type RewardCreate = ActionHandler<RewardCreateRequest, { id: RewardID }>;

/**
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller { "method": "post", "path": "/api/v1/reward", "tag": "reward", "status": 201 }
 */
export function implRewardCreate(generateID: GenerateID, saveReward: SaveReward): RewardCreate {
  return async (ctx, req) => {
    const id = await saveReward(ctx, newReward(await generateID(ctx), req, ctx.date));

    return { id };
  };
}

type RewardGetAllRequest = {
  /**
   * @RequestPart query
   */
  page?: number;

  /**
   * @RequestPart query
   */
  size?: number;
};

export type RewardGetAll = ActionHandler<RewardGetAllRequest, { items: Reward[]; count: number }>;

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "get", "path": "/api/v1/reward", "tag": "reward" }
 */
export function implRewardGetAll(findManyReward: FindManyReward): RewardGetAll {
  return async (ctx, req) => {
    const [items, count] = await findManyReward(ctx, req);

    return { items, count };
  };
}

type RewardRedeemRequest = {
  /**
   * @RequestPart param
   * @Required
   */
  rewardID: RewardID;

  /**
   * @RequestPart header
   * @Required
   */
  userID: UserID;
};

export type RewardRedeem = ActionHandler<RewardRedeemRequest, { id: UserRewardID }>;

/**
 * Redeeming only creates a pending request. The points and the stock are checked and taken on its approval.
 *
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller { "method": "post", "path": "/api/v1/reward/:rewardID/redeem", "tag": "reward", "status": 201 }
 */
export function implRewardRedeem(findOneUser: FindOneUser, findOneReward: FindOneReward, generateID: GenerateID, saveUserReward: SaveUserReward): RewardRedeem {
  return async (ctx, req) => {
    const user = await findOneUser(ctx, req.userID);
    if (!user) {
      throw new NotFoundError("user not found");
    }

    assertUserIsActive(user);

    const reward = await findOneReward(ctx, req.rewardID);
    if (!reward) {
      throw new NotFoundError("reward not found");
    }

    const id = await saveUserReward(ctx, newUserReward(await generateID(ctx), user.id, reward.id, ctx.date));

    return { id };
  };
}
