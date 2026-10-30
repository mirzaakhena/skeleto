import { ValidationError } from "../app/model_todo.js";
import { Validation } from "../app/types.js";

const primitiveTypes = ["string", "number", "boolean"];

/**
 * Validates the request from its type metadata, so it has nothing to do with HTTP.
 * An action without readTypeArguments has no structure, and is left as it is.
 *
 * @Wrapper {"ordinal": 1}
 */
export function implValidation(): Validation {
  return (handler, fm) => {
    const fields = fm.request?.structure;
    if (!fields) return handler;

    return async (ctx, req) => {
      for (const field of fields) {
        const value = req?.[field.name];

        if (value === undefined || value === null) {
          if (field.decorators.some((x) => x.name === "Required")) {
            throw new ValidationError(`${field.name} is required`);
          }
          continue;
        }

        if (primitiveTypes.includes(field.type) && typeof value !== field.type) {
          throw new ValidationError(`${field.name} must be a ${field.type}`);
        }

        const oneOf = field.decorators.find((x) => x.name === "OneOf");
        if (oneOf && !oneOf.data.values.includes(value)) {
          throw new ValidationError(`${field.name} must be one of: ${oneOf.data.values.join(", ")}`);
        }
      }

      return handler(ctx, req);
    };
  };
}
