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
  path: string;

  /**
   * field structure for each Payload
   */
  structure: TypeField[];

  /**
   * a decorator used by Payload
   */
  decorators?: Decorator[];
};

export const InjectableDecorator = ["Config", "Wrapper", "Action"] as const;
