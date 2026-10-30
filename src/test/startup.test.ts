// src/test/startup.test.ts

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Skeleto } from "../core/skeleto.js";

describe("Skeleto startup", () => {
  let root: string;

  // each case writes its own files, so it gets its own directory and instance
  const writeFixture = (name: string, files: Record<string, string>) => {
    const directory = join(root, name);
    mkdirSync(directory, { recursive: true });
    Object.entries(files).forEach(([file, content]) => writeFileSync(join(directory, file), content));
    return directory;
  };

  beforeAll(() => {
    root = mkdtempSync(join(process.cwd(), "src/test/.fixture-"));
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("rejects a @Wrapper that depends on an @Action", async () => {
    const directory = writeFixture("wrapper_on_action", {
      "app.ts": `
        export type Svc = () => string;
        export type Wrap = (h: any, m: any) => any;
        /** @Action */
        export function implSvc(): Svc { return () => "svc"; }
        /** @Wrapper */
        export function implWrap(svc: Svc): Wrap { return (h: any) => h; }
      `,
    });

    await expect(Skeleto.start(directory)).rejects.toThrow("@Wrapper Wrap cannot depend on @Action Svc");
  });

  it("rejects a @Config that depends on an @Action", async () => {
    const directory = writeFixture("config_on_action", {
      "app.ts": `
        export type Act = () => string;
        export type Out = {};
        /** @Action */
        export function implAct(): Act { return () => "x"; }
        /** @Config */
        export function implOut(act: Act): Out { return {}; }
      `,
    });

    await expect(Skeleto.start(directory)).rejects.toThrow("@Config Out cannot depend on @Action Act");
  });

  it("rejects an @Action that depends on a @Wrapper", async () => {
    const directory = writeFixture("action_on_wrapper", {
      "app.ts": `
        export type Wrap = (h: any, m: any) => any;
        export type Act = () => string;
        /** @Wrapper */
        export function implWrap(): Wrap { return (h: any) => h; }
        /** @Action */
        export function implAct(w: Wrap): Act { return () => "x"; }
      `,
    });

    await expect(Skeleto.start(directory)).rejects.toThrow("@Action Act cannot depend on @Wrapper Wrap");
  });

  it("rejects two functions returning the same type name", async () => {
    const directory = writeFixture("duplicate", {
      "one.ts": `
        export type Db = {};
        /** @Config */
        export function implDbA(): Db { return {}; }
      `,
      "two.ts": `
        export type Db = {};
        /** @Config */
        export function implDbB(): Db { return {}; }
      `,
    });

    await expect(Skeleto.start(directory)).rejects.toThrow("Type Db is returned by more than one function");
  });

  it("rejects a parameter without type annotation", async () => {
    const directory = writeFixture("untyped", {
      "app.ts": `
        export type S = {};
        /** @Config */
        export function implS(d): S { return {}; }
      `,
    });

    await expect(Skeleto.start(directory)).rejects.toThrow("Parameter d of function implS");
  });

  it("rejects a directory without TypeScript files", async () => {
    await expect(Skeleto.start(join(root, "does_not_exist"))).rejects.toThrow("No TypeScript files found");
  });

  it("scans again after a failed start", async () => {
    const directory = writeFixture("retry", {
      "app.ts": `
        export type A = {};
        type Missing = {};
        /** @Config */
        export function implA(m: Missing): A { return {}; }
      `,
    });

    await expect(Skeleto.start(directory)).rejects.toThrow("depends on Missing");

    writeFixture("retry", {
      "app.ts": `
        export type A = {};
        /** @Config */
        export function implA(): A { return {}; }
      `,
    });

    const skeleto = await Skeleto.start(directory);
    expect(skeleto.getContainer().has("A")).toBe(true);
  });

  it("keeps one instance per directory", async () => {
    const one = writeFixture("one", {
      "app.ts": `
        export type One = {};
        /** @Config */
        export function implOne(): One { return {}; }
      `,
    });
    const two = writeFixture("two", {
      "app.ts": `
        export type Two = {};
        /** @Config */
        export function implTwo(): Two { return {}; }
      `,
    });

    const [first, again] = await Promise.all([Skeleto.start(one), Skeleto.start(one)]);
    const second = await Skeleto.start(two);

    expect(first).toBe(again);
    expect(first.getContainer().has("One")).toBe(true);
    expect(second.getContainer().has("Two")).toBe(true);
  });

  it("reads the structure of a payload imported from another file", async () => {
    const directory = writeFixture("imported_payload", {
      "types.ts": `
        export type Req = {
          /** @RequestPart body */
          email: string;
        };
      `,
      "app.ts": `
        import { Req } from "./types";
        type Handler<A> = (ctx: any, req: A) => Promise<void>;
        export type Do = Handler<Req>;
        /** @Action {"readTypeArguments": true} */
        export function implDo(): Do { return async () => {}; }
      `,
    });

    const skeleto = await Skeleto.start(directory);

    expect(skeleto.getContainer().get("Do")?.getMetadata().request?.structure).toEqual([
      { name: "email", type: "string", decorators: [{ name: "RequestPart", data: "body" }] },
    ]);
  });

  it("reads a decorator only when it starts the line", async () => {
    const directory = writeFixture("prose", {
      "app.ts": `
        export type Prose = {};
        export type Owned = {};
        /** Do not put @Action here. */
        export function implProse(): Prose { return {}; }
        /**
         * Owner: owner@example.com
         * @Action
         */
        export function implOwned(): Owned { return {}; }
      `,
    });

    const container = (await Skeleto.start(directory)).getContainer();

    expect(container.has("Prose")).toBe(false);
    expect(container.get("Owned")?.getMetadata().additionalDecorators).toEqual([]);
  });

  it("parses decorator JSON that starts on the next line", async () => {
    const directory = writeFixture("next_line_json", {
      "app.ts": `
        export type Act = {};
        /**
         * @Action
         * {"custom": true}
         */
        export function implAct(): Act { return {}; }
      `,
    });

    const container = (await Skeleto.start(directory)).getContainer();

    expect(container.get("Act")?.getMetadata().mainDecorator.data).toEqual({ custom: true });
  });
});
