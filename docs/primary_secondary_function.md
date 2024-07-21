# Primary and Secondary Functions

## Introduction

In our TypeScript framework, we distinguish between two types of functions: primary functions and secondary functions. This distinction helps in organizing the codebase and separating concerns according to well-established software engineering principles.

## Conceptual Overview

### Primary Functions

- In Clean Architecture terminology, primary functions can be seen as **use cases**.
- In the Controller-Service-Repository pattern, primary functions correspond to **services**.

### Secondary Functions

- In Clean Architecture, secondary functions act as **gateways**.
- While often associated with repositories in the Controller-Service-Repository pattern, our concept of secondary functions is broader. It encompasses not just database operations, but also API client calls, message queue interactions, and other external service integrations.

## Structure and Implementation

Both primary and secondary functions share a similar structure, derived from the `ActionHandler` type:

```typescript
export type Context = {
  /**
   * Flexible storage for any data
   */
  data: Record<string, any>;
  /**
   * Unique identifier for request tracing
   */
  traceId: string;
  /**
   * Timestamp for when the request started
   */
  date: Date;
};

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;
```

### Function Implementation Pattern

We maintain a consistent pattern for implementing functions:

```typescript
import { ActionHandler } from "skeleto";

type Request = {
  // all required payload (may contain optional payload) in order to run the function
};

type Response = {
  // all the information that may returned after the function is successfully executed
};

// the function type as an interface
export type OrderProcessReturn = ActionHandler<Request, Response>;

// the function type implementation
export function implOrderProcessReturn(): OrderProcessReturn {
  return async (ctx, req) => {
    // Implementation goes here
    return {};
  };
}
```

### Real-world Example

Here's a more concrete example of a primary function:

```typescript
import { ActionHandler } from "skeleto";

type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

type Request = {
  customerId: string;
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: string;
};

type Response = {
  orderId: string;
  totalAmount: number;
  estimatedDeliveryDate: Date;
};

export type OrderCreateNew = ActionHandler<Request, Response>;

export function implOrderCreateNew(): OrderCreateNew {
  return async (ctx, req) => {
    // Implementation goes here
    return {
      orderId: "",
      totalAmount: 0,
      estimatedDeliveryDate: new Date(),
    };
  };
}
```

## Connecting Primary and Secondary Functions

Primary functions often depend on secondary functions. We inject these dependencies as parameters to the primary function implementation:

```typescript
type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

type Request = {
  customerId: string;
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: string;
};

type Response = {
  orderId: string;
  totalAmount: number;
  estimatedDeliveryDate: Date;
};

type OrderCreateNew = ActionHandler<Request, Response>;

type GenerateId = ActionHandler<void, string>;
type GetCurrentDate = ActionHandler<void, Date>;
type SaveOrder = ActionHandler<
  {
    id: string;
    customerId: string;
    items: OrderItem[];
    shippingAddress: string;
    paymentMethod: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
  },
  void
>;

export function implOrderCreateNew(generateId: GenerateId, getCurrentDate: GetCurrentDate, saveOrder: SaveOrder): OrderCreateNew {
  return async (ctx, req) => {
    if (req.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    const orderId = await generateId(ctx);
    const currentDate = await getCurrentDate(ctx);
    const estimatedDeliveryDate = new Date(currentDate.getTime());
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7); // Estimated 7 days for delivery

    const totalAmount = req.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const newOrder = {
      id: orderId,
      customerId: req.customerId,
      items: req.items,
      shippingAddress: req.shippingAddress,
      paymentMethod: req.paymentMethod,
      totalAmount,
      status: "created",
      createdAt: currentDate,
    };

    await saveOrder(ctx, newOrder);

    return {
      orderId,
      totalAmount,
      estimatedDeliveryDate,
    };
  };
}
```

## Secondary Functions

Secondary functions typically handle operations such as:

- Retrieving the current time (`GetCurrentDate`)
- Generating random values (`GenerateId`)
- Fetching data from a database (e.g., `FindOrderById`)
- Saving data to a database (`SaveOrder`)
- Calling external services (e.g., API calls to other microservices)

These secondary functions are connected to primary functions by being passed as parameters to the primary function implementation.

This pattern allows for better separation of concerns, easier testing, and improved modularity in your TypeScript framework.
