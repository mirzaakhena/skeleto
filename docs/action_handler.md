## ActionHandler

The `ActionHandler` type is a generic function type that standardizes the structure of functions handling actions within your application. It ensures that these functions maintain a consistent signature, making your code more predictable and easier to maintain.

### ActionHandler Type Definition

Here's the definition of the `ActionHandler` type:

```typescript
export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;
```

This definition uses TypeScript generics to enable flexibility in defining the types of the `request` and `response` parameters. By default, both `REQUEST` and `RESPONSE` are set to `any`, but you can specify more specific types when using `ActionHandler`.

1. **`ctx: Context`**: The first parameter is your `Context` object, which contains metadata like `data`, `traceId`, and `date`.
2. **`request: REQUEST`**: The second parameter is the request object, whose type is defined by the `REQUEST` generic parameter.
3. **`Promise<RESPONSE>`**: The return type of the function is a `Promise` that resolves to a response of type `RESPONSE`.

### What is a Contract in General?

In software development, a **contract** refers to an agreement or a formal specification that defines how different parts of a system interact with each other. This contract specifies the expected inputs and outputs, as well as the behavior of a component or a service. The concept of a contract ensures that different components can work together seamlessly and predictably.

In the context of TypeScript and interfaces, a contract can be seen as a type definition that describes the structure of the data and the methods that need to be implemented. It ensures that any implementation adheres to this predefined structure and behavior, providing a clear and consistent API for developers.

### Using TypeScript's `ActionHandler` as a Contract

The `ActionHandler` type you've defined is a generic type that acts as a base pattern for creating specific contracts between different parts of your application. It defines a function signature that takes a `Context` and a `REQUEST` parameter, and returns a `Promise` of `RESPONSE`.

This type can then be used to create more specific contracts,

#### Example: StringHandler

```typescript
type StringRequest = string;
type StringResponse = string;

// Introduce new type as a contract
type StringHandler = ActionHandler<StringRequest, StringResponse>;
```

**Implementation:**

```typescript
const stringHandler: StringHandler = async (ctx, request) => {
  console.log(`Trace ID: ${ctx.traceId}`);
  console.log(`Request: ${request}`);

  // Simulate some processing
  const response = `Processed: ${request}`;

  return response;
};
```

**Usage:**

```typescript
const ctx: Context = { data: {}, traceId: "12345", date: new Date() };

const request = "Hello, world!";

const response = await stringHandler(ctx, request);

console.log(`Response: ${response}`);
```

#### Example: ComplexHandler

```typescript
type ComplexRequest = {
  userId: number;
  action: string;
};

type ComplexResponse = {
  success: boolean;
  message: string;
};

// Introduce new type as a contract
type ComplexHandler = ActionHandler<ComplexRequest, ComplexResponse>;
```

**Implementation:**

```typescript
const complexHandler: ComplexHandler = async (ctx, request) => {
  console.log(`Trace ID: ${ctx.traceId}`);
  console.log(`Request:`, request);

  // Simulate some processing
  const response: ComplexResponse = {
    success: true,
    message: `Action ${request.action} performed for user ${request.userId}`,
  };

  return response;
};
```

**Usage:**

```typescript
const ctx: Context = { data: {}, traceId: "67890", date: new Date() };

const request: ComplexRequest = {
  userId: 1,
  action: "login",
};

const response = await complexHandler(ctx, request);

console.log(`Response:`, response);
```

This approach provides a clear contract for any function that needs to handle specific requests and responses while ensuring that it also receives the necessary context.

### Why Not Use Interfaces?

While interfaces are a powerful feature in TypeScript for defining contracts, using them in some contexts can lead to violations of the **Interface Segregation Principle (ISP)** and **Single Responsibility Principle (SRP)**, and can result in what is known as a **Fat Interface**.

#### Interface Segregation Principle (ISP)

The Interface Segregation Principle states that no client should be forced to depend on methods it does not use. When interfaces become too large or encompass too many responsibilities, they violate this principle, forcing implementations to depend on unnecessary methods.

#### Single Responsibility Principle (SRP)

The Single Responsibility Principle states that a class or module should have only one reason to change, meaning it should have only one job or responsibility. A Fat Interface that encompasses multiple responsibilities can lead to a violation of this principle.

#### Fat Interface

A Fat Interface is an interface that has too many methods or properties, covering too many responsibilities. This can result in implementations that are overly complex and difficult to maintain.

### ActionHandler and Adherence to Principles

By using the `ActionHandler` type, you create a more modular and focused contract that adheres to ISP and SRP:

1. **Single Responsibility**: Each `ActionHandler` contract focuses on a single responsibility—handling a specific type of request and returning a specific type of response. This makes it easier to understand and maintain.
2. **Interface Segregation**: By breaking down functionality into smaller, focused `ActionHandler` contracts, you avoid forcing implementations to depend on methods they do not use. Each handler is only responsible for a specific action.
3. **Avoiding Fat Interfaces**: Instead of creating a large interface that encompasses multiple responsibilities, you create small, focused handlers. This results in cleaner, more maintainable code.

### Step-by-Step Example: Login Use Case

Let's define a sample login use case using the `ActionHandler` type. We'll create types for the login request and response, implement the login handler, and show how to use it.

#### Define Request and Response Types

First, we'll define the types for the login request and response.

```typescript
type LoginRequest = {
  username: string;
  password: string;
};

type LoginResponse = {
  success: boolean;
  message: string;
  token?: string; // Optional, only included if login is successful
};
```

#### Define the LoginHandler Type

Next, we'll create a specific `ActionHandler` type for the login use case.

```typescript
type LoginHandler = ActionHandler<LoginRequest, LoginResponse>;
```

#### Implement the LoginHandler

Now, we'll implement the `loginHandler` function. This function will receive a `Context` and a `LoginRequest`, and return a `Promise` of `LoginResponse`.

```typescript
const loginHandler: LoginHandler = async (ctx, request) => {
  console.log(`Trace ID: ${ctx.traceId}`);
  console.log(`Login attempt for user: ${request.username}`);

  // Simulate some processing and authentication
  if (request.username === "admin" && request.password === "password123") {
    // Simulate a successful login
    const response: LoginResponse = {
      success: true,
      message: "Login successful",
      token: "fake-jwt-token",
    };

    return response;
  } else {
    // Simulate a failed login
    const response: LoginResponse = {
      success: false,
      message: "Invalid username or password",
    };

    return response;
  }
};
```

#### Using the LoginHandler

Finally, we'll show how to use the `loginHandler` in your application.

```typescript
const ctx: Context = { data: {}, traceId: "login-12345", date: new Date() };

const loginRequest: LoginRequest = {
  username: "admin",
  password: "password123",
};

try {
  const response = await loginHandler(ctx, loginRequest);
  console.log(`Response:`, response);
} catch (error) {
  console.error(`Error:`, error);
}
```

For a failed login attempt, you can change the `loginRequest` to have incorrect credentials:

```typescript
const loginRequest: LoginRequest = {
  username: "admin",
  password: "wrongpassword",
};

try {
  const response = await loginHandler(ctx, loginRequest);
  console.log(`Response:`, response);
} catch (error) {
  console.error(`Error:`, error);
}
```

### Conclusion

By using `ActionHandler` as a contract, you ensure that each function is focused on a single action, making your codebase cleaner and more maintainable. This approach prevents the issues associated with "fat interfaces" and aligns well with the principles of clean and modular design.
