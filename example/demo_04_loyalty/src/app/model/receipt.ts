import { Approval, ApprovalStatus } from "./approval.js";
import { ValidationError } from "./error.js";
import { Pagination } from "./pagination.js";
import { UserID } from "./user.js";

export type ReceiptID = string;

export type Receipt = Approval & {
  id: ReceiptID;
  userID: UserID;
  createdDate: string;
  billNumber: string;
  totalTransaksi: number;
};

export type FindManyReceiptFilter = Pagination & {
  userID?: UserID;
  billNumber?: string;
  status?: ApprovalStatus;
};

// the source requirement also marks this as a fixed value for now
export const APPROVED_RECEIPT_POINT = 10;

export function newReceipt(id: ReceiptID, userID: UserID, billNumber: string, totalTransaksi: number, now: Date): Receipt {
  if (billNumber.trim() === "") {
    throw new ValidationError("billNumber must not be empty");
  }

  if (totalTransaksi <= 0) {
    throw new ValidationError("totalTransaksi must be greater than zero");
  }

  return { id, userID, billNumber: billNumber.trim(), totalTransaksi, createdDate: now.toISOString(), status: "PENDING", approvalDate: null };
}
