# Skeleto Loyalty Demo

A loyalty point REST API. Users upload shopping receipts to earn points, then spend the points on rewards. An admin approves the receipts and the redeemed rewards. The requirements come from the [cleanjs](https://github.com/mirzaakhena/cleanjs) project.

The data lives in memory, so it runs without a database.

## Requirements

| Use case | Method and path | Rules |
| --- | --- | --- |
| `UserCreate` | `POST /api/v1/user` | The name must not be empty. A new user is `NON_ACTIVE` with 1000 points |
| `UserGetAll` | `GET /api/v1/user` | Filter by `nameLike`, `totalPointMin`, `totalPointMax`, `status` |
| `UserChangeStatus` | `PUT /api/v1/user/:userID/status` | `ACTIVE` or `NON_ACTIVE` |
| `RewardCreate` | `POST /api/v1/reward` | Title, description, point and stock |
| `RewardGetAll` | `GET /api/v1/reward` | |
| `RewardRedeem` | `POST /api/v1/reward/:rewardID/redeem` | The user must be active. It creates a `PENDING` user reward and takes nothing yet |
| `ReceiptUpload` | `POST /api/v1/receipt` | The user must be active. It creates a `PENDING` receipt |
| `ReceiptGetAll` | `GET /api/v1/receipt` | Filter by `userID`, `billNumber`, `status` |
| `ReceiptApproval` | `POST /api/v1/receipt/:receiptID/approval` | Only once. `APPROVE` gives 10 points, `REJECT` gives nothing |
| `UserRewardGetAll` | `GET /api/v1/userreward` | Filter by `userID` |
| `UserRewardApproval` | `POST /api/v1/userreward/:userRewardID/approval` | Only once. `APPROVE` takes one stock and the reward points, or fails and changes nothing. `REJECT` takes nothing |
| `UserPointGetAll` | `GET /api/v1/userpoint` | The history of every earned and spent point |

Every `GetAll` accepts `page` and `size`, and returns `items` and `count`.

### Differences from cleanjs

- `UserRewardApproval` only accepts a `PENDING` request. In cleanjs it can be approved twice, which takes the points twice.
- `RewardRedeem` returns the id of the new user reward, because the approval needs it. cleanjs returns the reward id.
- The fields `screenshot` and `image` are left out, because no use case in cleanjs reads them.
- Reward values and receipt totals are validated, and errors use 400, 404 and 409. cleanjs answers every error with 400.
- The approved receipt point stays fixed at 10, which cleanjs also marks as an open question.

## What this demo shows

| Feature | Where |
| --- | --- |
| A use case orchestrating models and gateways | `src/app/usecase/` |
| Business rules in plain functions | `src/app/model/` |
| Gateways that can be replaced without changing the use cases | `src/app/gateway/` |
| `@Transaction` rolling back a failed approval | `src/infrastructure/transaction.ts` |
| `readTypeArguments` used outside HTTP | `src/infrastructure/validation.ts` |
| A wrapper that skips the gateways | `src/infrastructure/logging.ts` |
| `ctx.date` instead of a clock gateway | `src/app/usecase/` |
| Registering decorators at startup | `src/infrastructure/decorators.ts` |
| Testing a use case without starting Skeleto | `test/usecase.test.ts` |
| Testing the running application | `test/api.test.ts` |

The wrappers run in this order, from the outside: `Logging` (3), `Validation` (2), `Transaction` (1). An invalid request is logged but never opens a transaction.

## Install dependency

This demo uses the Skeleto source of this repository, so build it first:

```bash
# from the repository root
$ npm ci
$ npm run build

# from this folder
$ npm i
```

## Run Application

```bash
$ npm run dev
```

The server runs on port `3003`. Set `PORT` to change it, and `LOGGING=false` to turn the logging off.

## Try it

```bash
BASE=localhost:3003/api/v1
JSON='Content-Type: application/json'

# create a user, then activate it using the returned id
curl -X POST $BASE/user -H "$JSON" -d '{"name": "Ade"}'
curl -X PUT $BASE/user/<userID>/status -H "$JSON" -d '{"status": "ACTIVE"}'

# upload a receipt and approve it: the user earns 10 points
curl -X POST $BASE/receipt -H "$JSON" -H "userID: <userID>" -d '{"billNumber": "BILL-1", "totalTransaksi": 50000}'
curl -X POST $BASE/receipt/<receiptID>/approval -H "$JSON" -d '{"status": "APPROVE"}'

# create a reward, redeem it and approve it: the user spends 100 points
curl -X POST $BASE/reward -H "$JSON" -d '{"title": "Voucher", "description": "Shopping voucher", "point": 100, "stock": 5}'
curl -X POST $BASE/reward/<rewardID>/redeem -H "userID: <userID>"
curl -X POST $BASE/userreward/<userRewardID>/approval -H "$JSON" -d '{"status": "APPROVE"}'

# see the result
curl "$BASE/user?status=ACTIVE"
curl $BASE/userpoint
```

## Run the tests

```bash
$ npm test
```

## Limitations

- The transaction wrapper runs one transaction at a time, in one process. A `GetAll` that runs during a transaction can see its unfinished data. A real database solves both.
- The requests repeat `page` and `size`, because `readTypeArguments` does not read intersection types like `Pagination & {...}` yet.
- `@OneOf` repeats the values of the union types, because the type metadata is only text for now.
- There is no authentication. The `userID` header stands for the logged in user, and anyone can approve.
