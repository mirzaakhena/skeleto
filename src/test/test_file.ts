import { MiddlewareHandler } from "../core/type";

type Whatever<REQUEST = any, RESPONSE = any> = (r: REQUEST) => Promise<RESPONSE>;

type Request = {
  /**
   * @Aaaa {}
   */
  name: string;

  /**
   * @Xyz {"}
   */
  age: number;

  /**
   * @CCCCCC {"dddddd": "hello"}
   */
  aaaaa: {
    bbbbbb: number[];
  };
};

type Response = {};

type ReturnType = Whatever<Request, Response>;

type AnotherReturnType = Whatever<
  {
    /**
     * @Something
     */
    name: string;
    address: string;
    hobbies: string[];
  },
  {
    id: string[];
    /**
     * @AnotherThing {"abc": "hello"}
     */
    payload: {
      anotherField: number[];
    };
  }
>;

type FirstParam = {};

type SecondParam = {};

type Logger = MiddlewareHandler;

/**
 * @Middleware
 */
export function implMyMiddleware(): Logger {
  return (ah, fm) => {
    return ah;
  };
}

/**
 * @Config
 */
export function implFirstParam(): FirstParam {
  return {};
}

/**
 * @Config
 */
export function implSecondParam(x: FirstParam): SecondParam {
  return {};
}

/**
 * @Action {"readTypeArguments": true}
 * @Blablabla
 */
export function implReturnType(a: FirstParam, b: SecondParam): ReturnType {
  return async (a) => ({});
}

/**
 * @Action {"readTypeArguments": true}
 * @Blablabla
 */
export function implAnotheReturnType(a: FirstParam, b: SecondParam): AnotherReturnType {
  return async (a) => ({
    id: [""],
    payload: {
      anotherField: [12],
    },
  });
}
