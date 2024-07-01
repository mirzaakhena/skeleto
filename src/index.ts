export { newContext, Skeleto } from "./core/core.js";
export { RequestWithContext, getRequestWithContext, generateController } from "./core/expressjs.js";
export { generateOpenAPIObject } from "./core/openapi.js";
export { printController } from "./core/printcontroller.js";
export { Context, GatewayHandler, UsecaseHandler, PluginHandler } from "./core/type.js";

export function Something() {
  return "hello";
}
