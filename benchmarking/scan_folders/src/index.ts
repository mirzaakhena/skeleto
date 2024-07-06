import { ActionHandler, newContext, Skeleto } from "skeleto";

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requestContent = `export type Request = {}\n`;

const responseContent = `export type Response = {}\n`;

const contractContent = (i: number) => `import { ActionHandler } from "skeleto";
import { Request } from "./request.js";
import { Response } from "./response.js";
export type Contract${i.toString().padStart(3, "0")} = ActionHandler<Request, Response>\n`;

// Function to generate random parameters
const generateRandomParams = (currentIndex: number, totalIndices: number) => {
  const numParams = Math.floor(Math.random() * 4); // Generate 0-3 parameters
  const params: string[] = [];
  const imports: string[] = [];
  const usedIndices = new Set<number>();

  while (params.length < numParams) {
    const randomIndex = Math.floor(Math.random() * totalIndices) + 1;
    if (randomIndex !== currentIndex && !usedIndices.has(randomIndex)) {
      const paramIndex = randomIndex.toString().padStart(3, "0");
      params.push(`arg${params.length + 1}: Contract${paramIndex}`);
      imports.push(`import { Contract${paramIndex} } from "../${paramIndex}/contract.js";`);
      usedIndices.add(randomIndex);
    }
  }

  return { params: params.join(", "), imports: imports.join("\n") };
};

const contractImplContent = (i: number, totalIndices: number) => {
  const { params, imports } = generateRandomParams(i, totalIndices);
  const indexStr = i.toString().padStart(3, "0");

  return `${imports}
import { Contract${indexStr} } from "./contract.js"
/**
 * @Action
 */
export function implContract${indexStr}(${params}): Contract${indexStr} {
  return async (ctx, req) => ({})
}\n`;
};

const baseDirectory = path.join(__dirname, "generate_folders", "app");

export const createFoldersAndFiles = (folderIndex: number, totalFolders: number) => {
  const folderName = folderIndex.toString().padStart(3, "0");
  const folderPath = path.join(baseDirectory, folderName);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  fs.writeFileSync(path.join(folderPath, "request.ts"), requestContent);
  fs.writeFileSync(path.join(folderPath, "response.ts"), responseContent);
  fs.writeFileSync(path.join(folderPath, "contract.ts"), contractContent(folderIndex));
  fs.writeFileSync(path.join(folderPath, "contract_impl.ts"), contractImplContent(folderIndex, totalFolders));
};

export function generate(totalFolders: number) {
  for (let i = 1; i <= totalFolders; i++) {
    createFoldersAndFiles(i, totalFolders);
  }
  console.log("Folders and files created successfully.");
}

async function main() {
  //

  const start = process.hrtime.bigint();
  await Skeleto.start("./src/generate_folders/src/app");
  // let x = 0;
  // for (let index = 0; index < 10000; index++) {
  //   x = (index * 2) % 100;
  // }
  const end = process.hrtime.bigint();

  console.log("Scan Time: %s ns", Number(end - start));
}

// generate(900);
main();
