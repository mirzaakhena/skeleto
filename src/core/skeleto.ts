// src/core/skeleto.ts

import { resolve } from "node:path";
import { Project } from "ts-morph";
import { scanFunctions } from "./scanner.js";
import { Context, FuncInstanceMetadata } from "./type.js";

/**
 * One instance of skeleto per scanned directory
 *
 *   ```
 *   const application = await Skeleto.start("./src/app");
 *   const helloworld = application.getContainer().get("HelloWorld")?.getInstance() as ActionHandler;
 *   ```
 */
export class Skeleto {
  //

  private static instances: Map<string, Promise<Skeleto>> = new Map();

  private container: Map<string, FuncInstanceMetadata>;

  /**
   *
   * @param directory where it start to scan
   * @returns instance containers
   */
  public static async start(directory: string = "src") {
    const key = resolve(directory);

    let instance = Skeleto.instances.get(key);
    if (!instance) {
      instance = Skeleto.create(directory);
      Skeleto.instances.set(key, instance);

      // a failed start must not be remembered, so the next start can scan again
      instance.catch(() => Skeleto.instances.delete(key));
    }

    return instance;
  }

  private static async create(directory: string) {
    const project = new Project();
    const sourceFiles = project.addSourceFilesAtPaths(`${directory}/**/*.ts`);
    if (sourceFiles.length === 0) {
      throw new Error(`No TypeScript files found in ${resolve(directory)}.`);
    }

    const skeleto = new Skeleto();
    skeleto.container = await scanFunctions(project);
    return skeleto;
  }

  /**
   *
   * @returns instance containers
   */
  public getContainer = () => this.container;
}

/**
 *
 * @returns empty context
 */
export const newContext = (): Context => ({ data: {}, traceId: "", date: new Date() });
