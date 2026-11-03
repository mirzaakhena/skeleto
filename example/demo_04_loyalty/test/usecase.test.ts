import assert from "node:assert/strict";
import { test } from "node:test";
import { newContext } from "skeleto";
import { GenerateID, SaveReceipt, SaveUser, SaveUserPoint } from "../src/app/gateway/contracts.js";
import { ConflictError, NotFoundError } from "../src/app/model/error.js";
import { Receipt } from "../src/app/model/receipt.js";
import { User } from "../src/app/model/user.js";
import { UserPoint } from "../src/app/model/user_point.js";
import { implReceiptApproval, implReceiptUpload } from "../src/app/usecase/usecase_receipt.js";

// a use case is only a closure, so the test injects its dependencies by hand without starting skeleto
const now = new Date("2026-01-02T03:04:05.000Z");
const ctx = () => ({ ...newContext(), date: now });

const user: User = { id: "u1", name: "Ade", createdDate: now.toISOString(), totalPoints: 1000, status: "ACTIVE" };
const receipt: Receipt = { id: "r1", userID: "u1", billNumber: "BILL-1", totalTransaksi: 50000, createdDate: now.toISOString(), status: "PENDING", approvalDate: null };

const generateID: GenerateID = async () => "new-id";

function createApproval(existingReceipt: Receipt | null) {
  const saved = { receipts: [] as Receipt[], users: [] as User[], userPoints: [] as UserPoint[] };

  const saveReceipt: SaveReceipt = async (c, req) => {
    saved.receipts.push(req);
    return req.id;
  };
  const saveUser: SaveUser = async (c, req) => {
    saved.users.push(req);
    return req.id;
  };
  const saveUserPoint: SaveUserPoint = async (c, req) => {
    saved.userPoints.push(req);
    return req.id;
  };

  const approval = implReceiptApproval(async () => existingReceipt, saveReceipt, async () => user, saveUser, generateID, saveUserPoint);

  return { approval, saved };
}

test("approving a receipt adds points to the user and to the history", async () => {
  const { approval, saved } = createApproval(receipt);

  const result = await approval(ctx(), { receiptID: "r1", status: "APPROVE" });

  assert.deepEqual(result, { id: "r1", status: "APPROVED" });
  assert.equal(saved.receipts[0].approvalDate, now.toISOString());
  assert.equal(saved.users[0].totalPoints, 1010);
  assert.deepEqual(saved.userPoints, [{ id: "new-id", userID: "u1", point: 10, createdDate: now.toISOString() }]);
});

test("rejecting a receipt gives no points", async () => {
  const { approval, saved } = createApproval(receipt);

  const result = await approval(ctx(), { receiptID: "r1", status: "REJECT" });

  assert.deepEqual(result, { id: "r1", status: "REJECTED" });
  assert.deepEqual(saved.users, []);
  assert.deepEqual(saved.userPoints, []);
});

test("a receipt can only be approved once", async () => {
  const { approval, saved } = createApproval({ ...receipt, status: "APPROVED" });

  await assert.rejects(approval(ctx(), { receiptID: "r1", status: "APPROVE" }), ConflictError);
  assert.deepEqual(saved.receipts, []);
});

test("approving an unknown receipt fails", async () => {
  const { approval } = createApproval(null);

  await assert.rejects(approval(ctx(), { receiptID: "r1", status: "APPROVE" }), NotFoundError);
});

test("a non active user cannot upload a receipt", async () => {
  const upload = implReceiptUpload(async () => ({ ...user, status: "NON_ACTIVE" }), generateID, async (c, req) => req.id);

  await assert.rejects(upload(ctx(), { userID: "u1", billNumber: "BILL-1", totalTransaksi: 50000 }), ConflictError);
});
