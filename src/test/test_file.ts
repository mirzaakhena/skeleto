import { WrapperHandler } from "../core/type";

type Whatever<REQUEST = any, RESPONSE = any> = (r: REQUEST) => Promise<RESPONSE>;

type Person = {
  gggg: string;
};

/**
 * @ThisIsDecoratorInRequest {"bobo": "aaa"}
 */
class Request {
  /**
   * @Aaaa {}
   */
  name: string;

  /**
   * @XPersonX
   */
  person: Person;

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
}

type Response = {};

/**
 * @DecoratorReturnType {"theData": "what"}
 */
type ReturnType = Whatever<Request, Response>;

type AnotherReturnType = Whatever<
  {
    /**
     * @Something {"xxx":"zzz"}
     */
    name: string;
    address: string;

    /**
     * @boaboab {
     */
    hobbies: string[];
  },
  {
    id: string[];
    /**
     * @AnotherThing {"abc": { "q": [{"x": 1, "o": true}], "r": {"mo": false, "v": null}}}
     */
    payload: {
      anotherField: number[];
    };
  }
>;

type FirstParam = {};

type SecondParam = {};

type Logger = WrapperHandler;

/**
 * @Wrapper
 */
export function implMyWrapper(): Logger {
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
