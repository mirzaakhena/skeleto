# Skeleto

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Core Concepts](#core-concepts)
6. [How it Works](#how-it-works)
7. [Best Practices](#best-practices)
8. [Usage Examples](#usage-examples)
9. [Future Plans](#future-plans)
10. [Contributing](#contributing)
11. [License](#license)

## Introduction

Skeleto is a lightweight, function-based backend framework for TypeScript applications. It leverages dependency injection, aspect-oriented programming, and the decorator pattern to organize and structure your codebase efficiently.

Skeleto aims to provide a flexible and modular approach to building backend applications, focusing on functions rather than classes. It uses JSDoc comments as decorators and employs the concept of closures as the main construction method for functions.

## Features

- Function-based architecture (no classes required)
- Dependency injection using closures
- JSDoc-based decorators for easy configuration
- Three main components: `@Action`, `@Config`, and `@Wrapper`
- Separation of primary and secondary functions for better code organization
- Aspect-oriented programming support through `@Wrapper` functions
- TypeScript support for enhanced type safety and developer experience

## Installation

You can install Skeleto using npm:

```bash
npm i skeleto
```

## Quick Start

This quick start guide will walk you through creating a simple "Hello World" application using Skeleto.

1. First, we'll create our main application logic in `src/app/helloworld.ts`:
   This file defines two actions: a secondary action for finding a city by name, and a primary action for creating a greeting.

   ```typescript
   import { ActionHandler } from "skeleto";

   export type FindCityByName = ActionHandler<{ name: string }, { city: string } | null>;

   /**
    * This is the simple database demonstration
    * @Action
    */
   export function implFindCityByName(): FindCityByName {
     return async (ctx, req) => {
       if (req.name === "ade") return { name: "ade", city: "Jakarta" };
       if (req.name === "asep") return { name: "asep", city: "Bandung" };
       if (req.name === "anto") return { name: "anto", city: "Yogyakarta" };
       return null;
     };
   }

   export type HelloWorld = ActionHandler<{ name: string }, { message: string }>;

   /**
    * This is the core logic application
    * @Action
    */
   export function implHelloWorld(findCity: FindCityByName): HelloWorld {
     return async (ctx, req) => {
       // try to find user from database
       const result = await findCity(ctx, req);

       // if not found then just print hello
       if (!result) return { message: `Hello ${req.name}` };

       // but if found, print hello followed by mentioning the city name
       return { message: `Hello ${req.name}, you are from ${result.city}` };
     };
   }
   ```

2. Next, we'll create our application entry point in `src/index.ts`:
   This file initializes Skeleto, retrieves our HelloWorld action, and runs it with different inputs.

   ```typescript
   import { ActionHandler, newContext, Skeleto } from "skeleto";

   async function main() {
     const application = await Skeleto.start("./src/app");
     const heloworld = application.getContainer().get("HelloWorld")?.getInstance() as ActionHandler;

     const response1 = await heloworld(newContext(), { name: "asep" });
     console.log(response1.message);

     const response2 = await heloworld(newContext(), { name: "john" });
     console.log(response2.message);
   }

   main();
   ```

3. Run the application to see the output

   ```bash
   $ ts-node src/index.ts

   Hello asep, you are from Bandung
   Hello john
   ```

The example demonstrates:

1. Action Definition (`@Action`): Both `implFindCityByName` and `implHelloWorld` are decorated with `@Action`, showing how to define functions in Skeleto.
2. Secondary Action: `implFindCityByName` acts as a secondary action, simulating a database lookup or external API call. It's a reusable component that can be injected into other actions.
3. Primary Action: `implHelloWorld` serves as the main business logic, demonstrating how to compose actions by using the `findCity` function.
4. Type Safety: The use of `ActionHandler<Request, Response>` type ensures type safety for inputs and outputs of each action.
5. Automatic Dependency Injection: Skeleto automatically injects the `FindCityByName` action into `implHelloWorld`, showcasing its dependency resolution capabilities.
6. Functional Approach: The example demonstrates Skeleto's functional programming approach, using pure functions and composition.
7. Separation of Concerns: Even in this simple example, there's a clear separation between the city lookup logic and the main greeting logic, promoting clean and maintainable code.

This basic example focuses on core concepts. More advanced features like Configuration Management (`@Config`) and Cross-Cutting Concerns (`@Wrapper`) are covered in the full documentation.

## Core Concepts

Skeleto is built around three main concepts: `@Action`, `@Config`, and `@Wrapper`. These concepts work together to create a flexible, modular, and easily maintainable application structure. Let's explore each of these in detail:

### `@Action`

The `@Action` decorator is used to create main logic functions. The outer closure function of an `@Action` decorated function can have parameters. These parameters can be injected by `@Config` functions and Other `@Action` functions. Cyclic dependencies between `@Action` functions are not allowed and will result in an error.

```typescript
/** @Action */
export function implUserRepository(dbConfig: DatabaseConfig): UserRepository {
  return async (ctx, req) => // Implementation using dbConfig
}

/** @Action */
export function implUserService(userRepo: UserRepository): UserService {
  return async (ctx, req) => // Implementation using userRepo
}
```

### `@Config`

The `@Config` decorator is used to create global configuration objects that can be used by all other functions, including those decorated with `@Action` and `@Wrapper`. The outer closure function of a `@Config` decorated function can have parameters. These parameters can be injected by other `@Config` functions. Cyclic dependencies between `@Config` functions are not allowed and will result in an error. For example it can be used to create the `Database` config object

```typescript
/** @Config */
export function implDatabaseConfig(): DatabaseConfig {
  return { url: "postgres://localhost/mydb" };
}

/** @Config */
export function implAppConfig(dbConfig: DatabaseConfig): AppConfig {
  return { name: "MyApp", databaseUrl: dbConfig.url };
}
```

### `@Wrapper`

The `@Wrapper` decorator functions as middleware. It's used to wrap functions decorated with `@Action` to add capabilities such as logging, transactions, error handling, and more. The outer closure function of a `@Wrapper` decorated function can have parameters. These parameters can be injected by `@Config` and `@Action` functions. `@Wrapper` functions cannot be injected into other functions. This is the example to demonstrate the logging:

```typescript
export type Logging = WrapperHandler;

/** @Wrapper */
export function implLogging(logConfig: LogConfig, metrics: MetricsService): Logging {
  return (actionHandler, metadata) => {
    return async (ctx, req) => {
      // Implementation using logConfig and metrics
    };
  };
}
```

#### Important Notes

- Skeleto automatically resolves and injects these dependencies at runtime.
- The framework ensures there are no cyclic dependencies by analyzing the dependency graph.
- If a cyclic dependency is detected, Skeleto will throw an error during the application startup.
- The order of definition doesn't matter; Skeleto will determine the correct order of instantiation based on the dependency graph.

### Best Practices

When using Skeleto, consider the following best practices:

1. Clear Separation: When writing a function with the @Action decorator, create a clear separation between PayloadRequest, PayloadResponse, function type definition, and function type implementation.

   Payload Request

   ```typescript
   type HelloRequest = { name: string };
   ```

   Payload Response

   ```typescript
   type HelloResponse = { message: string };
   ```

   Function Type Definition

   ```typescript
   type Hello = ActionHandler<HelloRequest, HelloResponse>;
   ```

   Function Type Implementation

   ```typescript
   /** @Action */
   export function implHello(): Hello {
     return async (ctx, req) => {
       return {
         message: `Hello ${req.name}`,
       };
     };
   }
   ```

2. Primary and Secondary Functions: Conceptually separate your functions into primary and secondary functions:

- Primary Functions: Orchestrate models and secondary functions. They contain the main logic and algorithms to meet the application's business process requirements.
- Secondary Functions: Support primary functions. They can be database queries, calls to other services, etc. Secondary functions are reusable and independent.

3. Naming Convention: Use a prefix `impl` at the beginning of the function name, followed by the return type:

   ```typescript
   type Hello = ActionHandler<HelloRequest, HelloResponse>;

   /** @Action */
   export function implHello(): Hello {
     return async (ctx, req) => ({ message: `Hello ${req.name}` });
   }
   ```

## How it works

Understanding the internal workings of Skeleto can help you leverage its full power and debug your applications more effectively. Here's a step-by-step breakdown of how Skeleto operates:

1. Project Analysis:
   The framework performs a comprehensive scan of the TypeScript project at initialization, identifying all functions decorated with `@Action`, `@Config`, and `@Wrapper`. It extracts rich metadata including dependencies, type information, and custom decorators.

2. Dependency Resolution:
   Using a sophisticated dependency resolver, the framework sorts all identified functions to prevent circular dependencies and determine the correct initialization order.

3. Function Instantiation:
   The framework systematically instantiates each function, starting with `@Config`, then `@Wrapper`, and finally `@Action` functions. During this process, it injects the required dependencies based on the function's parameter types.

4. Type Argument Analysis:
   For `@Action` functions marked with `readTypeArguments: true`, the framework performs deep analysis of the request and response types, extracting detailed structure and decorator information.

5. Wrapper Application:
   After instantiation, the framework applies any relevant `@Wrapper` functions to the @Action functions, enhancing their behavior as specified.

6. Container Population:
   All instantiated functions, along with their rich metadata, are stored in a central container. This container serves as the core of the dependency injection system, allowing for runtime access and manipulation of the application's components.

## Usage Examples

While the Quick Start guide provides a simple example, Skeleto is capable of handling more complex scenarios. Here's an advanced example that demonstrates integration with a database, custom error handling, and logging:

[More Advance Example](https://github.com/mirzaakhena/skeleto/blob/main/example/demo_10)

This example showcases:

- Integrate with TypeORM for database connections using `@Config`
- Create controllers with Express.js using a custom `@Controller` decorator
- Implement transactions, logging, and error handling using `@Wrapper`

## Requirements

Skeleto is designed to work with:

- Node.js version v20.0.0 or later
- TypeScript version v5.0.0 or later

It's recommended to use the latest LTS versions of Node.js and TypeScript for the best experience.

## Future Plans

- AI Integration: We plan to integrate AI into the function creation process through CLI commands. This will allow developers to provide requirements, and the AI will generate code using Skeleto templates.
- Auto Testing code generated

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
