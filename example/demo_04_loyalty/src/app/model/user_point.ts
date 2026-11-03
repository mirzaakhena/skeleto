import { Pagination } from "./pagination.js";
import { UserID } from "./user.js";

export type UserPointID = string;

/**
 * One line of the point history: positive when the user earns points, negative when the user spends them
 */
export type UserPoint = {
  id: UserPointID;
  userID: UserID;
  point: number;
  createdDate: string;
};

export type FindManyUserPointFilter = Pagination;

export function newUserPoint(id: UserPointID, userID: UserID, point: number, now: Date): UserPoint {
  return { id, userID, point, createdDate: now.toISOString() };
}
