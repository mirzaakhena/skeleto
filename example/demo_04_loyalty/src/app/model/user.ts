import { ConflictError, ValidationError } from "./error.js";
import { Pagination } from "./pagination.js";

export type UserID = string;

export type UserStatus = "ACTIVE" | "NON_ACTIVE";

export type User = {
  id: UserID;
  name: string;
  createdDate: string;
  totalPoints: number;
  status: UserStatus;
};

export type FindManyUserFilter = Pagination & {
  nameLike?: string;
  totalPointMin?: number;
  totalPointMax?: number;
  status?: UserStatus;
};

const INITIAL_POINTS = 1000;

export function newUser(id: UserID, name: string, now: Date): User {
  const trimmedName = name.trim();

  if (trimmedName === "") {
    throw new ValidationError("name must not be empty");
  }

  return { id, name: trimmedName, createdDate: now.toISOString(), totalPoints: INITIAL_POINTS, status: "NON_ACTIVE" };
}

export function assertUserIsActive(user: User) {
  if (user.status === "NON_ACTIVE") {
    throw new ConflictError("user is non active");
  }
}

export function changeUserStatus(user: User, status: UserStatus): User {
  return { ...user, status };
}

export function increaseUserPoint(user: User, point: number): User {
  return { ...user, totalPoints: user.totalPoints + point };
}

export function decreaseUserPoint(user: User, point: number): User {
  if (user.totalPoints - point < 0) {
    throw new ConflictError("not enough points");
  }

  return { ...user, totalPoints: user.totalPoints - point };
}
