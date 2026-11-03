import { markTodo, newTodo, NotFoundError } from "./model_todo.js";
import { CreateTodo, FindTodoById, FindTodos, GenerateTodoId, GetCurrentDate, ListTodo, MarkTodo, SaveTodo } from "./types.js";

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "post", "path": "/todos", "status": 201 }
 */
export function implCreateTodo(generateTodoId: GenerateTodoId, getCurrentDate: GetCurrentDate, saveTodo: SaveTodo): CreateTodo {
  return async (ctx, req) => {
    const todo = newTodo(await generateTodoId(ctx), req.title, await getCurrentDate(ctx));

    await saveTodo(ctx, todo);

    return todo;
  };
}

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "patch", "path": "/todos/:id" }
 */
export function implMarkTodo(findTodoById: FindTodoById, getCurrentDate: GetCurrentDate, saveTodo: SaveTodo): MarkTodo {
  return async (ctx, req) => {
    const todo = await findTodoById(ctx, { id: req.id });

    if (!todo) {
      throw new NotFoundError(`todo ${req.id} not found`);
    }

    const updatedTodo = markTodo(todo, req.done, await getCurrentDate(ctx));

    await saveTodo(ctx, updatedTodo);

    return updatedTodo;
  };
}

/**
 * @Action {"readTypeArguments": true}
 * @Controller { "method": "get", "path": "/todos" }
 */
export function implListTodo(findTodos: FindTodos): ListTodo {
  return async (ctx, req) => {
    const items = await findTodos(ctx, { done: req.status === undefined ? undefined : req.status === "done" });

    return { items, total: items.length };
  };
}
