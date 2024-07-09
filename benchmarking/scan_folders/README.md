# Skeleto Framework Benchmarking

This project provides a benchmarking tool for the Skeleto framework, designed to measure initialization performance across various project sizes.

## Overview

The benchmarking tool performs the following tasks:

1. **Project Generation**: 
   - Creates a configurable number of folders (10 to 900 in our tests).
   - Each folder contains TypeScript files simulating a typical project structure:
     - `request.ts`
     - `response.ts`
     - `contract.ts`
     - `contract_impl.ts`
   - Ensures no circular dependencies between generated files.

2. **Performance Measurement**:
   - Initializes the Skeleto framework with the generated project.
   - Measures the initialization time using high-resolution timers.

## Results

Our benchmarks show how Skeleto's initialization time scales with project size:

| Folders | Avg. Initialization Time |
|---------|--------------------------|
| 10      | ~795 milliseconds        |
| 50      | ~820 milliseconds        |
| 100     | ~1015 milliseconds       |
| 300     | ~1654 milliseconds       |
| 600     | ~2599 milliseconds       |
| 900     | ~3679 milliseconds       |

## Key Findings

1. **Linear Scalability**: Initialization time increases roughly linearly with project size.
2. **Consistent Performance**: Times are relatively consistent across multiple runs.
3. **Reasonable Startup Times**: 
   - Small to medium projects (10-300 folders): Under 2 seconds
   - Large projects (600-900 folders): 3-4 seconds

## Implications

- Provides a performance baseline for future optimizations.
- Helps set user expectations for startup times based on project size.
- Identifies potential areas for optimization, especially for larger projects.

This benchmarking approach offers valuable insights into Skeleto's performance characteristics, enabling informed decisions about framework optimization and usage guidelines.