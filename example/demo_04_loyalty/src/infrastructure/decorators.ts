import { FuncMetadata, SkeletoOptions } from "skeleto";

const methods = ["get", "post", "put", "patch", "delete"];

const requestParts = ["body", "query", "param", "header"];

function validateController(data: any, metadata: FuncMetadata) {
  if (!methods.includes(data?.method)) return `needs a method, one of: ${methods.join(", ")}`;

  if (typeof data.path !== "string") return "needs a path";

  if (typeof data.tag !== "string") return "needs a tag";

  const withoutRequestPart = metadata.request?.structure?.filter((x) => !x.decorators.some((y) => y.name === "RequestPart"));
  if (withoutRequestPart?.length) return `needs @RequestPart on: ${withoutRequestPart.map((x) => x.name).join(", ")}`;

  return undefined;
}

// a typo in any decorator of this application stops the startup
export const decoratorOptions: SkeletoOptions = {
  decorators: {
    Transaction: {},
    Controller: {
      requiresTypeArguments: true,
      validate: validateController,
      requestFields: {
        RequestPart: {
          validate: (data) => (requestParts.includes(data) ? undefined : `must be one of: ${requestParts.join(", ")}`),
        },
      },
    },
  },
  fieldDecorators: {
    Required: {},
    OneOf: {
      validate: (data) => (Array.isArray(data?.values) ? undefined : 'needs {"values": [...]}'),
    },
  },
};
