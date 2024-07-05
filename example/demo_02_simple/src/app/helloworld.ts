import { ActionHandler } from "skeleto";
import { GreetingService } from "./greeting_service.js";

type HelloWorldRequest = {
  name: string;
};

type HelloWorldResponse = {
  message: string;
};

type HelloWorld = ActionHandler<HelloWorldRequest, HelloWorldResponse>;

/**
 *
 * @Action
 */
export function implHelloWorld(gs: GreetingService): HelloWorld {
  return async (ctx, req) => {
    const result = await gs(ctx);

    return {
      message: `Hello ${result.getGreeting(req.name)}`,
    };
  };
}
