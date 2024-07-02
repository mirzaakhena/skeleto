# Skeleto

Is a Framework that used function as a backbone of the framework instead of using class.

It also use Dependency Injection to inject some component to any other component by utilize the closure.

Why using function instead of class?

Every Component is defined by JSDoc. We use JSDoc because of current limitation by typescript language that cannot allowed decorator at the function. So that we use JSDoc.

There are 3 kind of components: Config, Middleware and Action

## Config

A decorator to define an object (ex: database configuration) that used by Gateways

```
// src/config/database.ts

import { DataSource } from "typeorm";

// define the type for DataSource
export type AppDataSource = DataSource

/**
 *
 * @Config
 */
export function implDatabase(): AppDataSource {
  return new DataSource({
    type: "postgres" as const,
    port: 5432,
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
    synchronize: true,
    connectTimeoutMS: 500,
    logging: false,
    entities: [
      //
      "src/app/model/model_*{.js,.ts}",
    ],
  });
}
```

By using `Config` decorator, we store the Object `Datasource` into containers.

## Gateway

a component to define any function used by UseCases

```
// src/gateway/user.ts

import { GatewayHandler } from "skeleto";
import { AppDataSource } from "../config/database.js";
import { User } from "./model/model_product.js";

// define request type
type Request = {
  email: string
}

// define response type
type Response = User

// define a function type as Gateway with a defined request and response type
export type FindOneUserByEmail = GatewayHandler<Request, Response>

/**
 *
 * @Gateway
 */
export function implFindOneUserByEmail(ds: AppDataSource): FindOneUserByEmail {
  return async (ctx, req) => {
    return await ds.getRepository(User).findOne({ where: { email: req.email } });
  };
}
```

By declaring `Gateway` decorator, `Skeleto` will inject `AppDataSource` object into the function parameter.
Then `Skeleto` also store the object `FindOneUserByEmail` into container.

## UseCase

a component to define your core logic

```
import { UseCaseHandler } from "skeleto";
import { FindOneUserByEmail } from "../gateway/user.js";

// define request type
type Request = {
  email: string;
  name: string;
};

// define response type
type Response = {
  personId: Person;
};

// define a function type as UseCase with a defined request and response type
export type RegisterUniqueUser = UseCaseHandler<Request, Response>;

/**
 *
 * @UseCase
 */
export function ImplRegisterUniqueUser( //
  //
  findOnePersonByEmail: FindOnePersonByEmail,
  savePerson: SavePerson,
  generateRandomId: GenerateRandomId
): RegisterUniqueUser {

  return async (ctx, req) => {

    if (req.email.trim() === "") {
      throw new Error(`Email must not be empty`);
    }

    const objPerson = await findOnePersonByEmail(ctx, { email: req.email });

    if (objPerson.person) {
      throw new Error(`Person with email ${req.email} already exists`);
    }

    const newPerson = new Person();
    newPerson.email = req.email;
    newPerson.id = await generateRandomId(ctx);

    await savePerson(ctx, { person: newPerson });

    return { personId: newPerson.id };

  }
}
```

## Middleware

a component that will wrap your Usecases or Gateways component
