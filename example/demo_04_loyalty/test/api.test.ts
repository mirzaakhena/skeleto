import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { Server } from "node:http";
import { after, before, test } from "node:test";
import { createServer } from "../src/server.js";

process.env.LOGGING = "false";

let server: Server;
let baseUrl: string;

before(async () => {
  const { app } = await createServer();
  server = app.listen(0);
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/api/v1`;
});

after(() => {
  server.close();
});

async function call(method: string, path: string, options: { body?: unknown; userID?: string } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(options.userID ? { userID: options.userID } : {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return { status: res.status, body: (await res.json()) as any };
}

async function createActiveUser(name: string) {
  const { body } = await call("POST", "/user", { body: { name } });
  await call("PUT", `/user/${body.id}/status`, { body: { status: "ACTIVE" } });
  return body.id as string;
}

async function createReward(point: number, stock: number) {
  const { body } = await call("POST", "/reward", { body: { title: "Voucher", description: "Shopping voucher", point, stock } });
  return body.id as string;
}

async function getUser(id: string) {
  const { body } = await call("GET", "/user?size=1000");
  return body.items.find((x: any) => x.id === id);
}

async function getReward(id: string) {
  const { body } = await call("GET", "/reward?size=1000");
  return body.items.find((x: any) => x.id === id);
}

async function getUserReward(id: string) {
  const { body } = await call("GET", "/userreward?size=1000");
  return body.items.find((x: any) => x.id === id);
}

async function countUserPoints() {
  const { body } = await call("GET", "/userpoint?size=1");
  return body.count as number;
}

test("a new user starts non active with 1000 points", async () => {
  const { status, body } = await call("POST", "/user", { body: { name: "  Ade  " } });
  assert.equal(status, 201);

  const user = await getUser(body.id);
  assert.equal(user.name, "Ade");
  assert.equal(user.status, "NON_ACTIVE");
  assert.equal(user.totalPoints, 1000);
});

test("a non active user cannot upload a receipt or redeem a reward", async () => {
  const { body } = await call("POST", "/user", { body: { name: "Asep" } });
  const rewardID = await createReward(10, 1);

  const upload = await call("POST", "/receipt", { userID: body.id, body: { billNumber: "BILL-1", totalTransaksi: 1000 } });
  assert.equal(upload.status, 409);

  const redeem = await call("POST", `/reward/${rewardID}/redeem`, { userID: body.id });
  assert.equal(redeem.status, 409);
});

test("an approved receipt gives 10 points once, a rejected one gives nothing", async () => {
  const userID = await createActiveUser("Anto");
  const pointsBefore = await countUserPoints();

  const approved = await call("POST", "/receipt", { userID, body: { billNumber: "BILL-2", totalTransaksi: 50000 } });
  assert.equal(approved.status, 201);

  const approval = await call("POST", `/receipt/${approved.body.id}/approval`, { body: { status: "APPROVE" } });
  assert.deepEqual(approval, { status: 200, body: { id: approved.body.id, status: "APPROVED" } });
  assert.equal((await getUser(userID)).totalPoints, 1010);
  assert.equal(await countUserPoints(), pointsBefore + 1);

  const again = await call("POST", `/receipt/${approved.body.id}/approval`, { body: { status: "APPROVE" } });
  assert.equal(again.status, 409);
  assert.equal((await getUser(userID)).totalPoints, 1010);

  const rejected = await call("POST", "/receipt", { userID, body: { billNumber: "BILL-3", totalTransaksi: 50000 } });
  const rejection = await call("POST", `/receipt/${rejected.body.id}/approval`, { body: { status: "REJECT" } });
  assert.equal(rejection.body.status, "REJECTED");
  assert.equal((await getUser(userID)).totalPoints, 1010);
});

test("receipts can be filtered", async () => {
  const userID = await createActiveUser("Budi");
  await call("POST", "/receipt", { userID, body: { billNumber: "BILL-FILTER", totalTransaksi: 1000 } });

  const { body } = await call("GET", `/receipt?userID=${userID}&billNumber=BILL-FILTER&status=PENDING`);

  assert.equal(body.count, 1);
  assert.equal(body.items[0].userID, userID);
});

test("redeeming takes nothing until it is approved", async () => {
  const userID = await createActiveUser("Citra");
  const rewardID = await createReward(100, 5);

  const redeem = await call("POST", `/reward/${rewardID}/redeem`, { userID });
  assert.equal(redeem.status, 201);
  assert.equal((await getUser(userID)).totalPoints, 1000);
  assert.equal((await getReward(rewardID)).stock, 5);

  const approval = await call("POST", `/userreward/${redeem.body.id}/approval`, { body: { status: "APPROVE" } });
  assert.deepEqual(approval, { status: 200, body: { id: redeem.body.id, status: "APPROVED" } });
  assert.equal((await getUser(userID)).totalPoints, 900);
  assert.equal((await getReward(rewardID)).stock, 4);

  const again = await call("POST", `/userreward/${redeem.body.id}/approval`, { body: { status: "APPROVE" } });
  assert.equal(again.status, 409);
  assert.equal((await getUser(userID)).totalPoints, 900);
});

test("a rejected redeem takes nothing", async () => {
  const userID = await createActiveUser("Dewi");
  const rewardID = await createReward(100, 5);
  const redeem = await call("POST", `/reward/${rewardID}/redeem`, { userID });

  const rejection = await call("POST", `/userreward/${redeem.body.id}/approval`, { body: { status: "REJECT" } });

  assert.equal(rejection.body.status, "REJECTED");
  assert.equal((await getUser(userID)).totalPoints, 1000);
  assert.equal((await getReward(rewardID)).stock, 5);
});

test("the transaction rolls back when the stock runs out", async () => {
  const userID = await createActiveUser("Eka");
  const rewardID = await createReward(100, 0);
  const redeem = await call("POST", `/reward/${rewardID}/redeem`, { userID });

  const approval = await call("POST", `/userreward/${redeem.body.id}/approval`, { body: { status: "APPROVE" } });

  assert.equal(approval.status, 409);
  assert.equal(approval.body.message, "not enough stock");
  assert.equal((await getUserReward(redeem.body.id)).status, "PENDING");
});

test("the transaction rolls back the saved status and stock when the points run out", async () => {
  const userID = await createActiveUser("Fajar");
  const rewardID = await createReward(5000, 3);
  const redeem = await call("POST", `/reward/${rewardID}/redeem`, { userID });
  const pointsBefore = await countUserPoints();

  const approval = await call("POST", `/userreward/${redeem.body.id}/approval`, { body: { status: "APPROVE" } });

  assert.equal(approval.status, 409);
  assert.equal(approval.body.message, "not enough points");
  assert.equal((await getUserReward(redeem.body.id)).status, "PENDING");
  assert.equal((await getReward(rewardID)).stock, 3);
  assert.equal((await getUser(userID)).totalPoints, 1000);
  assert.equal(await countUserPoints(), pointsBefore);
});

test("concurrent approvals cannot take more than the stock", async () => {
  const rewardID = await createReward(10, 1);
  const first = await createActiveUser("Gita");
  const second = await createActiveUser("Hadi");
  const redeemFirst = await call("POST", `/reward/${rewardID}/redeem`, { userID: first });
  const redeemSecond = await call("POST", `/reward/${rewardID}/redeem`, { userID: second });

  const results = await Promise.all([
    call("POST", `/userreward/${redeemFirst.body.id}/approval`, { body: { status: "APPROVE" } }),
    call("POST", `/userreward/${redeemSecond.body.id}/approval`, { body: { status: "APPROVE" } }),
  ]);

  assert.deepEqual(results.map((x) => x.status).sort(), [200, 409]);
  assert.equal((await getReward(rewardID)).stock, 0);
});

test("users can be filtered with numbers converted from the query", async () => {
  const userID = await createActiveUser("Unique Filter Name");

  const found = await call("GET", "/user?nameLike=unique filter&totalPointMin=1000&totalPointMax=1000&status=ACTIVE");
  assert.deepEqual(found.body.items.map((x: any) => x.id), [userID]);

  const notFound = await call("GET", "/user?nameLike=unique filter&totalPointMin=1001");
  assert.equal(notFound.body.count, 0);
});

test("pagination returns the page and the total count", async () => {
  await createReward(1, 1);
  await createReward(2, 1);

  const { body } = await call("GET", "/reward?page=1&size=1");

  assert.equal(body.items.length, 1);
  assert.ok(body.count >= 2);
});

test("invalid requests are rejected", async () => {
  const userID = await createActiveUser("Indra");

  const cases = [
    [await call("POST", "/user", { body: {} }), "name is required"],
    [await call("POST", "/user", { body: { name: "   " } }), "name must not be empty"],
    [await call("POST", "/receipt", { body: { billNumber: "B", totalTransaksi: 1 } }), "userID is required"],
    [await call("POST", "/receipt", { userID, body: { billNumber: "B", totalTransaksi: "many" } }), "totalTransaksi must be a number"],
    [await call("POST", "/receipt", { userID, body: { billNumber: "B", totalTransaksi: 0 } }), "totalTransaksi must be greater than zero"],
    [await call("POST", "/reward", { body: { title: "T", description: "D", point: -1, stock: 1 } }), "point must be a non negative integer"],
    [await call("PUT", `/user/${userID}/status`, { body: { status: "SLEEPING" } }), "status must be one of: ACTIVE, NON_ACTIVE"],
    [await call("GET", "/user?page=abc"), "page must be a number"],
    [await call("GET", "/receipt?status=DONE"), "status must be one of: PENDING, APPROVED, REJECTED"],
  ] as const;

  for (const [response, message] of cases) {
    assert.equal(response.status, 400, message);
    assert.equal(response.body.message, message);
  }
});

test("unknown data returns not found", async () => {
  const userID = await createActiveUser("Joko");

  assert.equal((await call("PUT", "/user/unknown/status", { body: { status: "ACTIVE" } })).status, 404);
  assert.equal((await call("POST", "/receipt", { userID: "unknown", body: { billNumber: "B", totalTransaksi: 1 } })).status, 404);
  assert.equal((await call("POST", "/receipt/unknown/approval", { body: { status: "APPROVE" } })).status, 404);
  assert.equal((await call("POST", "/reward/unknown/redeem", { userID })).status, 404);
  assert.equal((await call("POST", "/userreward/unknown/approval", { body: { status: "APPROVE" } })).status, 404);
});
