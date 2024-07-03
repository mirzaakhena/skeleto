export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type WrapperHandler = (actionHandler: ActionHandler, functionMetadata: FuncMetadata) => ActionHandler;

export type FuncInstanceMetadata = { funcInstance: any; funcMetadata: FuncMetadata };

export type FuncMetadata = {
  name: string;
  dependencies: string[];

  mainDecorator: Decorator<TypeOf<typeof InjectableDecorator>>;
  additionalDecorators: Decorator[];

  request?: { name: string; path: string; structure: TypeField[] };
  response?: { name: string; path: string; structure: TypeField[] };
};

export type TypeOf<T extends readonly any[]> = T[number];

export type Decorator<T = string> = { name: T; data: any };

export const InjectableDecorator = ["Config", "Wrapper", "Action"] as const;

export type TypeField = {
  name: string;
  type: "string" | "number" | "integer" | "array" | "boolean" | "null" | "object";
  decorators: Decorator[];
};
