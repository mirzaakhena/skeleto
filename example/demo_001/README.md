# Skeleto Demo

## Prepare database

Create `postgres` database with specification

```
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASS=root
DATABASE_NAME=person_db
```

## Install dependency

```bash
$ npm i
```

## Run Application

```bash
$ npm run dev
```

You will see output

```
> skeleto-demo@0.0.1 dev
> tsx src/index.ts

┌─────────┬──────────┬──────────────────────────┬──────────┬──────────────────────┐
│ (index) │ tag      │ usecase                  │ method   │ path                 │
├─────────┼──────────┼──────────────────────────┼──────────┼──────────────────────┤
│ 0       │ 'PERSON' │ 'Register Unique Person' │ '  POST' │ '/person/:something' │
└─────────┴──────────┴──────────────────────────┴──────────┴──────────────────────┘
Server is running on : http://localhost:3001
OpenAPI              : https://editor.swagger.io/?url=http://localhost:3001/openapi
```
