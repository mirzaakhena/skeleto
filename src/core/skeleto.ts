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

  private constructor() {}

  public static getInstance(): Skeleto {
    if (!Skeleto.instance) {
      Skeleto.instance = new Skeleto();
    }
    return Skeleto.instance;
  }

  public async startScan(directory: string = "src") {
    if (!Skeleto.instance.container) {
      const project = new Project();
      project.addSourceFilesAtPaths(`${directory}/**/*.ts`);
      this.container = await scanFunctions(project);
    }
    return Skeleto.instance;
  }

  public getContainer = () => this.container;
}

export const newContext = (): Context => ({ data: {}, traceId: "", date: new Date() });
