import { camelToPascalWithSpace } from "../core/helper.js"; // Replace 'fileName' with the actual file name

describe("camelToPascalWithSpace", () => {
  it("should convert camelCase to Pascal Case with spaces", () => {
    expect(camelToPascalWithSpace("camelCaseString")).toBe("Camel Case String");
    expect(camelToPascalWithSpace("anotherExampleString")).toBe("Another Example String");
    expect(camelToPascalWithSpace("simpleTest")).toBe("Simple Test");
  });

  it("should handle an empty string", () => {
    expect(camelToPascalWithSpace("")).toBe("");
  });

  it("should handle strings without camelCase", () => {
    expect(camelToPascalWithSpace("PascalCase")).toBe("Pascal Case");
    expect(camelToPascalWithSpace("simple")).toBe("Simple");
  });
});
