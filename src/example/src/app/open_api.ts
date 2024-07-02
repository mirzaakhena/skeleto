import * as TJS from "typescript-json-schema";
import { OpenAPI3, ParameterObject, ReferenceObject, SchemaObject, SecuritySchemeObject } from "./open_api_schema.js";
import { FuncMetadata } from "skeleto";

type Methods = "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

function camelToPascalWithSpace(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCase
    .replace(/([a-zA-Z])+/g, (match) => match.charAt(0).toUpperCase() + match.slice(1)); // Convert to PascalCase
}

export function generateOpenAPIObject(useCases: FuncMetadata[], securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>) {
  //

  const settings: TJS.PartialArgs = { required: true };
  const compilerOptions: TJS.CompilerOptions = { strictNullChecks: true };

  const openAPIObject: OpenAPI3 = {
    openapi: "3.0.0",
    info: { title: "App", version: "1.0.0" },
    paths: {},
    components: {
      securitySchemes,
      schemas: {},
    },
  };

  const paths = useCases.map((funcMetadata) => funcMetadata.request?.path as string);

  const program = TJS.getProgramFromFiles(paths, compilerOptions);

  useCases.forEach((funcMetadata) => {
    //

    const requestField = TJS.generateSchema(program, funcMetadata.request?.name as string, settings);

    const responseField = TJS.generateSchema(program, funcMetadata.response?.name as string, settings);

    const data = funcMetadata.additionalDecorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string; security: string };

    let path = data.path;

    const parameters: ParameterObject[] = [];

    const bodyFields: string[] = [];

    funcMetadata.request?.structure.forEach((x) => {
      //

      x.decorators.forEach((y) => {
        //

        if (y.name !== "RequestPart") return;

        if (y.data === "param") {
          //

          path = path.replace(`:${x.name}`, `{${x.name}}`);

          let schema = (requestField?.properties?.[x.name] as SchemaObject) ?? { type: x.type };

          parameters.push({
            in: "path",
            name: x.name,
            schema,
            required: true,
          });
          return;
        }

        if (y.data === "query") {
          let schema = (requestField?.properties?.[x.name] as SchemaObject) ?? { type: x.type };
          parameters.push({
            in: "query",
            name: x.name,
            schema,
          });
          return;
        }

        if (y.data === "body") {
          bodyFields.push(x.name);
          return;
        }
      });
    });

    let definitionSchema: any = {};

    let requestBodySchema: any = {};
    {
      const removedField = Object.keys(requestField?.properties!).filter((x) => !bodyFields.some((y) => y === x));

      const updatedSchema = removeFieldsFromSchema(requestField!, removedField);

      const { definitions, $schema, ...requestBodySchemaWithoutDefinitions } = updatedSchema;

      updateReferences(requestBodySchemaWithoutDefinitions);

      requestBodySchema = requestBodySchemaWithoutDefinitions;

      definitionSchema = definitions;

      if (Object.keys(requestBodySchema.properties).length === 0) {
        requestBodySchema = null;
      }
    }

    let responseSchema: any = {};
    {
      const { definitions, $schema, ...responseBodySchemaWithoutDefinitions } = responseField!;

      updateReferences(responseBodySchemaWithoutDefinitions);

      responseSchema = responseBodySchemaWithoutDefinitions;

      definitionSchema = { ...definitionSchema, ...definitions };
    }

    openAPIObject.paths = {
      ...openAPIObject.paths,
      [path]: {
        ...openAPIObject.paths![path],
        [data.method]: {
          tags: [data.tag],
          security: data.security,
          operationId: funcMetadata.name,
          summary: camelToPascalWithSpace(funcMetadata.name),
          parameters: parameters.length > 0 ? parameters : undefined,
          requestBody:
            requestBodySchema === null || data.method === "get" || data.method === "delete" || data.method === "options" || data.method === "head"
              ? undefined
              : {
                  required: bodyFields.length > 0,
                  description: "",
                  content: {
                    "application/json": {
                      schema: requestBodySchema,
                    },
                  },
                },
          responses: {
            default: {
              description: "",
              content: {
                "application/json": {
                  schema: responseSchema,
                },
              },
            },
          },
        },
      },
    };

    openAPIObject.components = {
      ...openAPIObject.components,
      schemas: convertDefinitionsToSchemas(definitionSchema),
    };
  });

  return openAPIObject;
}

function updateReferences(schema: any) {
  if (typeof schema !== "object" || schema === null) {
    return;
  }

  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      if (key === "$ref") {
        schema[key] = schema[key].replace("#/definitions/", "#/components/schemas/");
      } else {
        updateReferences(schema[key]);
      }
    }
  }
}

function removeFieldsFromSchema(schema: TJS.Definition, fieldsToRemove: string[]): TJS.Definition {
  const updatedSchema = { ...schema };

  // Remove fields from properties
  fieldsToRemove.forEach((field) => {
    if (updatedSchema.properties) {
      delete updatedSchema.properties[field];
    }
  });

  // Update the required property
  updatedSchema.required = updatedSchema.required?.filter((field) => !fieldsToRemove.includes(field));

  return updatedSchema;
}

function convertDefinitionsToSchemas(definitions: { [key: string]: TJS.DefinitionOrBoolean } | undefined): Record<string, SchemaObject> | undefined {
  if (!definitions) {
    return undefined;
  }

  const schemas: Record<string, SchemaObject> = {};

  for (const key in definitions) {
    if (Object.prototype.hasOwnProperty.call(definitions, key)) {
      const definition = definitions[key];

      if (typeof definition === "boolean") {
        // If the definition is a boolean, we'll skip it or handle it as per your requirements
        console.warn(`Skipping boolean definition for key: ${key}`);
        continue;
      }

      // Assuming TJS.Definition is compatible with SchemaObject or can be converted
      schemas[key] = definition as SchemaObject;
    }
  }

  return schemas;
}
