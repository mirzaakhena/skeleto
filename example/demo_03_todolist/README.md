# Skeleto Todo List Demo

A REST API with three use cases: `CreateTodo`, `MarkTodo` and `ListTodo`. The data lives in memory, so it runs without a database.

## What this demo shows

| Feature | Where |
| --- | --- |
| Primary functions (use cases) | `src/app/usecase.ts` |
| Secondary functions (gateways) | `src/app/gateway.ts` |
| `@Config` injected into `@Action` and `@Wrapper` | `src/app/config.ts` |
| `readTypeArguments` used outside HTTP | `src/infrastructure/validation.ts` |
| `@Wrapper` order with `ordinal` | `src/infrastructure/logging.ts` |
| Registering decorators at startup | `src/infrastructure/decorators.ts` |
| Testing a use case without starting Skeleto | `test/usecase.test.ts` |

`src/app` never imports Express. The use case only knows HTTP through the `@Controller` and `@RequestPart` metadata, which is a deliberate trade-off to keep the code small. If you prefer a full separation, remove both decorators and call the use cases from your own controller.

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

The server runs on port `3002`. Set `PORT` to change it, and `LOGGING=false` to turn the logging off.

## Try it

```bash
# create a todo: 201
$ curl -i -X POST localhost:3002/todos -H 'Content-Type: application/json' -d '{"title": "Write docs"}'

# mark it as done, using the id from the previous response: 200
$ curl -i -X PATCH localhost:3002/todos/<id> -H 'Content-Type: application/json' -d '{"done": true}'

# list all todos, or only the "open" or "done" ones: 200
$ curl -i localhost:3002/todos
$ curl -i 'localhost:3002/todos?status=done'
```

Invalid requests are rejected by the validation wrapper:

```bash
# 400: title is required
$ curl -i -X POST localhost:3002/todos -H 'Content-Type: application/json' -d '{}'

# 400: done must be a boolean
$ curl -i -X PATCH localhost:3002/todos/<id> -H 'Content-Type: application/json' -d '{"done": "yes"}'

# 400: status must be one of: open, done
$ curl -i 'localhost:3002/todos?status=archived'

# 404: todo not found
$ curl -i -X PATCH localhost:3002/todos/unknown -H 'Content-Type: application/json' -d '{"done": true}'
```

## Run the tests

```bash
$ npm test
```

## Try the decorator registration

Change the first `@Controller` to `@Controler` in `src/app/usecase.ts`, then run the application. It stops before any function runs:

```
Invalid decorator usage:
  - CreateTodo: decorator @Controler is not registered
  - CreateTodo: field title: decorator @RequestPart requires @Controller on the function
```
