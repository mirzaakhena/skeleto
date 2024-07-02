import { Project } from "ts-morph";

import { scanFunctions } from "../core/scanner.js";

describe("Function Utilities", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();

    project.addSourceFilesAtPaths(`src/test/*.ts`);
  });

  it("should scanFunctions", async () => {
    const result = await scanFunctions(project);
    expect(Array.from(result.keys())).toEqual([
      //
      "FirstParam",
      "SecondParam",
      "Logger",
      "ReturnType",
      "AnotherReturnType",
    ]);
  });
});
