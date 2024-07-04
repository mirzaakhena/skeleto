## Dependency Injection in TypeScript

Dependency Injection (DI) is a design pattern used to implement IoC (Inversion of Control). It allows a class to receive its dependencies from an external source rather than creating them itself. This makes the code more modular, testable, and maintainable.

In order to use Dependency Injection effectively, let's illustrate these steps with a concrete example. We generally follow four key steps:

1. **Define Function Type Alias**:

   The first step is to define a function type alias that specifies the shape of the functions to be injected.

   ```typescript
   type ProcessData = (data: string) => void;
   ```

   Here, `ProcessData` is a type alias for any function that takes a string as an argument and returns void. This defines the shape of the functions that can be injected.

2. **Use the Type Alias in a Function Parameter**:

   Next, you create a function that accepts a parameter of the defined type alias. This function will act as the handler that calls the injected function.

   ```typescript
   function processDataWithHandler(handler: ProcessData) {
     const data = "Sample Data";
     handler(data);
   }
   ```

   The `processDataWithHandler` function takes a parameter `handler` of type `ProcessData`. This function will call the passed-in handler with a string argument. This is our primary function that will use dependency injection.

3. **Implement Concrete Functions**:

   Then, you implement concrete functions based on the function type alias.

   ```typescript
   // Concrete implementation of ProcessData type
   const logData: ProcessData = (data: string) => {
     console.log(`Logging data: ${data}`);
   };

   // Another concrete implementation of ProcessData type
   const processData: ProcessData = (data: string) => {
     console.log(`Processing data: ${data.toUpperCase()}`);
   };
   ```

   We create concrete implementations of the `ProcessData` type, such as `logData` and `processData`. `logData` logs the data, while `processData` processes the data by converting it to uppercase.

4. **Use it in Client Code**:

   Finally, we will create some client code that uses `processDataWithHandler` with a concrete implementation of the `ProcessData` type.

   ```typescript
   // Injecting the concrete implementations
   processDataWithHandler(logData); // Output: Logging data: Sample Data
   processDataWithHandler(processData); // Output: Processing data: SAMPLE DATA
   ```

   Here we demonstrating how different behaviors can be injected and executed.

### Real life Example using `ActionHandler`

Here’s an another example demonstrating how you can use Dependency Injection to register a user using two different implementations: one with a real database and another with a mock database for testing purposes.

1. **Define Types**:
   Define `Context`, `ActionHandler`, user-related types, and specific request/response types for the register user handler.

   ```typescript
   type Context = {
     data: Record<string, any>;
     traceId: string;
     date: Date;
   };

   type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

   type User = {
     id: string;
     email: string;
     name: string;
   };

   // function used by handler
   type FindUserByEmailRequest = { email: string };
   type FindUserByEmailResponse = User | null;
   type FindUserByEmail = ActionHandler<FindUserByEmailRequest, FindUserByEmailResponse>;

   type SaveUserRequest = User;
   type SaveUserResponse = void;
   type SaveUser = ActionHandler<SaveUserRequest, SaveUserResponse>;

   type GenerateUniqueIdRequest = void;
   type GenerateUniqueIdResponse = string;
   type GenerateUniqueId = ActionHandler<GenerateUniqueIdRequest, GenerateUniqueIdResponse>;

   // the main handler
   type RegisterUserRequest = { email: string; name: string };
   type RegisterUserResponse = void;
   type RegisterUser = ActionHandler<RegisterUserRequest, RegisterUserResponse>;
   ```

   - `Context`: Represents the context of the action, including `data`, `traceId`, and `date`.
   - `ActionHandler`: Generic type for action handlers that take a `Context` and a `REQUEST` and return a `Promise` of `RESPONSE`.
   - `User`: Represents a user object.
   - `FindUserByEmailRequest`, `FindUserByEmailResponse`, `SaveUserRequest`, `SaveUserResponse`, `GenerateUniqueIdRequest`, `GenerateUniqueIdResponse` : Specific types for request and response payloads.
   - `FindUserByEmail`, `SaveUser`, `RegisterUser`, `GenerateUniqueId`: Type aliases for specific `ActionHandler` implementations.

2. **Implement the Outer Function with Closure**:

   ```typescript
   function registerUser(findUserByEmail: FindUserByEmail, saveUser: SaveUser, generateUniqueId: GenerateUniqueId): RegisterUser {
     //

     return async (ctx, request) => {
       //

       const { email, name } = request;

       console.log(`Trace ID: ${ctx.traceId}, Date: ${ctx.date.toISOString()}`);

       const existingUser = await findUserByEmail(ctx, { email });
       if (existingUser) {
         throw new Error(`User with email ${email} already exists.`);
       }

       const newUser: User = {
         id: await generateUniqueId(ctx),
         email,
         name,
       };

       await saveUser(ctx, newUser);
       console.log(`User with email ${email} has been registered successfully.`);
     };
   }
   ```

   `registerUser`: An outer function that takes `findUserByEmail`, `saveUser` and `generateUniqueId` functions as parameters and returns an `ActionHandler`. The inner function (closure) adheres to the `ActionHandler` type, receiving `Context` and `RegisterUserRequest` and returning a `Promise<void>`. The closure function checks for existing users and saves new users using the provided implementations.

3. **Implement Concrete Functions for Real Database**:

   ```typescript
   // Simulated real database
   const realDatabase: User[] = [];

   // Real implementation of FindUserByEmail
   const realFindUserByEmail: FindUserByEmail = async (ctx, request) => {
     return realDatabase.find((user) => user.email === request.email) || null;
   };

   // Real implementation of SaveUser
   const realSaveUser: SaveUser = async (ctx, user) => {
     realDatabase.push(user);
   };

   // Real implementation of GenerateUniqueId
   const realGenerateUniqueId: GenerateUniqueId = async (ctx) => {
     return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
   };
   ```

   `realFindUserByEmail`, `realSaveUser` and `realGenerateUniqueId`: Concrete implementations that interact with a simulated real database.

   **Implement Concrete Functions for Mock Database**:

   ```typescript
   // Mock implementation of FindUserByEmail
   const mockFindUserByEmail: FindUserByEmail = async (ctx, request) => {
     // mocking some behaviour
     if (request.email === "jane.doe@example.com") {
       return {
         id: "123",
         name: "Jane Doe",
         email: "jane.doe@example.com",
       };
     }

     return null;
   };

   // Mock implementation of SaveUser
   const mockSaveUser: SaveUser = async (ctx, user) => {
     // pretend that the save is already done
     console.log("data is saved!");
   };

   // Mock implementation of GenerateUniqueId
   const mockGenerateUniqueId: GenerateUniqueId = async (ctx) => {
     // always return the same value
     return "u78bcekejjlipsp9j8pfb";
   };
   ```

   `mockFindUserByEmail`, `mockSaveUser` and `mockGenerateUniqueId`: Concrete implementations that interact with a simulated mock database.

4. **Client Code to Use Both Implementations**:

   ```typescript
   // Context for the actions
   const ctx: Context = { data: {}, traceId: "12345", date: new Date() };

   // Using real database
   const registerUserHandler = registerUser(realFindUserByEmail, realSaveUser);

   // Or using mock database
   // const registerUserHandler = registerUser(mockFindUserByEmail, mockSaveUser);

   try {
     await registerUserHandler(ctx, { email: "john.doe@example.com", name: "John Doe" });
   } catch (error) {
     console.error(error.message);
   }
   ```

   Demonstrates the use of the `registerUser` function with both real and mock database implementations.

### Mock Implementation for Testing

One of the key benefits of using Dependency Injection is the ability to easily swap out real implementations for mock ones, especially during testing. By using mock implementations, we can control and steer the internal input of functions to mimic specific behaviors without interacting with the real database.

#### Benefits of Mock Implementation

1. **Isolation**: Tests can be run in isolation without relying on external systems.
2. **Predictability**: Mock data is consistent and predictable, leading to more reliable tests.
3. **Performance**: Tests run faster as they do not involve actual database operations.
4. **Safety**: Avoids potential side effects and data corruption in the real database.

### Conclusion

By using Dependency Injection, you can easily switch between different implementations, such as a real database and a mock database, without changing the core logic of your `registerUser` function. This approach makes your code more modular, testable, and maintainable.
