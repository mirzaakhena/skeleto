import * as TJS from "typescript-json-schema";
import { camelToPascalWithSpace } from "./shared.js";
export function generateOpenAPIObject(useCases, securitySchemes) {
    //
    const settings = { required: true };
    const compilerOptions = { strictNullChecks: true };
    const openAPIObject = {
        openapi: "3.0.0",
        info: { title: "App", version: "1.0.0" },
        paths: {},
        components: {
            securitySchemes,
            schemas: {},
        },
    };
    const paths = useCases.map((funcMetadata) => funcMetadata.request?.path);
    const program = TJS.getProgramFromFiles(paths, compilerOptions);
    useCases.forEach((funcMetadata) => {
        //
        const requestField = TJS.generateSchema(program, funcMetadata.request?.name, settings);
        const responseField = TJS.generateSchema(program, funcMetadata.response?.name, settings);
        const data = funcMetadata.additionalDecorators.find((x) => x.name === "Controller")?.data;
        let path = data.path;
        const parameters = [];
        const bodyFields = [];
        funcMetadata.request?.structure.forEach((x) => {
            //
            x.decorators.forEach((y) => {
                //
                if (y.name !== "RequestPart")
                    return;
                if (y.data === "param") {
                    //
                    path = path.replace(`:${x.name}`, `{${x.name}}`);
                    let schema = requestField?.properties?.[x.name] ?? { type: x.type };
                    parameters.push({
                        in: "path",
                        name: x.name,
                        schema,
                        required: true,
                    });
                    return;
                }
                if (y.data === "query") {
                    let schema = requestField?.properties?.[x.name] ?? { type: x.type };
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
        let definitionSchema = {};
        let requestBodySchema = {};
        {
            const removedField = Object.keys(requestField?.properties).filter((x) => !bodyFields.some((y) => y === x));
            const updatedSchema = removeFieldsFromSchema(requestField, removedField);
            const { definitions, $schema, ...requestBodySchemaWithoutDefinitions } = updatedSchema;
            updateReferences(requestBodySchemaWithoutDefinitions);
            requestBodySchema = requestBodySchemaWithoutDefinitions;
            definitionSchema = definitions;
            if (Object.keys(requestBodySchema.properties).length === 0) {
                requestBodySchema = null;
            }
        }
        let responseSchema = {};
        {
            const { definitions, $schema, ...responseBodySchemaWithoutDefinitions } = responseField;
            updateReferences(responseBodySchemaWithoutDefinitions);
            responseSchema = responseBodySchemaWithoutDefinitions;
            definitionSchema = { ...definitionSchema, ...definitions };
        }
        openAPIObject.paths = {
            ...openAPIObject.paths,
            [path]: {
                ...openAPIObject.paths[path],
                [data.method]: {
                    tags: [data.tag],
                    security: data.security,
                    operationId: funcMetadata.name,
                    summary: camelToPascalWithSpace(funcMetadata.name),
                    parameters: parameters.length > 0 ? parameters : undefined,
                    requestBody: requestBodySchema === null || data.method === "get" || data.method === "delete" || data.method === "options" || data.method === "head"
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
function updateReferences(schema) {
    if (typeof schema !== "object" || schema === null) {
        return;
    }
    for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
            if (key === "$ref") {
                schema[key] = schema[key].replace("#/definitions/", "#/components/schemas/");
            }
            else {
                updateReferences(schema[key]);
            }
        }
    }
}
function removeFieldsFromSchema(schema, fieldsToRemove) {
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
function convertDefinitionsToSchemas(definitions) {
    if (!definitions) {
        return undefined;
    }
    const schemas = {};
    for (const key in definitions) {
        if (Object.prototype.hasOwnProperty.call(definitions, key)) {
            const definition = definitions[key];
            if (typeof definition === "boolean") {
                // If the definition is a boolean, we'll skip it or handle it as per your requirements
                console.warn(`Skipping boolean definition for key: ${key}`);
                continue;
            }
            // Assuming TJS.Definition is compatible with SchemaObject or can be converted
            schemas[key] = definition;
        }
    }
    return schemas;
}
//# sourceMappingURL=open_api.js.map