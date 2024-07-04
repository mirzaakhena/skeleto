## Closure

### Understanding Closures in TypeScript

A **closure** is a feature in JavaScript (and thus TypeScript) where an inner function has access to the outer (enclosing) function's variables. This mechanism allows the inner function to maintain a reference to the variables within its scope even after the outer function has finished executing.

Here are the key aspects of closures:

1. **Lexical Scoping**: Variables defined in an outer function are accessible to inner functions.
2. **Persistence**: The inner function retains access to the outer function's variables, even after the outer function has executed.

#### Example of a Closure

Let's look at a simple example of a closure:

```typescript
function outerFunction(outerVariable: string) {
  return function innerFunction(innerVariable: string) {
    console.log(`Outer Variable: ${outerVariable}`);
    console.log(`Inner Variable: ${innerVariable}`);
  };
}

const closureFunction = outerFunction("Hello");
closureFunction("World"); // Outputs: Outer Variable: Hello, Inner Variable: World
```

And here is the same functionality written with arrow functions:
```typescript
function outerFunction(outerVariable: string) {
  return (innerVariable: string) => {
    console.log(`Outer Variable: ${outerVariable}`);
    console.log(`Inner Variable: ${innerVariable}`);
  };
}

const closureFunction = outerFunction("Hello");
closureFunction("World"); // Outputs: Outer Variable: Hello, Inner Variable: World
```

### Using ActionHandler with Closures

Now, let's use the `ActionHandler` type in a closure. We will create a function that returns an `ActionHandler` and make use of the closure concept to maintain some state.

#### Define Context and ActionHandler Types

```typescript
type Context = {
  data: any;
  traceId: string;
  date: Date;
};

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;
```

#### Example: Rate-Limited LoginHandler

Let's create a rate-limited login handler using closures. The outer function will maintain the state of login attempts and restrict the number of attempts allowed.

```typescript
type LoginRequest = {
  username: string;
  password: string;
};

type LoginResponse = {
  success: boolean;
  message: string;
  token?: string; // Optional, included only if login is successful
};

type LoginHandler = ActionHandler<LoginRequest, LoginResponse>;

function createRateLimitedLoginHandler(maxAttempts: number): LoginHandler {
  let attempts = 0;

  const loginHandler: LoginHandler = async (ctx, request) => {
    attempts++;

    if (attempts > maxAttempts) {
      return {
        success: false,
        message: "Too many login attempts. Please try again later.",
      };
    }

    console.log(`Trace ID: ${ctx.traceId}`);
    console.log(`Login attempt for user: ${request.username}`);

    // Simulate authentication
    if (request.username === "admin" && request.password === "password123") {
      return {
        success: true,
        message: "Login successful",
        token: "fake-jwt-token",
      };
    } else {
      return {
        success: false,
        message: "Invalid username or password",
      };
    }
  };

  return loginHandler;
}
```

#### Using the Rate-Limited LoginHandler

```typescript
const ctx: Context = { data: {}, traceId: "login-12345", date: new Date() };

const loginRequest: LoginRequest = {
  username: "admin",
  password: "password123",
};

const rateLimitedLoginHandler = createRateLimitedLoginHandler(3);

async function testLogin() {
  for (let i = 0; i < 5; i++) {
    const response = await rateLimitedLoginHandler(ctx, loginRequest);
    console.log(`Attempt ${i + 1}:`, response);
  }
}

testLogin();
```

### Benefits of Using Functions and Closures

One of the primary benefits of using functions and closures is the ability to extend and enhance existing functionality without modifying the original code. This adheres to the **Open/Closed Principle** of software design, which states that software entities should be open for extension but closed for modification.

#### Adding New Parameters via Closures

By using closures, you can create functions that carry additional state or configuration. This allows you to add new parameters or behavior to existing functions without changing their original implementation.

For example, in our `createRateLimitedLoginHandler`, the `maxAttempts` parameter adds rate-limiting functionality to the `loginHandler`. This additional behavior is encapsulated in the closure, allowing the `loginHandler` to be extended in a modular and maintainable way.

### Conclusion

Closures provide a powerful way to maintain state and extend functionality in TypeScript. By using closures, you can create more flexible and reusable code, adhering to principles like the Open/Closed Principle. The `ActionHandler` type, when used in combination with closures, allows you to build modular and extensible functions, enhancing maintainability and scalability of your application.
