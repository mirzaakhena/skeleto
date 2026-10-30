import { ActionHandler } from "skeleto";
import { FindManyUserPoint } from "../gateway/contracts.js";
import { UserPoint } from "../model/user_point.js";

type UserPointGetAllRequest = {
  /**
   * @RequestPart query
   */
  page?: number;

  /**
   * @RequestPart query
   */
  size?: number;
};

export type UserPointGetAll = ActionHandler<UserPointGetAllRequest, { items: UserPoint[]; count: number }>;

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "get", "path": "/api/v1/userpoint", "tag": "user_point" }
 */
export function implUserPointGetAll(findManyUserPoint: FindManyUserPoint): UserPointGetAll {
  return async (ctx, req) => {
    const [items, count] = await findManyUserPoint(ctx, req);

    return { items, count };
  };
}
