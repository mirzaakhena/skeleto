import { ActionHandler } from "skeleto";
import { FindManyUser, FindOneUser, GenerateID, SaveUser } from "../gateway/contracts.js";
import { NotFoundError } from "../model/error.js";
import { changeUserStatus, newUser, User, UserID, UserStatus } from "../model/user.js";

type UserCreateRequest = {
  /**
   * @RequestPart body
   * @Required
   */
  name: string;
};

export type UserCreate = ActionHandler<UserCreateRequest, { id: UserID }>;

/**
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller { "method": "post", "path": "/api/v1/user", "tag": "user", "status": 201 }
 */
export function implUserCreate(generateID: GenerateID, saveUser: SaveUser): UserCreate {
  return async (ctx, req) => {
    const id = await saveUser(ctx, newUser(await generateID(ctx), req.name, ctx.date));

    return { id };
  };
}

type UserGetAllRequest = {
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
  nameLike?: string;

  /**
   * @RequestPart query
   */
  totalPointMin?: number;

  /**
   * @RequestPart query
   */
  totalPointMax?: number;

  /**
   * @RequestPart query
   * @OneOf {"values": ["ACTIVE", "NON_ACTIVE"]}
   */
  status?: UserStatus;
};

export type UserGetAll = ActionHandler<UserGetAllRequest, { items: User[]; count: number }>;

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "get", "path": "/api/v1/user", "tag": "user" }
 */
export function implUserGetAll(findManyUser: FindManyUser): UserGetAll {
  return async (ctx, req) => {
    const [items, count] = await findManyUser(ctx, req);

    return { items, count };
  };
}

type UserChangeStatusRequest = {
  /**
   * @RequestPart param
   * @Required
   */
  userID: UserID;

  /**
   * @RequestPart body
   * @Required
   * @OneOf {"values": ["ACTIVE", "NON_ACTIVE"]}
   */
  status: UserStatus;
};

export type UserChangeStatus = ActionHandler<UserChangeStatusRequest, { id: UserID; status: UserStatus }>;

/**
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller { "method": "put", "path": "/api/v1/user/:userID/status", "tag": "user" }
 */
export function implUserChangeStatus(findOneUser: FindOneUser, saveUser: SaveUser): UserChangeStatus {
  return async (ctx, req) => {
    const user = await findOneUser(ctx, req.userID);
    if (!user) {
      throw new NotFoundError("user not found");
    }

    const updatedUser = changeUserStatus(user, req.status);
    await saveUser(ctx, updatedUser);

    return { id: updatedUser.id, status: updatedUser.status };
  };
}
