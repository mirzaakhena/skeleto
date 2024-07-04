export type Context = {
  data: Record<string, any>;
  traceId: string;
  date: Date;
};

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type WrapperHandler = (actionHandler: ActionHandler, functionMetadata: FuncMetadata) => ActionHandler;

export type FuncInstanceMetadata = { funcInstance: any; funcMetadata: FuncMetadata };

export type FuncMetadata = {
  name: string;
  dependencies: string[];

  /**
   * there are 3 types of main decorator : '@Action', '@Config', '@Wrapper'
   */
  mainDecorator: Decorator<TypeOf<typeof InjectableDecorator>>;

  /**
   * is another decorators (like  '@controller', '@Transaction' or your custom made decorator) used beside the main decorator
   */
  additionalDecorators: Decorator[];

  /**
   * is a decorators used in return type definition
   */
  returnTypeDecorator?: Decorator[];

  request?: { name: string; path: string; structure: TypeField[]; decorators?: Decorator[] };
  response?: { name: string; path: string; structure: TypeField[]; decorators?: Decorator[] };
};

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
