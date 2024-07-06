import { ActionHandler } from "skeleto";

export type GreetingService = ActionHandler<void, { getGreeting: (name: string) => string; getHi: (name: string) => string }>;

/**
 *
 * @Action {"readTypeArguments": true}
 */
export function _(): GreetingService {
  return async () => {
    return {
      getGreeting: (name) => `Hello ${name}`,
      getHi: (name) => `Hi ${name}`,
    };
  };
}
