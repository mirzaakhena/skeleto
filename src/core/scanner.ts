// src/core/scanner.ts

import {
  ArrayTypeNode,
  FunctionDeclaration,
  IntersectionTypeNode,
  Node,
  Project,
  SourceFile,
  SyntaxKind,
  ts,
  TypeAliasDeclaration,
  TypeNode,
  TypeReferenceNode,
  UnionTypeNode,
} from "ts-morph";
import { DependencyResolver } from "./dependency_resolver.js";
import { Decorator, FuncInstanceMetadata, FuncMetadata, InjectableDecorator, SkeletoOptions, TypeField, TypeOf } from "./type.js";

type FuncDeclMetadata = { funcMetadata: FuncMetadata; funcDeclaration: FunctionDeclaration };

function getFunctionReturnTypeName(returnTypeNode: TypeNode<ts.TypeNode> | undefined) {
  return (returnTypeNode as TypeReferenceNode).getText();
}

function getDecoratorMetadata(jsDocs: string[], source?: string) {
  const decorators: any[] = [];

  const pushDecorator = (currentDecorator: { name: string; data?: string }) => {
    const data = currentDecorator.data?.trim();

    try {
      // If the data is a valid JSON string, parse it
      if (data?.startsWith("{")) {
        decorators.push({
          name: currentDecorator.name,
          data: JSON.parse(data),
        });
      } else {
        // If the data is plain text
        decorators.push({
          name: currentDecorator.name,
          data,
        });
      }
    } catch (e) {
      console.warn(`warning: in ${source} decorator ${currentDecorator.name} has invalid JSON`);
      decorators.push({ name: currentDecorator.name, data: currentDecorator.data });
    }
  };

  jsDocs.forEach((jsDoc) => {
    const innerText = jsDoc;
    const lines = innerText.split("\n");
    let currentDecorator: { name: string; data?: string } = { name: "", data: "" };
    let hasDecorator = false;

    lines.forEach((line) => {
      // A decorator must start the line, so "@" inside a sentence or an email address is ignored
      const match = line.match(/^\s*@(\w+)\s*(.*)?/);
      if (match) {
        if (hasDecorator) {
          pushDecorator(currentDecorator);
        }

        currentDecorator = { name: match[1], data: match[2] || "" };
        hasDecorator = true;
      } else if (hasDecorator) {
        currentDecorator.data += " " + line.trim();
      }
    });

    if (hasDecorator) {
      pushDecorator(currentDecorator);
    }
  });

  return decorators;
}

/**
 * Extracts functions from the project source files and gathers their metadata.
 * @param project - The project containing the source files.
 * @returns A map where the keys are function names and the values are objects containing function metadata and declarations.
 */
function extractFunctions(project: Project): Map<string, FuncDeclMetadata> {
  //

  const funcMap: Map<string, FuncDeclMetadata> = new Map();

  type InjectableDecoratorType = TypeOf<typeof InjectableDecorator>;

  const getFunctionParameters = (func: FunctionDeclaration) => {
    return func.getParameters().map((param) => {
      const typeNode = param.getTypeNode();
      if (!typeNode) {
        throw new Error(`Parameter ${param.getName()} of function ${func.getName()} in ${func.getSourceFile().getFilePath()} must have a type annotation.`);
      }
      return getFunctionReturnTypeName(typeNode);
    });
  };

  project.getSourceFiles().forEach((sourceFile) => {
    sourceFile.getFunctions().forEach((funcDeclaration) => {
      //

      if (!funcDeclaration.isExported()) return;

      const funcName = funcDeclaration.getName();
      if (!funcName) return;

      const returnTypeNode = funcDeclaration.getReturnTypeNode();
      if (!returnTypeNode) return;

      const functionReturnTypeName = getFunctionReturnTypeName(returnTypeNode);

      const decorators = getDecoratorMetadata(
        funcDeclaration.getJsDocs().map((x) => x.getInnerText()),
        `function ${funcName}`
      );
      if (!decorators.some((x) => InjectableDecorator.some((y) => y === x.name))) return;

      const existing = funcMap.get(functionReturnTypeName)?.funcDeclaration;
      if (existing) {
        throw new Error(
          `Type ${functionReturnTypeName} is returned by more than one function: ` +
            `${existing.getName()} in ${existing.getSourceFile().getFilePath()} and ${funcName} in ${sourceFile.getFilePath()}.`
        );
      }

      let mainDecorator = {};
      const additionalDecorators: Decorator[] = [];
      decorators.forEach(({ name, data }) => {
        if (InjectableDecorator.some((y) => name === y)) {
          mainDecorator = { name: name as InjectableDecoratorType, data };
        } else {
          additionalDecorators.push({ name, data });
        }
      });

      const dependencies = getFunctionParameters(funcDeclaration);

      const funcMetadata: FuncMetadata = {
        name: functionReturnTypeName,
        dependencies,
        mainDecorator: mainDecorator as Decorator<TypeOf<typeof InjectableDecorator>>,
        additionalDecorators,
      };

      printToLog(
        `  as ${badgeColorForKind(funcMetadata.mainDecorator.name).padEnd(19)} func ${funcMetadata.name.padEnd(50)} ${
          funcMetadata.dependencies.length > 0 ? `${funcMetadata.dependencies}` : "-"
        }`
      );

      funcMap.set(functionReturnTypeName, { funcDeclaration, funcMetadata });
    });
  });

  printToLog();

  return funcMap;
}

/**
 * Ensures every dependency is of a kind that is already instantiated, following the order Config, Wrapper, Action.
 * @param funcMap - A map of function names to their metadata and declarations.
 */
function validateDependencyKinds(funcMap: Map<string, FuncDeclMetadata>) {
  const allowedKinds: Record<TypeOf<typeof InjectableDecorator>, TypeOf<typeof InjectableDecorator>[]> = {
    Config: ["Config"],
    Wrapper: ["Config"],
    Action: ["Config", "Action"],
  };

  funcMap.forEach(({ funcMetadata }) => {
    const kind = funcMetadata.mainDecorator.name;
    funcMetadata.dependencies.forEach((dep) => {
      const depKind = funcMap.get(dep)?.funcMetadata.mainDecorator.name;
      if (depKind && !allowedKinds[kind].includes(depKind)) {
        throw new Error(`@${kind} ${funcMetadata.name} cannot depend on @${depKind} ${dep}. @${kind} can only depend on: ${allowedKinds[kind].map((x) => `@${x}`).join(", ")}.`);
      }
    });
  });
}

/**
 * Sorts functions by their kind using a dependency resolver.
 * @param funcMap - A map of function names to their metadata and declarations.
 * @returns An object containing arrays of functions sorted by their kinds: config, wrapper, and action handlers.
 */
function sortFunctionsByKind(funcMap: Map<string, FuncDeclMetadata>) {
  const configMetadatas: FuncMetadata[] = [];
  const wrapperMetadatas: FuncMetadata[] = [];
  const actionMetadatas: FuncMetadata[] = [];

  const nameAndDeps = Array.from(funcMap.values()).map((x) => ({ name: x.funcMetadata.name, dependencies: x.funcMetadata.dependencies }));
  const dr = new DependencyResolver(nameAndDeps);
  const orderedFunctions = dr.sortFunctions();

  validateDependencyKinds(funcMap);

  orderedFunctions.forEach((x) => {
    //

    printToLog(`  - ${x}`);

    const fm = funcMap.get(x)?.funcMetadata;

    if (fm?.mainDecorator.name === "Config") {
      configMetadatas.push(fm);
      return;
    }

    if (fm?.mainDecorator.name === "Wrapper") {
      wrapperMetadatas.push(fm);
      return;
    }

    if (fm?.mainDecorator.name === "Action") {
      actionMetadatas.push(fm);
      return;
    }
  });

  printToLog();

  return { configMetadatas, wrapperMetadatas, actionMetadatas };
}

function getDeclarationKind(sourceFile: SourceFile, structureName: string) {
  // Loop through the statements in the source file
  for (const node of sourceFile.getChildrenOfKind(SyntaxKind.SyntaxList)) {
    for (const child of node.getChildren()) {
      // Check if the node is a TypeAliasDeclaration, ClassDeclaration, or InterfaceDeclaration

      //
      if (Node.isTypeAliasDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getTypeAlias(structureName), kind: SyntaxKind.TypeAliasDeclaration, child };

        //
      } else if (Node.isClassDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getClass(structureName), kind: SyntaxKind.ClassDeclaration, child };

        //
      } else if (Node.isInterfaceDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getInterface(structureName), kind: SyntaxKind.InterfaceDeclaration, child };

        //
      } else if (Node.isEnumDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getEnum(structureName), kind: SyntaxKind.EnumDeclaration, child };

        //
      }
    }
  }

  // Return null if the structure is not found
  return null;
}

/**
 *
 * @param sourceFile
 * @param typeName
 * @returns
 */
function getTypeDeclarationSourceFile(sourceFile: SourceFile, typeName: string): SourceFile {
  const declKind = getDeclarationKind(sourceFile, typeName);
  if (declKind) {
    return sourceFile;
  }

  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    for (const namedImport of imp.getNamedImports()) {
      if (namedImport.getName() === typeName) {
        const importedSourceFile = imp.getModuleSpecifierSourceFile();
        if (importedSourceFile) {
          return getTypeDeclarationSourceFile(importedSourceFile, typeName);
        }
      }
    }
  }

  throw new Error(`Type ${typeName} not found at ${sourceFile.getFilePath()}`);
}

function collectTypeFields(ps: Node<ts.Node>) {
  let typeField: TypeField = { decorators: [], name: "", type: null };

  if (Node.isPropertySignature(ps)) {
    const name = ps.getName(); // name
    const type = ps.getType().getText(); // string
    const decorators = getDecoratorMetadata(
      ps.getJsDocs().map((x) => x.getInnerText()), // metadata of name: string
      `${name}`
    );
    typeField = { name, type, decorators };
  } else {
    // TODO what if it is not Property Signature ?
  }

  return typeField;
}

// Handle TypeReference arguments
function handleTypeReferenceArgument(typeArgument: TypeNode<ts.TypeNode>, index: number, aliasSourceFile: SourceFile, metadata: FuncMetadata) {
  //

  const payloadSourceFile = getTypeDeclarationSourceFile(aliasSourceFile, typeArgument.getText(true));
  printToLog("  payloadSourceFile    :", payloadSourceFile.getFilePath()); // /Users/username/Workspace/projectname/src/app/types.ts

  const aliasDecl = payloadSourceFile.getTypeAlias(typeArgument.getText()); // type Request = { name: string, age: number }

  const typeLiteral = aliasDecl?.getTypeNode()?.asKind(SyntaxKind.TypeLiteral); //{ name: string, age: number}

  const typeFields = typeLiteral?.getProperties().map((ps) => collectTypeFields(ps));

  const dk = getDeclarationKind(payloadSourceFile, typeArgument.getText(true));

  if (dk) {
    let typeDecorator: Decorator[] = [];
    if (dk.decl) {
      typeDecorator = getDecoratorMetadata(
        // metadata for Request
        dk.decl.getJsDocs().map((x) => x.getInnerText()),
        typeArgument.getText(true)
      );
      printToLog("  typeDecorator     :", JSON.stringify(typeDecorator));
    }

    metadata[index === 0 ? "request" : "response"] = {
      name: typeArgument.getText(), // Request
      path: payloadSourceFile.getFilePath(),
      structure: typeFields as TypeField[],
      decorators: typeDecorator,
    };
  }
}

// Handle Type arguments
function handleTypeArgument(typeArgument: TypeNode<ts.TypeNode>, index: number, aliasSourceFile: SourceFile, metadata: FuncMetadata) {
  //

  const kindName = typeArgument.getKindName();
  printToLog("  typeArgumentKind     :", kindName); // TypeReference

  switch (typeArgument.getKind()) {
    case SyntaxKind.TypeReference:
      handleTypeReferenceArgument(typeArgument, index, aliasSourceFile, metadata);
      break;

    case SyntaxKind.TypeLiteral:
      handleTypeLiteral(typeArgument, index, aliasSourceFile, metadata);
      break;

    case SyntaxKind.VoidKeyword:
    case SyntaxKind.StringKeyword:
    case SyntaxKind.NumberKeyword:
    case SyntaxKind.BooleanKeyword:
    case SyntaxKind.AnyKeyword:
    case SyntaxKind.UnknownKeyword:
    case SyntaxKind.NeverKeyword:
      handlePrimitiveType(typeArgument, index, metadata);
      break;

    case SyntaxKind.ArrayType:
      handleArrayType(typeArgument as ArrayTypeNode, index, aliasSourceFile, metadata);
      break;

    case SyntaxKind.UnionType:
    case SyntaxKind.IntersectionType:
      handleCompositeType(typeArgument as UnionTypeNode | IntersectionTypeNode, index, aliasSourceFile, metadata);
      break;

    default:
      console.warn(`Unhandled type argument kind: ${kindName}`);
      metadata[index === 0 ? "request" : "response"] = {
        name: `index-${index}`,
        path: aliasSourceFile.getFilePath(),
        // structure: `Unhandled type: ${kindName}`,
      };
  }
}

function handleTypeLiteral(typeArgument: TypeNode<ts.TypeNode>, index: number, aliasSourceFile: SourceFile, metadata: FuncMetadata) {
  const typeFields = typeArgument.forEachChildAsArray().map((ps) => collectTypeFields(ps));
  metadata[index === 0 ? "request" : "response"] = {
    name: `index-${index}`,
    path: aliasSourceFile.getFilePath(),
    structure: typeFields,
  };
}

function handlePrimitiveType(typeArgument: TypeNode<ts.TypeNode>, index: number, metadata: FuncMetadata) {
  metadata[index === 0 ? "request" : "response"] = {
    name: `index-${index}`,
    // type: typeArgument.getKindName(),
  };
}

function handleArrayType(typeArgument: ArrayTypeNode, index: number, aliasSourceFile: SourceFile, metadata: FuncMetadata) {
  const elementType = typeArgument.getElementTypeNode();
  metadata[index === 0 ? "request" : "response"] = {
    name: `index-${index}`,
    // type: "Array",
    // elementType: elementType ? elementType.getKindName() : "Unknown",
  };
}

function handleCompositeType(typeArgument: UnionTypeNode | IntersectionTypeNode, index: number, aliasSourceFile: SourceFile, metadata: FuncMetadata) {
  const types = typeArgument.getTypeNodes().map((t) => t.getKindName());
  metadata[index === 0 ? "request" : "response"] = {
    name: `index-${index}`,
    // type: typeArgument.getKindName(),
    // types: types,
  };
}

// Extract metadata for use cases
async function extractTypeArguments(funcDecl: FunctionDeclaration, metadata: FuncMetadata) {
  const aliasSourceFile = getTypeDeclarationSourceFile(funcDecl.getSourceFile(), metadata.name);
  printToLog("  aliasSourceFile      :", aliasSourceFile.getFilePath()); // /Users/username/Workspace/projectname/src/app/types.ts

  const aliasDecl = aliasSourceFile.getTypeAlias(metadata.name);
  if (!aliasDecl) return;
  printToLog("  aliasDecl            :", aliasDecl?.getText()); // export type RegisterUniquePerson = ActionHandler<Request, Response>;

  const returnTypeDecorators = getDecoratorMetadata(
    aliasDecl.getJsDocs().map((x) => x.getInnerText()),
    `'${aliasDecl?.getText()}'`
  );
  printToLog("  returnTypeDecorators :", JSON.stringify(returnTypeDecorators));

  const typeNode = aliasDecl.getTypeNode();
  if (!typeNode) return;
  printToLog("  typeNode             :", typeNode.getText()); // ActionHandler<Request, Response>

  metadata.returnTypeDecorator = returnTypeDecorators;

  const typeReferenceNode = typeNode.asKindOrThrow(ts.SyntaxKind.TypeReference);
  printToLog("  typeReferenceNode    :", typeReferenceNode.getText()); // ActionHandler<Request, Response>

  const typeArguments = typeReferenceNode.getTypeArguments();

  // handle each Request in index-0 and Response in index-1
  typeArguments.forEach((typeArgument, index) => {
    handleTypeArgument(typeArgument, index, aliasSourceFile, metadata);
  });
}

// prettier-ignore
const standardJsDocTags = new Set([
  "abstract", "author", "deprecated", "example", "exception", "inheritDoc", "internal", "license", "link", "override", "param",
  "private", "protected", "public", "readonly", "remarks", "return", "returns", "see", "since", "template", "throws", "todo", "type", "typedef", "version",
]);

/**
 * Ensures every decorator follows the rules registered at startup. All problems are reported at once.
 * @param metadatas - The metadata of all scanned functions, with their type arguments already extracted.
 * @param options - The registered custom decorators.
 */
function validateDecorators(metadatas: FuncMetadata[], options: SkeletoOptions) {
  const decoratorRules = options.decorators ?? {};
  const fieldRules = options.fieldDecorators ?? {};

  const problems: string[] = [];

  const isMainDecorator = (name: string) => InjectableDecorator.some((x) => x === name);
  const hasInvalidJson = (decorator: Decorator) => typeof decorator.data === "string" && decorator.data.startsWith("{");
  const getOwners = (name: string) => Object.keys(decoratorRules).filter((owner) => decoratorRules[owner].fields?.[name]);

  metadatas.forEach((metadata) => {
    const hasTypeArguments = metadata.mainDecorator.data?.["readTypeArguments"] === true;
    const functionDecorators = [...metadata.additionalDecorators, ...(metadata.returnTypeDecorator ?? [])];

    const checkDecorator = (decorator: Decorator) => {
      const label = `${metadata.name}: decorator @${decorator.name}`;

      if (hasInvalidJson(decorator)) {
        problems.push(`${label} has invalid JSON`);
        return;
      }

      if (isMainDecorator(decorator.name) || standardJsDocTags.has(decorator.name)) return;

      const rule = decoratorRules[decorator.name];
      if (!rule) {
        const isFieldDecorator = fieldRules[decorator.name] || getOwners(decorator.name).length > 0;
        problems.push(`${label} ${isFieldDecorator ? "can only be used on a field" : "is not registered"}`);
        return;
      }

      if (rule.requiresTypeArguments && !hasTypeArguments) {
        problems.push(`${label} requires @Action {"readTypeArguments": true}`);
        return;
      }

      const message = rule.validate?.(decorator.data, metadata);
      if (message) problems.push(`${label} ${message}`);
    };

    const checkFieldDecorator = (field: TypeField, decorator: Decorator) => {
      const label = `${metadata.name}: field ${field.name}: decorator @${decorator.name}`;

      if (hasInvalidJson(decorator)) {
        problems.push(`${label} has invalid JSON`);
        return;
      }

      if (standardJsDocTags.has(decorator.name)) return;

      const owners = getOwners(decorator.name);
      const owner = owners.find((x) => functionDecorators.some((y) => y.name === x));
      const rule = owner ? decoratorRules[owner].fields?.[decorator.name] : fieldRules[decorator.name];

      if (!rule) {
        if (owners.length > 0) {
          problems.push(`${label} requires ${owners.map((x) => `@${x}`).join(" or ")} on the function`);
        } else if (decoratorRules[decorator.name] || isMainDecorator(decorator.name)) {
          problems.push(`${label} cannot be used on a field`);
        } else {
          problems.push(`${label} is not registered`);
        }
        return;
      }

      const message = rule.validate?.(decorator.data, metadata);
      if (message) problems.push(`${label} ${message}`);
    };

    [metadata.mainDecorator, ...functionDecorators].forEach(checkDecorator);

    [metadata.request, metadata.response].forEach((payload) => {
      payload?.decorators?.forEach(checkDecorator);
      payload?.structure?.forEach((field) => field.decorators.forEach((decorator) => checkFieldDecorator(field, decorator)));
    });
  });

  if (problems.length > 0) {
    throw new Error(`Invalid decorator usage:\n  - ${problems.join("\n  - ")}`);
  }
}

// Apply wrappers
function applyWrappers(currentResult: any, metadata: FuncMetadata, wrapperMetadatas: FuncMetadata[], funcResultMap: Map<string, FuncInstanceMetadata>) {
  const sortBasedOrdinal = wrapperMetadatas.sort((a, b) => ((a.mainDecorator.data.ordinal ?? 0) as number) - ((b.mainDecorator.data.ordinal ?? 0) as number));
  for (const wrapperMetadata of sortBasedOrdinal) {
    const wrapperHandler = funcResultMap.get(wrapperMetadata.name)?.getInstance();
    currentResult = wrapperHandler(currentResult, metadata);
  }
  return currentResult;
}

function getParameterHandler(funcDecl: FunctionDeclaration, funcResultMap: Map<string, FuncInstanceMetadata>) {
  return funcDecl.getParameters().map((param) => {
    const paramTypeName = getFunctionReturnTypeName(param.getTypeNode());

    const paramHandler = funcResultMap.get(paramTypeName);
    if (!paramHandler) {
      throw new Error(`Function ${funcDecl.getName()} depends on ${paramTypeName} which is not instantiated yet.`);
    }

    return paramHandler.getInstance();
  });
}

// Resolve functions
async function resolveFunctions(
  metadatas: FuncMetadata[],
  funcMap: Map<string, FuncDeclMetadata>,
  funcResultMap: Map<string, FuncInstanceMetadata>,
  wrapperMetadatas?: FuncMetadata[]
) {
  for (const funcMetadata of metadatas) {
    const funcDecl = funcMap.get(funcMetadata.name)?.funcDeclaration as FunctionDeclaration;

    printToLog("  funcDecl             :", funcDecl.getName());

    const module = await import(funcDecl.getSourceFile().getFilePath());

    const funcName = funcDecl.getName() as string;

    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    let funcInstance = module[funcName](...paramHandlers);

    if (wrapperMetadatas) {
      funcInstance = applyWrappers(funcInstance, funcMetadata, wrapperMetadatas, funcResultMap);
    }

    funcResultMap.set(funcMetadata.name, new FuncInstanceMetadata(funcInstance, funcMetadata));
  }
  printToLog();
}

/**
 * Scans the project for functions, sorts them by kind, resolves their dependencies and wrappers, and returns the results.
 * @param project - The project containing the source files.
 * @param options - The startup options.
 * @returns A map of function names to their resolved instances and metadata.
 */
export async function scanFunctions(project: Project, options?: SkeletoOptions) {
  //

  printToLog("scanned function:");
  const funcMap = extractFunctions(project);

  printToLog("sort by dependencies");
  const { configMetadatas, wrapperMetadatas, actionMetadatas } = sortFunctionsByKind(funcMap);

  // read the metadata before any function runs, so an invalid usage stops the startup without side effects
  for (const funcMetadata of actionMetadatas) {
    if (funcMetadata.mainDecorator.data?.["readTypeArguments"]) {
      await extractTypeArguments(funcMap.get(funcMetadata.name)?.funcDeclaration as FunctionDeclaration, funcMetadata);
    }
  }

  if (options?.decorators || options?.fieldDecorators) {
    validateDecorators([...configMetadatas, ...wrapperMetadatas, ...actionMetadatas], options);
  }

  const funcResultMap: Map<string, FuncInstanceMetadata> = new Map();

  printToLog("resolve config");
  await resolveFunctions(configMetadatas, funcMap, funcResultMap);

  printToLog("resolve wrapper");
  await resolveFunctions(wrapperMetadatas, funcMap, funcResultMap);

  printToLog("resolve action");
  await resolveFunctions(actionMetadatas, funcMap, funcResultMap, wrapperMetadatas);

  return funcResultMap;
}

function printToLog(message?: any, ...optionalParams: any[]) {
  // if (!message) {
  //   console.log();
  //   return;
  // }
  // console.log(message, ...optionalParams);
}

const badgeColorForKind = (kind: TypeOf<typeof InjectableDecorator>) => {
  if (kind === "Config") return `${fgGreen}${kind}${reset}`;
  if (kind === "Wrapper") return `${fgBlue}${kind}${reset}`;
  if (kind === "Action") return `${fgRed}${kind}${reset}`;
  return `${kind}`;
};

// const bright = "\x1b[1m";
// const dim = "\x1b[2m";
// const underscore = "\x1b[4m";
// const blink = "\x1b[5m";
// const reverse = "\x1b[7m";
// const hidden = "\x1b[8m";
const reset = "\x1b[0m";
const fgRed = "\x1b[31m";
const fgGreen = "\x1b[32m";
const fgYellow = "\x1b[33m";
const fgBlue = "\x1b[34m";
// const fgMagenta = "\x1b[35m";
// const fgBlack = "\x1b[30m";
// const fgCyan = "\x1b[36m";
// const fgWhite = "\x1b[37m";

// const bgBlack = "\x1b[40m";
// const bgRed = "\x1b[41m";
// const bgGreen = "\x1b[42m";
// const bgYellow = "\x1b[43m";
// const bgBlue = "\x1b[44m";
// const bgMagenta = "\x1b[45m";
// const bgCyan = "\x1b[46m";
// const bgWhite = "\x1b[47m";
