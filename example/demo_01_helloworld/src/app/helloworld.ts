import { ActionHandler } from "skeleto";

type HelloWorldRequest = {
  name: string;
};

type HelloWorldResponse = {
  message: string;
};

/**
 * @Something {"thisInfo": "hello"}
 */
type HelloWorld = ActionHandler<HelloWorldRequest, HelloWorldResponse>;

/**
 *
 * @Action {"someData": "test"}
 */
export function implHelloWorld(): HelloWorld {
  return async (ctx, req) => {
    return {
      message: `Hello ${req.name}`,
    };
  };
}
