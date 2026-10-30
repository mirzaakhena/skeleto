export type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  doneAt: string | null;
};

export class ValidationError extends Error {}

export class NotFoundError extends Error {}

export function newTodo(id: string, title: string, now: Date): Todo {
  const trimmedTitle = title.trim();

  if (trimmedTitle === "") {
    throw new ValidationError("title must not be empty");
  }

  return { id, title: trimmedTitle, done: false, createdAt: now.toISOString(), doneAt: null };
}

export function markTodo(todo: Todo, done: boolean, now: Date): Todo {
  // keep the original time when the todo is already in the requested state
  if (todo.done === done) return todo;

  return { ...todo, done, doneAt: done ? now.toISOString() : null };
}
