import { ActionHandler } from "skeleto";
import { FindManyReceipt, FindOneReceipt, FindOneUser, GenerateID, SaveReceipt, SaveUser, SaveUserPoint } from "../gateway/contracts.js";
import { ApprovalAction, ApprovalStatus, applyApproval } from "../model/approval.js";
import { NotFoundError } from "../model/error.js";
import { APPROVED_RECEIPT_POINT, newReceipt, Receipt, ReceiptID } from "../model/receipt.js";
import { assertUserIsActive, increaseUserPoint, UserID } from "../model/user.js";
import { newUserPoint } from "../model/user_point.js";

type ReceiptUploadRequest = {
  /**
   * @RequestPart header
   * @Required
   */
  userID: UserID;

  /**
   * @RequestPart body
   * @Required
   */
  billNumber: string;

  /**
   * @RequestPart body
   * @Required
   */
  totalTransaksi: number;
};

export type ReceiptUpload = ActionHandler<ReceiptUploadRequest, { id: ReceiptID }>;

/**
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller { "method": "post", "path": "/api/v1/receipt", "tag": "receipt", "status": 201 }
 */
export function implReceiptUpload(findOneUser: FindOneUser, generateID: GenerateID, saveReceipt: SaveReceipt): ReceiptUpload {
  return async (ctx, req) => {
    const user = await findOneUser(ctx, req.userID);
    if (!user) {
      throw new NotFoundError("user not found");
    }

    assertUserIsActive(user);

    const id = await saveReceipt(ctx, newReceipt(await generateID(ctx), user.id, req.billNumber, req.totalTransaksi, ctx.date));

    return { id };
  };
}

type ReceiptGetAllRequest = {
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

  /**
   * @RequestPart query
   */
  billNumber?: string;

  /**
   * @RequestPart query
   * @OneOf {"values": ["PENDING", "APPROVED", "REJECTED"]}
   */
  status?: ApprovalStatus;
};

export type ReceiptGetAll = ActionHandler<ReceiptGetAllRequest, { items: Receipt[]; count: number }>;

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "get", "path": "/api/v1/receipt", "tag": "receipt" }
 */
export function implReceiptGetAll(findManyReceipt: FindManyReceipt): ReceiptGetAll {
  return async (ctx, req) => {
    const [items, count] = await findManyReceipt(ctx, req);

    return { items, count };
  };
}

type ReceiptApprovalRequest = {
  /**
   * @RequestPart param
   * @Required
   */
  receiptID: ReceiptID;

  /**
   * @RequestPart body
   * @Required
   * @OneOf {"values": ["APPROVE", "REJECT"]}
   */
  status: ApprovalAction;
};

export type ReceiptApproval = ActionHandler<ReceiptApprovalRequest, { id: ReceiptID; status: ApprovalStatus }>;

/**
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller { "method": "post", "path": "/api/v1/receipt/:receiptID/approval", "tag": "receipt" }
 */
export function implReceiptApproval(
  findOneReceipt: FindOneReceipt,
  saveReceipt: SaveReceipt,
  findOneUser: FindOneUser,
  saveUser: SaveUser,
  generateID: GenerateID,
  saveUserPoint: SaveUserPoint
): ReceiptApproval {
  return async (ctx, req) => {
    const receipt = await findOneReceipt(ctx, req.receiptID);
    if (!receipt) {
      throw new NotFoundError("receipt not found");
    }

    const updatedReceipt = applyApproval(receipt, req.status, ctx.date);
    await saveReceipt(ctx, updatedReceipt);

    if (updatedReceipt.status === "REJECTED") {
      return { id: updatedReceipt.id, status: updatedReceipt.status };
    }

    const user = await findOneUser(ctx, updatedReceipt.userID);
    if (!user) {
      throw new NotFoundError("user not found");
    }

    await saveUser(ctx, increaseUserPoint(user, APPROVED_RECEIPT_POINT));
    await saveUserPoint(ctx, newUserPoint(await generateID(ctx), user.id, APPROVED_RECEIPT_POINT, ctx.date));

    return { id: updatedReceipt.id, status: updatedReceipt.status };
  };
}
