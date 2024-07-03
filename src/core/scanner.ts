import { FunctionDeclaration, JSDoc, Node, Project, SourceFile, SyntaxKind, ts, TypeNode, TypeReferenceNode } from "ts-morph";
import { DependencyResolver } from "./dependency_resolver.js";
import { Decorator, FuncInstanceMetadata, FuncMetadata, InjectableDecorator, TypeField, TypeOf } from "./type.js";

type FuncDeclMetadata = { funcMetadata: FuncMetadata; funcDeclaration: FunctionDeclaration };

type InjectableDecoratorType = TypeOf<typeof InjectableDecorator>;

export function getFunctionReturnTypeName(returnTypeNode: TypeNode<ts.TypeNode> | undefined) {
  return (returnTypeNode as TypeReferenceNode).getText();
}

export function getFunctionParameters(func: FunctionDeclaration) {
  return func.getParameters().map((param) => getFunctionReturnTypeName(param.getTypeNode()));
}

function getParameterHandler(funcDecl: FunctionDeclaration, funcResultMap: Map<string, FuncInstanceMetadata>) {
  const paramHandlers: any[] = [];

  funcDecl.getParameters().forEach((param) => {
    const paramTypeName = getFunctionReturnTypeName(param.getTypeNode());

    if (funcResultMap.has(paramTypeName)) {
      paramHandlers.push(funcResultMap.get(paramTypeName)?.funcInstance);
    }
  });

  return paramHandlers;
}

/**
 *
 * @param jsDocs
 * @returns
 */
function getDecoratorMetadata(jsDocs: JSDoc[]) {
  const decorators: Decorator[] = [];

  jsDocs.forEach((jsDoc) => {
    const innerText = jsDoc.getInnerText();
    const lines = innerText.split("\n");
    let currentDecorator: { name: string; data?: string } = { name: "", data: "" };
    let hasDecorator = false;

    lines.forEach((line) => {
      const match = line.match(/@(\w+)\s*(\{.*)?/);
      if (match) {
        if (hasDecorator) {
          try {
            decorators.push({ name: currentDecorator.name, data: currentDecorator.data ? JSON.parse(currentDecorator.data) : undefined });
          } catch (e) {
            decorators.push({ name: currentDecorator.name, data: undefined });
          }
        }
        currentDecorator = { name: match[1], data: match[2] || "" };
        hasDecorator = true;
      } else if (hasDecorator) {
        currentDecorator.data += line.trim();
      }
    });

    if (hasDecorator) {
      try {
        decorators.push({ name: currentDecorator.name, data: currentDecorator.data ? JSON.parse(currentDecorator.data) : undefined });
      } catch (e) {
        decorators.push({ name: currentDecorator.name, data: undefined });
      }
    }
  });

  return decorators;
}

// const bright = "\x1b[1m";
// const dim = "\x1b[2m";
// const underscore = "\x1b[4m";
// const blink = "\x1b[5m";
// const reverse = "\x1b[7m";
// const hidden = "\x1b[8m";
const reset = "\x1b[0m";

const fgRed = "\x1b[31m";
const fgGreen = "\x1b[32m";
const fgBlue = "\x1b[34m";
// const fgMagenta = "\x1b[35m";
// const fgBlack = "\x1b[30m";
// const fgYellow = "\x1b[33m";
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

/**
 * Extracts functions from the project source files and gathers their metadata.
 * @param project - The project containing the source files.
 * @returns A map where the keys are function names and the values are objects containing function metadata and declarations.
 */
function extractFunctions(project: Project): Map<string, FuncDeclMetadata> {
  const funcMap: Map<string, FuncDeclMetadata> = new Map();

  project.getSourceFiles().forEach((sourceFile) => {
    sourceFile.getFunctions().forEach((func) => {
      if (!func.isExported()) return;

      const funcName = func.getName();

      if (!funcName) return;

      const returnTypeNode = func.getReturnTypeNode();
      if (!returnTypeNode) return;

      const functionReturnTypeName = getFunctionReturnTypeName(returnTypeNode);
      if (funcMap.has(functionReturnTypeName)) return;

      const decorators = getDecoratorMetadata(func.getJsDocs());
      if (!decorators.some((x) => InjectableDecorator.some((y) => y === x.name))) return;

      let mainDecorator = {};
      const additionalDecorators: Decorator[] = [];
      decorators.forEach(({ name, data }) => {
        if (InjectableDecorator.some((y) => name === y)) {
          mainDecorator = { name: name as InjectableDecoratorType, data };
        } else {
          additionalDecorators.push({ name, data });
        }
      });

      const dependencies = getFunctionParameters(func);

      const meta: FuncMetadata = {
        name: functionReturnTypeName,
        dependencies,
        mainDecorator: mainDecorator as { name: TypeOf<typeof InjectableDecorator>; data: any },
        additionalDecorators,
      };

      printToLog(`  as ${badgeColorForKind(meta.mainDecorator.name).padEnd(19)} func ${meta.name.padEnd(50)} ${meta.dependencies.length > 0 ? `${meta.dependencies}` : "-"}`);

      funcMap.set(functionReturnTypeName, { funcDeclaration: func, funcMetadata: meta });
    });
  });

  printToLog();

  return funcMap;
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

/**
 * Resolves and instantiates config and wrapper functions with their dependencies.
 * @param metadatas - Array of wrapper function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolveConfigAndWrapperFunctions(metadatas: FuncMetadata[], funcMap: Map<string, FuncDeclMetadata>, funcResultMap: Map<string, FuncInstanceMetadata>) {
  for (const metadata of metadatas) {
    const funcDecl = funcMap.get(metadata.name)?.funcDeclaration as FunctionDeclaration;

    printToLog("  funcDecl          :", funcDecl.getName());

    const module = await import(funcDecl.getSourceFile().getFilePath());

    const funcName = funcDecl.getName() as string;

    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    const funcResult = module[funcName](...paramHandlers);

    funcResultMap.set(metadata.name, { funcInstance: funcResult, funcMetadata: metadata });
  }
  printToLog();
}

// Resolve functions (gateway or use case)
const resolveActionFunctions = async (
  metadatas: FuncMetadata[],
  wrapperMetadatas: FuncMetadata[],
  funcMap: Map<string, FuncDeclMetadata>,
  funcResultMap: Map<string, FuncInstanceMetadata>
) => {
  for (const metadata of metadatas) {
    const funcDecl = funcMap.get(metadata.name)?.funcDeclaration as FunctionDeclaration;
    printToLog("  funcDecl          :", funcDecl.getName());

    if (metadata.mainDecorator.data?.["readTypeArguments"]) {
      await extractUseCaseMetadata(funcDecl, metadata);
    }

    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;

    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    let currentResult = module[funcName](...paramHandlers);
    currentResult = applyWrappers(currentResult, metadata, wrapperMetadatas, funcResultMap);

    funcResultMap.set(metadata.name, { funcInstance: currentResult, funcMetadata: metadata });
  }
  printToLog();
};

function getDeclarationKind(sourceFile: SourceFile, structureName: string) {
  // Loop through the statements in the source file
  for (const node of sourceFile.getChildrenOfKind(SyntaxKind.SyntaxList)) {
    for (const child of node.getChildren()) {
      // Check if the node is a TypeAliasDeclaration, ClassDeclaration, or InterfaceDeclaration

      //
      if (Node.isTypeAliasDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getTypeAlias(structureName), kind: SyntaxKind.TypeAliasDeclaration };

        //
      } else if (Node.isClassDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getClass(structureName), kind: SyntaxKind.ClassDeclaration };

        //
      } else if (Node.isInterfaceDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getInterface(structureName), kind: SyntaxKind.InterfaceDeclaration };

        //
      } else if (Node.isEnumDeclaration(child) && child.getName() === structureName) {
        return { decl: sourceFile.getEnum(structureName), kind: SyntaxKind.EnumDeclaration };

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

// Apply wrappers
const applyWrappers = (currentResult: any, metadata: FuncMetadata, wrapperMetadatas: FuncMetadata[], funcResultMap: Map<string, FuncInstanceMetadata>) => {
  const sortBasedOrdinal = wrapperMetadatas.sort((a, b) => ((a.mainDecorator.data.ordinal ?? 0) as number) - ((b.mainDecorator.data.ordinal ?? 0) as number));
  for (const wrapperMetadata of sortBasedOrdinal) {
    const wrapperHandler = funcResultMap.get(wrapperMetadata.name)?.funcInstance;
    currentResult = wrapperHandler(currentResult, metadata);
  }
  return currentResult;
};

// Extract metadata for use cases
const extractUseCaseMetadata = async (funcDecl: FunctionDeclaration, metadata: FuncMetadata) => {
  const aliasSourceFile = getTypeDeclarationSourceFile(funcDecl.getSourceFile(), metadata.name);
  printToLog("  aliasSourceFile   :", aliasSourceFile.getFilePath()); // /Users/mirza/Workspace/skeleto-demo001/src/app/types.ts

  const aliasDecl = aliasSourceFile.getTypeAlias(metadata.name);
  if (!aliasDecl) return;
  printToLog("  aliasDecl         :", aliasDecl?.getText()); // export type RegisterUniquePerson = UseCaseHandler<Request, Response>;

  const typeNode = aliasDecl.getTypeNode();
  if (!typeNode) return;
  printToLog("  typeNode          :", typeNode.getText()); // UseCaseHandler<Request, Response>

  const typeReferenceNode = typeNode.asKindOrThrow(ts.SyntaxKind.TypeReference);
  printToLog("  typeReferenceNode :", typeReferenceNode.getText()); // UseCaseHandler<Request, Response>

  const typeArguments = typeReferenceNode.getTypeArguments();
  typeArguments.forEach((typeArgument, index) => {
    handleTypeArgument(typeArgument, index, aliasSourceFile, metadata, aliasDecl);
  });
};

// Handle Type arguments
const handleTypeArgument = (typeArgument: TypeNode<ts.TypeNode>, index: number, aliasSourceFile: SourceFile, metadata: FuncMetadata, aliasDecl: any) => {
  printToLog("  typeArgumentKind  :", typeArgument.getKindName()); // TypeReference

  if (typeArgument.getKind() === SyntaxKind.TypeReference) {
    handleTypeReferenceArgument(typeArgument, index, aliasSourceFile, metadata, aliasDecl);
  } else if (typeArgument.getKind() === SyntaxKind.TypeLiteral) {
    const typeFields: any[] = [];
    typeArgument.forEachChild((child) => {
      if (Node.isPropertySignature(child)) {
        const name = child.getName();
        const type = child.getType().getText();
        const decorator = getDecoratorMetadata(child.getJsDocs());
        typeFields.push({ name, type, decorator });
      }
    });
    metadata[index === 0 ? "request" : "response"] = { name: "", path: aliasSourceFile.getFilePath(), structure: typeFields };
  } else {
    throw new Error("the type should be Reference or Literal");
  }
};

// Handle TypeReference arguments
const handleTypeReferenceArgument = (typeArgument: TypeNode<ts.TypeNode>, index: number, aliasSourceFile: SourceFile, metadata: FuncMetadata, aliasDecl: any) => {
  printToLog("  typeArgumentText  :", typeArgument.getText(true)); // Request / Response

  const payloadSourceFile = getTypeDeclarationSourceFile(aliasSourceFile, typeArgument.getText(true));
  printToLog("  payloadSourceFile :", payloadSourceFile.getFilePath()); // /Users/mirza/Workspace/skeleto-demo001/src/app/types.ts

  const dk = getDeclarationKind(payloadSourceFile, typeArgument.getText(true));
  if (dk) {
    const properties = dk.decl?.getType().getProperties()!;
    const typeFields = properties.map((prop) => {
      const name = prop.getName();
      const type = prop.getTypeAtLocation(aliasDecl).getText();
      const decorator = prop.getJsDocTags().map((doc) => ({ name: doc.getName(), data: parseJsDocText(doc.getText()) }));
      return { name, type, decorators: decorator } as TypeField;
    });
    metadata[index === 0 ? "request" : "response"] = { name: dk.decl?.getName() as string, path: payloadSourceFile.getFilePath(), structure: typeFields };
  }
};

// Parse JsDoc text
const parseJsDocText = (texts: any[]) => {
  const text = texts.length > 0 ? texts[0].text : "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * Scans the project for functions, sorts them by kind, resolves their dependencies and wrappers, and returns the results.
 * @param project - The project containing the source files.
 * @returns A map of function names to their resolved instances and metadata.
 */
export async function scanFunctions(project: Project) {
  //

  printToLog("scanned function:");
  const funcMap = extractFunctions(project);

  printToLog("sort by dependencies");
  const { configMetadatas, wrapperMetadatas, actionMetadatas } = sortFunctionsByKind(funcMap);

  const funcResultMap: Map<string, FuncInstanceMetadata> = new Map();

  printToLog("resolve config");
  await resolveConfigAndWrapperFunctions(configMetadatas, funcMap, funcResultMap);

  printToLog("resolve wrapper");
  await resolveConfigAndWrapperFunctions(wrapperMetadatas, funcMap, funcResultMap);

  printToLog("resolve action");
  await resolveActionFunctions(actionMetadatas, wrapperMetadatas, funcMap, funcResultMap);

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
  if (kind === "Config") {
    return `${fgGreen}${kind}${reset}`; //
  }

  if (kind === "Wrapper") {
    return `${fgBlue}${kind}${reset}`; //
  }

  if (kind === "Action") {
    return `${fgRed}${kind}${reset}`; //
  }

  return `${kind}`;
};
