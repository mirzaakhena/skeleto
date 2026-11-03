import { ActionHandler, WrapperHandler } from "skeleto";
import { Todo } from "./model_todo.js";

// config
export type AppConfig = { port: number; logging: boolean };

export type TodoStore = Map<string, Todo>;

// wrapper
export type Validation = WrapperHandler;

export type Logging = WrapperHandler;

// gateway
export type GenerateTodoId = ActionHandler<void, string>;

export type GetCurrentDate = ActionHandler<void, Date>;

export type SaveTodo = ActionHandler<Todo, void>;

export type FindTodoById = ActionHandler<{ id: string }, Todo | null>;

export type FindTodos = ActionHandler<{ done?: boolean }, Todo[]>;

// use case
type CreateTodoRequest = {
  /**
   * @RequestPart body
   * @Required
   */
  title: string;
};

export type CreateTodo = ActionHandler<CreateTodoRequest, Todo>;

type MarkTodoRequest = {
  /**
   * @RequestPart param
   * @Required
   */
  id: string;

  /**
   * @RequestPart body
   * @Required
   */
  done: boolean;
};

export type MarkTodo = ActionHandler<MarkTodoRequest, Todo>;

type ListTodoRequest = {
  /**
   * @RequestPart query
   * @OneOf {"values": ["open", "done"]}
   */
  status?: "open" | "done";
};

type ListTodoResponse = {
  items: Todo[];
  total: number;
};

export type ListTodo = ActionHandler<ListTodoRequest, ListTodoResponse>;
