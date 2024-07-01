export type TypeDependencies = {
  name: string;
  dependencies: string[];
};

export class DependencyResolver {
  //

  private functions: Array<TypeDependencies>;
  private resolvedDependencies: Set<string> = new Set();
  private visited: Set<string> = new Set();
  private inStack: Set<string> = new Set();
  private stack: string[] = [];

  constructor(functions: Array<TypeDependencies>) {
    this.functions = functions;
  }

  private getInDegree(): { [key: string]: number } {
    const inDegree: { [key: string]: number } = {};

    this.functions.forEach((func) => {
      inDegree[func.name] = 0;
      func.dependencies.forEach((dep) => {
        inDegree[dep] = (inDegree[dep] || 0) + 1;
      });
    });

    return inDegree;
  }

  private detectCycle(node: string, adjList: { [key: string]: string[] }): string[] | null {
    if (this.inStack.has(node)) {
      const cyclePath = this.stack.slice(this.stack.indexOf(node));
      cyclePath.push(node); // tambahkan node awal untuk menunjukkan siklus utuh
      return cyclePath;
    }

    if (this.visited.has(node)) {
      return null; // Sudah diproses dan tidak ada siklus
    }

    this.visited.add(node);
    this.inStack.add(node);
    this.stack.push(node);

    for (const neighbor of adjList[node] || []) {
      const result = this.detectCycle(neighbor, adjList);
      if (result) {
        return result;
      }
    }

    this.inStack.delete(node);
    this.stack.pop();
    return null;
  }

  private findCircularDependency(): string[] | null {
    const adjList: { [key: string]: string[] } = {};

    this.functions.forEach((func) => {
      adjList[func.name] = func.dependencies;
    });

    for (const func of this.functions) {
      const result = this.detectCycle(func.name, adjList);
      if (result) {
        return result; // Siklus ditemukan
      }
    }

    return null; // Tidak ada siklus
  }

  private checkMissingDependencies(): void {
    const functionNames = new Set(this.functions.map((func) => func.name));

    this.functions.forEach((func) => {
      func.dependencies.forEach((dep) => {
        if (!functionNames.has(dep)) {
          throw new Error(`Function ${func.name} cannot be resolved because it depends on ${dep} which is not defined.`);
        }
      });
    });
  }

  public sortFunctions(): string[] {
    //

    this.checkMissingDependencies();

    const cycle = this.findCircularDependency();
    if (cycle) {
      throw new Error(`Circular dependency detected: ${cycle.join(" -> ")}`);
    }

    const inDegree = this.getInDegree();
    const sorted: string[] = [];
    const queue: string[] = [];

    this.functions.forEach((func) => {
      if (func.dependencies.length === 0) {
        queue.push(func.name);
        this.resolvedDependencies.add(func.name);
      }
    });

    queue.sort((a, b) => inDegree[a] - inDegree[b]);

    while (queue.length > 0) {
      const node = queue.shift()!;
      const funcObj = this.functions.find((func) => func.name === node)!;
      sorted.push(funcObj.name);

      this.functions.forEach((func) => {
        if (func.dependencies.includes(node)) {
          func.dependencies = func.dependencies.filter((dep) => dep !== node);
          if (!this.resolvedDependencies.has(func.name) && func.dependencies.length === 0) {
            queue.push(func.name);
            this.resolvedDependencies.add(func.name);
          }
        }
      });

      queue.sort((a, b) => inDegree[a] - inDegree[b]);
    }

    return sorted;
  }
}
