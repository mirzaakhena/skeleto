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
 * @Action {"readTypeArguments": true}
 */
export function _(gs: GreetingService): HelloWorld {
  return async (ctx, req) => {
    const result = await gs(ctx);

    result.getHi("");

    return {
      message: `Hello ${result.getGreeting(req.name)}`,
    };
  };
}
