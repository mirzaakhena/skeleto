// src/core/type.ts

/**
 * Structured way to pass metadata through functions, ensuring that all necessary information flows along with the function calls. This can be especially useful for logging, tracing, and managing state across a series of function calls.
 * - data: This property is a record (or dictionary) where the keys are strings and the values are of any type. You can store various types of data here, such as state information, database transactions, additional log information, etc.
 * - traceId: This property is a string that serves as a unique identifier, allowing you to trace a series of function calls back to a single request or session. This is particularly useful for debugging and monitoring.
 * - date: This property is a `Date` object representing the timestamp when the request started. This can help in tracking the duration of the request and for logging purposes.
 *
 */
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

/**
 * generic function type that standardizes the structure of functions handling actions within your application. It ensures that these functions maintain a consistent signature, making your code more predictable and easier to maintain.
 *
 * - `ctx: Context`: The first parameter is your `Context` object, which contains metadata like `data`, `traceId`, and `date`.
 * - `request: REQUEST`: The second parameter is the request object, whose type is defined by the `REQUEST` generic parameter.
 * - `Promise<RESPONSE>`: The return type of the function is a `Promise` that resolves to a response of type `RESPONSE`.
 */
export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type TypeOf<T extends readonly any[]> = T[number];

export type FuncMetadata = {
  /**
   * The return type name from the function closure. For example :
   *    ```
   *    export function implFindOnePersonByEmail(ds: DataSource): FindOnePersonByEmail {
   *      return async (ctx, req) => {
   *        return await getDataSourceFromContext(ctx, ds)
   *          .getRepository(Person)
   *          .findOne({ where: { email: req.email } });
   *      };
   *    }
   *    ```
   * In that function, the name is : `FindOnePersonByEmail`
   */
  name: string;

  /**
   * All the dependency of the function closure. For example :
   *    ```
   *    export function implFindOnePersonByEmail(ds: DataSource): FindOnePersonByEmail {
   *      return async (ctx, req) => {
   *        return await getDataSourceFromContext(ctx, ds)
   *          .getRepository(Person)
   *          .findOne({ where: { email: req.email } });
   *      };
   *    }
   *    ```
   * In that function we only have one only dependency which is a `Datasource`
   */
  dependencies: string[];

  /**
   * there are 3 types of main decorator: `@Action`, `@Config` and `@Wrapper` in JSDoc form
   */
  mainDecorator: Decorator<TypeOf<typeof InjectableDecorator>>;

  /**
   * is another decorators like  `@Controller`, `@Transaction`, `@Logging`, `@ErrorHandler` or your custom made decorator used beside the main decorator
   */
  additionalDecorators: Decorator[];

  /**
   * is a JSDoc decorators used in return type definition like
   *    ```
   *    @SomeDecorator
   *    type ReturnFunc01 = ActionHandler<Request, Response>;
   *    ```
   *
   * the `@SomeDecorator` is in JSDoc form
   */
  returnTypeDecorator?: Decorator[];

  /**
   * metadata for TypeArgument Request
   *    ```
   *    type ReturnFunc01 = ActionHandler<Request, Response>;
   *    ```
   */
  request?: Payload;

  /**
   * metadata for TypeArgument Response
   *    ```
   *    type ReturnFunc01 = ActionHandler<Request, Response>;
   *    ```
   */
  response?: Payload;
};

/**
 *
 */
export type WrapperHandler = (actionHandler: ActionHandler, functionMetadata: FuncMetadata) => ActionHandler;

/**
 * Store the function instance and function metadata
 */
export class FuncInstanceMetadata {
  constructor(private funcInstance: any, private funcMetadata: FuncMetadata) {}
  getInstance = () => this.funcInstance;
  getMetadata = () => this.funcMetadata;
}

export type Decorator<T = string> = { name: T; data: any };

export type TypeField = {
  /**
   * For example, we have :
   *
   *   ```
   *   address: string
   *   ```
   * then the name is `address`
   */
  name: string;

  /**
   * For example, we have :
   *
   *   ```
   *   address: string
   *   ```
   * then the type is `string`
   */
  type: any;

  /**
   * decorator used in each field of Request and Response
   */
  decorators: Decorator[];
};

export type Payload = {
  /**
   * name of Payload type
   */
  name: string;

  /**
   * file location of Payload type
   */
  path?: string;

  /**
   * field structure for each Payload
   */
  structure?: TypeField[];

  /**
   * a decorator used by Payload
   */
  decorators?: Decorator[];
};

export const InjectableDecorator = ["Config", "Wrapper", "Action"] as const;
