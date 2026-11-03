import { randomUUID } from "node:crypto";
import { FindTodoById, FindTodos, GenerateTodoId, GetCurrentDate, SaveTodo, TodoStore } from "./types.js";

/**
 * @Action
 */
export function implGenerateTodoId(): GenerateTodoId {
  return async () => randomUUID();
}

/**
 * @Action
 */
export function implGetCurrentDate(): GetCurrentDate {
  return async () => new Date();
}

/**
 * @Action
 */
export function implSaveTodo(store: TodoStore): SaveTodo {
  return async (ctx, req) => {
    store.set(req.id, req);
  };
}

/**
 * @Action
 */
export function implFindTodoById(store: TodoStore): FindTodoById {
  return async (ctx, req) => store.get(req.id) ?? null;
}

/**
 * @Action
 */
export function implFindTodos(store: TodoStore): FindTodos {
  return async (ctx, req) => {
    const todos = Array.from(store.values());
    return req.done === undefined ? todos : todos.filter((x) => x.done === req.done);
  };
}
