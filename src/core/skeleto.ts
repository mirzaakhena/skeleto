// src/core/skeleto.ts

import { Project } from "ts-morph";
import { scanFunctions } from "./scanner.js";
import { Context, FuncInstanceMetadata } from "./type.js";

/**
 * Singleton instance of skeleto
 *
 *   ```
 *   const application = await Skeleto.getInstance().startScan("./src/app");
 *   const helloworld = application.getContainer().get("HelloWorld")?.funcInstance as ActionHandler;
 *   ```
 */
export class Skeleto {
  //

  private static instance: Skeleto;

  private container: Map<string, FuncInstanceMetadata>;

  /**
   *
   * @param directory where it start to scan
   * @returns instance containers
   */
  public static async start(directory: string = "src") {
    if (!Skeleto.instance) {
      Skeleto.instance = new Skeleto();

      const project = new Project();
      project.addSourceFilesAtPaths(`${directory}/**/*.ts`);
      Skeleto.instance.container = await scanFunctions(project);
    }

    return Skeleto.instance;
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
