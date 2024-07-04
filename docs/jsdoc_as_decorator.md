## Decorator

### Decorators in TypeScript

A decorator is a special kind of declaration that can be attached to a class, method, accessor, property, or parameter. Decorators are a way to add annotations and a meta-programming syntax for class declarations and members. A decorator is essentially a function that can modify the behavior or attributes of the element it decorates.

#### Syntax

A decorator is defined using the `@` symbol followed by a function name. Here is a basic example:

```typescript
function MyDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  //

  console.log("My Decorator is defined");

  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log("Decorator called");

    // Call the original method
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class MyClass {
  @MyDecorator
  myMethod() {
    console.log("Hello, World!");
  }
}

console.log("before class instantiation");
const myInstance = new MyClass();
console.log("after class instantiation");
myInstance.myMethod();
myInstance.myMethod();
myInstance.myMethod();
console.log("after method called");
```

output

```bash
My Decorator is defined
before class instantiation
after class instantiation
Decorator called
Hello, World!
Decorator called
Hello, World!
Decorator called
Hello, World!
after method called
```

In this example:

- `MyDecorator` is a decorator function.
- `@MyDecorator` is used to decorate `myMethod` in the `MyClass` class.

When the `MyClass` class is defined, the TypeScript compiler will process the `@MyDecorator` decorator applied to `myMethod`.

- `MyDecorator` is executed with the following arguments:
  - `target`: The prototype of `MyClass` (i.e., `MyClass.prototype`).
  - `propertyKey`: The string `"myMethod"`.
  - `descriptor`: The property descriptor for `myMethod`.

The decorator simply logs "Decorator called" to the console.

### Current Limitation: Decorators Only on Class Elements

As of now, TypeScript's decorators are only supported on class elements, not standalone functions. This means you can decorate classes, methods, accessors, properties, and parameters inside a class, but you can't apply a decorator to a standalone function.

Here is an example of what is **not** currently supported:

```typescript
@MyDecorator
function myFunction() {
    console.log("Hello, World!");
}
```

This will result in a syntax error because decorators cannot be applied to standalone functions at this time.

### JSDoc in TypeScript

JSDoc is a standardized way to annotate JavaScript code with comments. TypeScript understands many JSDoc annotations and can provide type inference based on them. This is especially useful for JavaScript projects that want to gradually migrate to TypeScript, or to provide better tooling support and IntelliSense in editors.

Here is an example of a JSDoc comment in TypeScript:

```typescript
/**
 * Adds two numbers together.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of the two numbers.
 */
function add(a: number, b: number): number {
  return a + b;
}
```

### Using JSDoc as a Decorator in a Function

While JSDoc comments and decorators serve different purposes, `skeleto` utilize the use of JSDoc as a decorated functions.

So in this case, instead of writing like this:

```typescript
@MyDecorator
function myFunction() {
    console.log("Hello, World!");
}
```

we will write this

```typescript
/**
 * @MyDecorator
 */
function myFunction() {
  console.log("Hello, World!");
}
```

I understand that using JSDoc comments for decorators is more verbose compared to the traditional @decorator syntax. However, this approach is necessary to bypass the current limitations.

In this context, the decorator serves as metadata for the function, providing additional information or describing its type.

For example:

```typescript
/**
 * @Controller { "method": "post", "path": "/person" }
 */
function myController() {
  // some mechanism to handle the controller
}
```

Alternatively, you can write it as:

```typescript
/**
 * @Controller {
 *  "method": "post",
 *  "path": "/person"
 * }
 */
function myController() {
  // some mechanism to handle the controller
}
```

We use standalone functions instead of class methods for the sake of simplicity. By avoiding the use of classes—which require defining a class name, constructor, fields, etc.—we can achieve the same results using closures. This approach not only simplifies the structure but also adheres to the Single Responsibility Principle.
