import { ActionHandler } from "skeleto";

export type GreetingService = ActionHandler<void, { getGreeting: (name: string) => string }>;

/**
 * @Config
 */
export function implGreetingService(): GreetingService {
  return async () => {
    return {
      getGreeting: (name: string) => `Hello ${name}`,
    };
  };
}
