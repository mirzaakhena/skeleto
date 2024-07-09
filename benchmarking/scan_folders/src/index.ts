import { ActionHandler, newContext, Skeleto } from "skeleto";

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requestContent = `/**
 * @Request001 {"a": "1"}
 * @Request002 {"b": "2"}
 */
export type Request = {

  /**
   * @Field001 {"c": 3}
   */
  name: string

  /**
   * @Field004 {"d": 4}
   */
  address: string
}\n`;

const responseContent = `/**
 * @Response001 {"a": "1"}
 * @Response002 {"b": "2"}
 */
export type Response = {

  /**
   * @Field001 {"c": 3}
   */
  value: number

  /**
   * @Field004 {"d": 4}
   */
  status: boolean
}\n`;

const contractContent = (i: number) => `import { ActionHandler } from "skeleto";
import { Request } from "./request.js";
import { Response } from "./response.js";

/**
 * @ReturnType {"x": 12} 
 */
export type Contract${i.toString().padStart(3, "0")} = ActionHandler<Request, Response>\n`;

// Helper function to check for cycles using DFS
const hasCycle = (graph: Map<number, Set<number>>, start: number, visited: Set<number>, stack: Set<number>): boolean => {
  if (!visited.has(start)) {
    visited.add(start);
    stack.add(start);

    const neighbors = graph.get(start);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(graph, neighbor, visited, stack)) {
          return true;
        } else if (stack.has(neighbor)) {
          return true;
        }
      }
    }
  }
  stack.delete(start);
  return false;
};

// Function to generate random parameters without cyclic dependencies
const generateRandomParams = (currentIndex: number, totalIndices: number, dependencies: Map<number, Set<number>>) => {
  const numParams = Math.floor(Math.random() * 5); // Generate 0-4 parameters
  const params: string[] = [];
  const imports: string[] = [];
  const dependencyGraph = new Map(dependencies); // Clone the current dependencies graph

  while (params.length < numParams) {
    const randomIndex = Math.floor(Math.random() * totalIndices) + 1;

    if (randomIndex !== currentIndex) {
      // Ensure the currentIndex entry exists
      if (!dependencyGraph.has(currentIndex)) {
        dependencyGraph.set(currentIndex, new Set());
      }

      // Tentatively add the dependency to check for cycles
      dependencyGraph.get(currentIndex)!.add(randomIndex);

      // Check for cycles
      if (hasCycle(dependencyGraph, currentIndex, new Set(), new Set())) {
        // Remove the tentative dependency if it creates a cycle
        dependencyGraph.get(currentIndex)!.delete(randomIndex);
      } else {
        const paramIndex = randomIndex.toString().padStart(3, "0");
        params.push(`arg${params.length + 1}: Contract${paramIndex}`);
        imports.push(`import { Contract${paramIndex} } from "../${paramIndex}/contract.js";`);

        // Ensure the currentIndex entry exists in the original dependencies map
        if (!dependencies.has(currentIndex)) {
          dependencies.set(currentIndex, new Set());
        }
        dependencies.get(currentIndex)!.add(randomIndex);
      }
    }
  }

  return { params: params.join(", "), imports: imports.join("\n") };
};

const contractImplContent = (i: number, totalIndices: number, dependencies: Map<number, Set<number>>) => {
  const { params, imports } = generateRandomParams(i, totalIndices, dependencies);
  const indexStr = i.toString().padStart(3, "0");

  return `${imports}
import { Contract${indexStr} } from "./contract.js"
/**
 * @Action {"readTypeArguments": true}
 */
export function implContract${indexStr}(${params}): Contract${indexStr} {
  return async (ctx, req) => ({
    status: true,
    value: 12,
  });
}\n`;
};

const baseDirectory = path.join(__dirname, "generate_folders", "app");

export const createFoldersAndFiles = (folderIndex: number, totalFolders: number, dependencies: Map<number, Set<number>>) => {
  const folderName = folderIndex.toString().padStart(3, "0");
  const folderPath = path.join(baseDirectory, folderName);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  fs.writeFileSync(path.join(folderPath, "request.ts"), requestContent);
  fs.writeFileSync(path.join(folderPath, "response.ts"), responseContent);
  fs.writeFileSync(path.join(folderPath, "contract.ts"), contractContent(folderIndex));
  fs.writeFileSync(path.join(folderPath, "contract_impl.ts"), contractImplContent(folderIndex, totalFolders, dependencies));
};

export function generate(totalFolders: number) {
  const dependencies = new Map<number, Set<number>>();

  for (let i = 1; i <= totalFolders; i++) {
    createFoldersAndFiles(i, totalFolders, dependencies);
  }
  console.log("Folders and files created successfully.");
}

async function main() {
  //

  const start = process.hrtime.bigint();
  const x = await Skeleto.start("./src/generate_folders/app");
  // let x = 0;
  // for (let index = 0; index < 10000; index++) {
  //   x = (index * 2) % 100;
  // }
  const end = process.hrtime.bigint();

  console.log("Scan Time: %s ns", Number(end - start));

  // console.log(JSON.stringify(Array.from(x.getContainer().values())));
}

// generate(900);
main();
