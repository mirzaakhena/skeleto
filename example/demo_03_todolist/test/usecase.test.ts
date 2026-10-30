import assert from "node:assert/strict";
import { test } from "node:test";
import { newContext } from "skeleto";
import { NotFoundError, Todo, ValidationError } from "../src/app/model_todo.js";
import { FindTodoById, FindTodos, GenerateTodoId, GetCurrentDate, SaveTodo } from "../src/app/types.js";
import { implCreateTodo, implListTodo, implMarkTodo } from "../src/app/usecase.js";

// a use case is only a closure, so the test injects its dependencies by hand without starting skeleto
const now = new Date("2026-01-02T03:04:05.000Z");
const generateTodoId: GenerateTodoId = async () => "todo-1";
const getCurrentDate: GetCurrentDate = async () => now;

const openTodo: Todo = { id: "todo-1", title: "Write docs", done: false, createdAt: "2026-01-01T00:00:00.000Z", doneAt: null };

function fakeSaveTodo() {
  const saved: Todo[] = [];
  const saveTodo: SaveTodo = async (ctx, req) => {
    saved.push(req);
  };
  return { saved, saveTodo };
}

test("createTodo saves a new open todo with a trimmed title", async () => {
  const { saved, saveTodo } = fakeSaveTodo();
  const createTodo = implCreateTodo(generateTodoId, getCurrentDate, saveTodo);

  const result = await createTodo(newContext(), { title: "  Write docs  " });

  assert.deepEqual(result, { id: "todo-1", title: "Write docs", done: false, createdAt: now.toISOString(), doneAt: null });
  assert.deepEqual(saved, [result]);
});

test("createTodo rejects a blank title and saves nothing", async () => {
  const { saved, saveTodo } = fakeSaveTodo();
  const createTodo = implCreateTodo(generateTodoId, getCurrentDate, saveTodo);

  await assert.rejects(createTodo(newContext(), { title: "   " }), ValidationError);
  assert.deepEqual(saved, []);
});

test("markTodo marks a todo as done and back to open", async () => {
  const { saveTodo } = fakeSaveTodo();
  const findTodoById: FindTodoById = async () => openTodo;
  const markTodo = implMarkTodo(findTodoById, getCurrentDate, saveTodo);

  const done = await markTodo(newContext(), { id: "todo-1", done: true });
  assert.equal(done.done, true);
  assert.equal(done.doneAt, now.toISOString());

  const reopen = implMarkTodo(async () => done, getCurrentDate, saveTodo);
  const open = await reopen(newContext(), { id: "todo-1", done: false });
  assert.equal(open.done, false);
  assert.equal(open.doneAt, null);
});

test("markTodo keeps the original time when the todo is already done", async () => {
  const { saveTodo } = fakeSaveTodo();
  const doneTodo: Todo = { ...openTodo, done: true, doneAt: "2026-01-01T12:00:00.000Z" };
  const markTodo = implMarkTodo(async () => doneTodo, getCurrentDate, saveTodo);

  const result = await markTodo(newContext(), { id: "todo-1", done: true });

  assert.equal(result.doneAt, "2026-01-01T12:00:00.000Z");
});

test("markTodo rejects an unknown todo", async () => {
  const { saveTodo } = fakeSaveTodo();
  const markTodo = implMarkTodo(async () => null, getCurrentDate, saveTodo);

  await assert.rejects(markTodo(newContext(), { id: "unknown", done: true }), NotFoundError);
});

test("listTodo translates the status into the done filter", async () => {
  const filters: (boolean | undefined)[] = [];
  const findTodos: FindTodos = async (ctx, req) => {
    filters.push(req.done);
    return [openTodo];
  };
  const listTodo = implListTodo(findTodos);

  assert.deepEqual(await listTodo(newContext(), {}), { items: [openTodo], total: 1 });
  await listTodo(newContext(), { status: "open" });
  await listTodo(newContext(), { status: "done" });

  assert.deepEqual(filters, [undefined, false, true]);
});
