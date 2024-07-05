export type Context = { data: Record<string, any>; traceId: string; date: Date };

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type WrapperHandler = (actionHandler: ActionHandler, functionMetadata: FuncMetadata) => ActionHandler;

export type FuncInstanceMetadata = { funcInstance: any; funcMetadata: FuncMetadata };

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
   *    `@SomeDecorator`
   *    type ReturnFunc01 = ActionHandler<Request, Response>;
   *    ```
   *
   * the `@SomeDecorator` is in JSDoc form
   */
  returnTypeDecorator?: Decorator[];

  /**
   * metadata for Request
   *    ```
   *    type ReturnFunc01 = ActionHandler<Request, Response>;
   *    ```
   */
  request?: Payload;

  /**
   * metadata for Response
   *    ```
   *    type ReturnFunc01 = ActionHandler<Request, Response>;
   *    ```
   */
  response?: Payload;
};

export type Payload = { name: string; path: string; structure: TypeField[]; decorators?: Decorator[] };

export type TypeOf<T extends readonly any[]> = T[number];

export type Decorator<T = string> = { name: T; data: any };

export const InjectableDecorator = ["Config", "Wrapper", "Action"] as const;

export type TypeField = {
  name: string;
  type: "string" | "number" | "integer" | "array" | "boolean" | "null" | "object";

  /**
   * is a decorator used in field request and response
   */
  decorators: Decorator[];
};
