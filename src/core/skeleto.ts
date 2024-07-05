import { Project } from "ts-morph";
import { scanFunctions } from "./scanner.js";
import { Context, FuncInstanceMetadata } from "./type.js";

/**
 * Singleton instance of skeleto
 */
export class Skeleto {
  //

  private static instance: Skeleto;

  private container: Map<string, FuncInstanceMetadata>;

  public static async start(directory: string = "src") {
    if (!Skeleto.instance) {
      Skeleto.instance = new Skeleto();

      const project = new Project();
      project.addSourceFilesAtPaths(`${directory}/**/*.ts`);
      Skeleto.instance.container = await scanFunctions(project);
    }

    return Skeleto.instance;
  }

  public getContainer = () => this.container;
}

export const newContext = (): Context => ({ data: {}, traceId: "", date: new Date() });
