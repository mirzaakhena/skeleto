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

  describe("decorator registration", () => {
    const usecase = (decorators: string) => `
      type Handler<A> = (ctx: any, req: A) => Promise<void>;
      type Req = {
        /** @RequestPart body */
        email: string;
        name: string;
      };
      export type Do = Handler<Req>;
      /**
       * Registers a person.
       * @param none is a standard JSDoc tag
       ${decorators}
       */
      export function implDo(): Do { return async () => {}; }
    `;

    const everyFieldHasRequestPart = (_: any, fm: any) => {
      const missing = fm.request?.structure?.filter((f: any) => !f.decorators.some((d: any) => d.name === "RequestPart"));
      return missing?.length ? `needs @RequestPart on: ${missing.map((f: any) => f.name).join(", ")}` : undefined;
    };

    const requestPart = {
      validate: (data: any) => (["body", "query", "param"].includes(data) ? undefined : "has an unknown part"),
    };

    const decorators = {
      Transaction: {},
      Controller: { requiresTypeArguments: true, validate: everyFieldHasRequestPart, requestFields: { RequestPart: requestPart }, responseFields: { ResponsePart: {} } },
    };

    const withResponse = (responseField: string) => `
      type Handler<A, B> = (ctx: any, req: A) => Promise<B>;
      type Req = {
        /** @RequestPart body */
        email: string;
      };
      type Res = {
        /** ${responseField} */
        id: string;
      };
      export type Do = Handler<Req, Res>;
      /**
       * @Action {"readTypeArguments": true}
       * @Controller
       */
      export function implDo(): Do { return async () => ({ id: "" }); }
    `;

    it("accepts a decorator on the kind of field it is registered for", async () => {
      const directory = writeFixture("registry_response_ok", { "app.ts": withResponse("@ResponsePart") });

      const skeleto = await Skeleto.start(directory, { decorators });

      expect(skeleto.getContainer().has("Do")).toBe(true);
    });

    it("rejects a request field decorator used on a response field", async () => {
      const directory = writeFixture("registry_request_on_response", { "app.ts": withResponse("@RequestPart body") });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("field id: decorator @RequestPart can only be used on a Request field");
    });

    it("rejects a response field decorator used on a request field", async () => {
      const directory = writeFixture("registry_response_on_request", {
        "app.ts": withResponse("@ResponsePart").replace("@RequestPart body", "@ResponsePart"),
      });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("field email: decorator @ResponsePart can only be used on a Response field");
    });

    const controllerAction = '* @Action {"readTypeArguments": true}\n * @Controller';
    const completeRequest = (part: string) => `
      type Handler<A> = (ctx: any, req: A) => Promise<void>;
      type Req = {
        /** @RequestPart ${part} */
        email: string;
      };
      export type Do = Handler<Req>;
      /**
       ${controllerAction}
       */
      export function implDo(): Do { return async () => {}; }
    `;

    it("accepts a field decorator on a function using its owner", async () => {
      const directory = writeFixture("registry_owner_ok", { "app.ts": completeRequest("body") });

      const skeleto = await Skeleto.start(directory, { decorators });

      expect(skeleto.getContainer().has("Do")).toBe(true);
    });

    it("rejects a field decorator with a wrong value", async () => {
      const directory = writeFixture("registry_owner_value", { "app.ts": completeRequest("bodi") });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("Do: field email: decorator @RequestPart has an unknown part");
    });

    it("rejects a field decorator left behind after its owner is removed", async () => {
      const directory = writeFixture("registry_owner_removed", { "app.ts": usecase('* @Action {"readTypeArguments": true}') });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("field email: decorator @RequestPart requires @Controller on the function");
    });

    it("rejects a field decorator used on a function", async () => {
      const directory = writeFixture("registry_field_on_function", { "app.ts": usecase("* @Action\n * @RequestPart body") });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("Do: decorator @RequestPart can only be used on a field");
    });

    it("rejects a function decorator used on a field", async () => {
      const directory = writeFixture("registry_function_on_field", {
        "app.ts": `
          type Handler<A> = (ctx: any, req: A) => Promise<void>;
          type Req = {
            /** @Transaction */
            email: string;
          };
          export type Do = Handler<Req>;
          /** @Action {"readTypeArguments": true} */
          export function implDo(): Do { return async () => {}; }
        `,
      });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("field email: decorator @Transaction cannot be used on a field");
    });

    it("accepts a general field decorator without an owner", async () => {
      const directory = writeFixture("registry_general_field", {
        "app.ts": `
          type Handler<A> = (ctx: any, req: A) => Promise<void>;
          type Req = {
            /** @Required */
            email: string;
          };
          export type Do = Handler<Req>;
          /** @Action {"readTypeArguments": true} */
          export function implDo(): Do { return async () => {}; }
        `,
      });

      const skeleto = await Skeleto.start(directory, { fieldDecorators: { Required: {} } });

      expect(skeleto.getContainer().has("Do")).toBe(true);
    });

    it("keeps unregistered decorators allowed without the option", async () => {
      const directory = writeFixture("registry_off", { "app.ts": usecase("* @Action\n * @Transction") });

      const skeleto = await Skeleto.start(directory);

      expect(skeleto.getContainer().has("Do")).toBe(true);
    });

    it("accepts registered decorators and standard JSDoc tags", async () => {
      const directory = writeFixture("registry_ok", { "app.ts": usecase("* @Action\n * @Transaction") });

      const skeleto = await Skeleto.start(directory, { decorators });

      expect(skeleto.getContainer().has("Do")).toBe(true);
    });

    it("rejects a misspelled decorator", async () => {
      const directory = writeFixture("registry_typo", { "app.ts": usecase("* @Action\n * @Transction") });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("Do: decorator @Transction is not registered");
    });

    it("rejects a field decorator that is not registered", async () => {
      const directory = writeFixture("registry_field", { "app.ts": usecase('* @Action {"readTypeArguments": true}') });

      await expect(Skeleto.start(directory, { decorators: { Transaction: {} } })).rejects.toThrow("decorator @RequestPart is not registered");
    });

    it("rejects invalid JSON", async () => {
      const directory = writeFixture("registry_json", { "app.ts": usecase('* @Action\n * @Transaction {"a": 1,}') });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("decorator @Transaction has invalid JSON");
    });

    it("rejects a decorator missing readTypeArguments", async () => {
      const directory = writeFixture("registry_requires", { "app.ts": usecase("* @Action\n * @Controller") });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow('decorator @Controller requires @Action {"readTypeArguments": true}');
    });

    it("reports a custom validation message before any function runs", async () => {
      const directory = writeFixture("registry_validate", {
        "app.ts": usecase('* @Action {"readTypeArguments": true}\n * @Controller') + `\nthrow new Error("module must not be imported");`,
      });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow("decorator @Controller needs @RequestPart on: name");
    });

    it("reports all problems at once", async () => {
      const directory = writeFixture("registry_all", { "app.ts": usecase("* @Action\n * @Transction\n * @Logging") });

      await expect(Skeleto.start(directory, { decorators })).rejects.toThrow(/@Transction is not registered\n.*@Logging is not registered/);
    });
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
