import { WrapperHandler } from "skeleto";
import { ValidationError } from "../app/model/error.js";

export type Validation = WrapperHandler;

const primitiveTypes = ["string", "number", "boolean"];

function isExpectedType(value: unknown, type: string) {
  // the type of an optional field is read as "number | undefined"
  const expectedType = type.replace(" | undefined", "");

  if (!primitiveTypes.includes(expectedType)) return true;

  return typeof value === expectedType && !Number.isNaN(value);
}

/**
 * It has a lower ordinal than logging and a higher one than transaction,
 * so an invalid request is logged but never opens a transaction.
 *
 * @Wrapper {"ordinal": 2}
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

        if (!isExpectedType(value, field.type)) {
          throw new ValidationError(`${field.name} must be a ${field.type.replace(" | undefined", "")}`);
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
