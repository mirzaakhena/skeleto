import { ActionHandler, WrapperHandler } from "../../core/type";

type Person = {
  id: string;
  name: string;
  age: number;
};

/**
 * @RequestType01 {}
 * @RequestType02
 */
type Request = {
  /**
   * @RequestField01 {"aa": 1}
   * @RequestField02 {"ab": 2}
   */
  name: string;

  /**
   * @RequestField11 {"ac": 3}
   * @RequestField12 {"ad": 4}
   */
  age: number;
};

/**
 * @ResponseType01
 * @ResponseType02
 */
type Response = {
  /**
   * @ResponseField01 {"ae": 5}
   * @ResponseField02 {"af": 6}
   */
  person: Person;

  /**
   * @ResponseField11 {"ag": 7}
   * @ResponseField12 {"ah": 8}
   */
  token: string;
};

/**
 * @FunctionType01 {"a": 4}
 * @FunctionType02 {"b": true}
 */
type ReturnFunc01 = ActionHandler<Request, Response>;

/**
 * @Action {"readTypeArguments": true}
 * @YourCustom {"a": 12}
 */
export function func01(ds: DataSource): ReturnFunc01 {
  return async (ctx, req) => ({
    person: {
      age: 1,
      id: "",
      name: "",
    },
    token: "",
  });
}

type DataSource = {
  name: "postgres" | "mysql";
};

/**
 * @Config
 */
export function func02(): DataSource {
  return {
    name: "mysql",
  };
}

type MyLogger = WrapperHandler;

/**
 * @Wrapper {"ordinal": 1}
 */
export function func03(): MyLogger {
  // step 1
  return (ah, fm) => {
    // step 2
    return async (ctx, req) => {
      // step 3
      return ah;
    };
  };
}

type MyTransaction = WrapperHandler;

/**
 * @Wrapper {"ordinal": 2}
 */
export function func04(): MyTransaction {
  // step 1
  return (ah, fm) => {
    // step 2
    return async (ctx, req) => {
      // step 3
      return ah;
    };
  };
}
