// src/benchmark.ts

interface GreeterInterface {
  greet: (name: string) => string;
}

type GreeterFunction = (name: string) => string;

const greeterInterfaceImpl: GreeterInterface = {
  greet: (name: string) => `Hello, ${name}`,
};

const greeterFunctionImpl: GreeterFunction = (name: string) => `Hello, ${name}`;

function measureExecutionTime(fn: () => void): number {
  const start = process.hrtime.bigint();
  fn();
  const end = process.hrtime.bigint();
  return Number(end - start);
}

function measureMemoryUsage(fn: () => void): number {
  const initialMemory = process.memoryUsage().heapUsed;
  fn();
  const finalMemory = process.memoryUsage().heapUsed;
  return finalMemory - initialMemory;
}

const ITERATIONS = 100_000_000;

function testInterface() {
  for (let i = 0; i < ITERATIONS; i++) {
    greeterInterfaceImpl.greet("World");
  }
}

function testFunction() {
  for (let i = 0; i < ITERATIONS; i++) {
    greeterFunctionImpl("World");
  }
}

function safeTest(fn: () => void) {
  try {
    fn();
  } catch (error) {
    console.error("Error during execution:", error);
  }
}

export function runBenchmarks() {
  {
    console.log("Measuring execution time and memory usage...");

    // Measure execution time
    const interfaceTime = measureExecutionTime(testInterface);
    const functionTime = measureExecutionTime(testFunction);

    // Measure memory usage
    const interfaceMemory = measureMemoryUsage(testInterface);
    const functionMemory = measureMemoryUsage(testFunction);

    // Output results
    console.log(`Interface - Execution Time: ${interfaceTime}ns, Memory Usage: ${interfaceMemory} bytes`);
    console.log(`Function  - Execution Time: ${functionTime}ns, Memory Usage: ${functionMemory} bytes`);
  }

  console.log();

  // {
  //   console.log("Measuring execution time and memory usage with safeTest...");

  //   // Interface
  //   const interfaceTime = measureExecutionTime(() => safeTest(testInterface));
  //   const interfaceMemory = measureMemoryUsage(() => safeTest(testInterface));

  //   // Function
  //   const functionTime = measureExecutionTime(() => safeTest(testFunction));
  //   const functionMemory = measureMemoryUsage(() => safeTest(testFunction));

  //   // Output results
  //   console.log(`Interface - Execution Time: ${interfaceTime}ns, Memory Usage: ${interfaceMemory} bytes`);
  //   console.log(`Function  - Execution Time: ${functionTime}ns, Memory Usage: ${functionMemory} bytes`);
  // }
}
