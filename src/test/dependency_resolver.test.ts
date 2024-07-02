import { DependencyResolver } from "../core/dependency_resolver.js";

describe("DependencyResolver", () => {
  it("sorts functions correctly without dependencies", () => {
    const resolver = new DependencyResolver([
      { name: "A", dependencies: [] },
      { name: "B", dependencies: [] },
      { name: "C", dependencies: [] },
    ]);
    const sorted = resolver.sortFunctions();

    expect(sorted).toEqual(["A", "B", "C"]);
  });

  it("sorts functions correctly with linear dependencies", () => {
    const resolver = new DependencyResolver([
      { name: "A", dependencies: [] },
      { name: "B", dependencies: ["A"] },
      { name: "C", dependencies: ["B"] },
    ]);
    const sorted = resolver.sortFunctions();

    expect(sorted).toEqual(["A", "B", "C"]);
  });

  it("sorts functions correctly with complex dependencies", () => {
    const resolver = new DependencyResolver([
      { name: "A", dependencies: [] },
      { name: "B", dependencies: ["A"] },
      { name: "C", dependencies: ["A"] },
      { name: "D", dependencies: ["B", "C"] },
    ]);
    const sorted = resolver.sortFunctions();

    expect(sorted).toEqual(["A", "B", "C", "D"]);
  });

  it("throws an error for missing dependencies", () => {
    const resolver = new DependencyResolver([{ name: "A", dependencies: ["X"] }]);

    expect(() => resolver.sortFunctions()).toThrow("Function A cannot be resolved because it depends on X which is not defined.");
  });

  it("throws an error for circular dependencies", () => {
    const resolver = new DependencyResolver([
      { name: "A", dependencies: ["B"] },
      { name: "B", dependencies: ["C"] },
      { name: "C", dependencies: ["A"] },
    ]);

    expect(() => resolver.sortFunctions()).toThrow("Circular dependency detected: A -> B -> C -> A");
  });

  it("handles complex graph without circular dependencies", () => {
    const resolver = new DependencyResolver([
      { name: "A", dependencies: [] },
      { name: "B", dependencies: ["A"] },
      { name: "C", dependencies: ["A"] },
      { name: "D", dependencies: ["B"] },
      { name: "E", dependencies: ["C"] },
      { name: "F", dependencies: ["D", "E"] },
    ]);
    const sorted = resolver.sortFunctions();

    expect(sorted).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("handles multiple entries with no dependencies", () => {
    const resolver = new DependencyResolver([
      { name: "A", dependencies: [] },
      { name: "B", dependencies: [] },
      { name: "C", dependencies: [] },
      { name: "D", dependencies: [] },
    ]);
    const sorted = resolver.sortFunctions();

    expect(sorted).toEqual(["A", "B", "C", "D"]);
  });
});
