import { ConflictError } from "./error.js";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApprovalAction = "APPROVE" | "REJECT";

export type Approval = {
  status: ApprovalStatus;
  approvalDate: string | null;
};

export function applyApproval<T extends Approval>(entity: T, action: ApprovalAction, now: Date): T {
  // an approval can only happen once, otherwise the points would be counted twice
  if (entity.status !== "PENDING") {
    throw new ConflictError(`it has been ${entity.status} before`);
  }

  return { ...entity, status: action === "APPROVE" ? "APPROVED" : "REJECTED", approvalDate: now.toISOString() };
}
