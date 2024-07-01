import { FunctionDeclaration, JSDoc, Node, Project, SourceFile, SyntaxKind, ts, TypeAliasDeclaration, TypeNode, TypeReferenceNode } from "ts-morph";
import { DependencyResolver } from "./dependency_resolver.js";
import { Decorator, FuncInstanceMetadata, FuncMetadata, InjectableDecorator, TypeField, TypeOf } from "./type.js";

type FuncDeclMetadata = { funcMetadata: FuncMetadata; funcDeclaration: FunctionDeclaration };

type InjectableDecoratorType = TypeOf<typeof InjectableDecorator>;

function getFunctionReturnTypeName(returnTypeNode: TypeNode<ts.TypeNode> | undefined) {
  return (returnTypeNode as TypeReferenceNode).getText();
}

function getFunctionParameters(func: FunctionDeclaration) {
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

const reset = "\x1b[0m";
const bright = "\x1b[1m";
const dim = "\x1b[2m";
const underscore = "\x1b[4m";
const blink = "\x1b[5m";
const reverse = "\x1b[7m";
const hidden = "\x1b[8m";

const fgBlack = "\x1b[30m";
const fgRed = "\x1b[31m";
const fgGreen = "\x1b[32m";
const fgYellow = "\x1b[33m";
const fgBlue = "\x1b[34m";
const fgMagenta = "\x1b[35m";
const fgCyan = "\x1b[36m";
const fgWhite = "\x1b[37m";

const bgBlack = "\x1b[40m";
const bgRed = "\x1b[41m";
const bgGreen = "\x1b[42m";
const bgYellow = "\x1b[43m";
const bgBlue = "\x1b[44m";
const bgMagenta = "\x1b[45m";
const bgCyan = "\x1b[46m";
const bgWhite = "\x1b[47m";

/**
 * Extracts functions from the project source files and gathers their metadata.
 * @param project - The project containing the source files.
 * @returns A map where the keys are function names and the values are objects containing function metadata and declarations.
 */
function extractFunctions(project: Project): Map<string, FuncDeclMetadata> {
  const funcMap: Map<string, FuncDeclMetadata> = new Map();

  const badgeColorForKind = (kind: TypeOf<typeof InjectableDecorator>) => {
    if (kind === "Config") {
      return `${fgMagenta}${kind}${reset}`; //
    }

    if (kind === "Middleware") {
      return `${fgBlue}${kind}${reset}`; //
    }

    if (kind === "Gateway") {
      return `${fgGreen}${kind}${reset}`; //
    }

    if (kind === "UseCase") {
      return `${fgRed}${kind}${reset}`; //
    }

    return `${kind}`;
  };

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

      const dependencies = getFunctionParameters(func);

      const kind = decorators.find((d) => InjectableDecorator.find((y) => y === d.name))!.name as InjectableDecoratorType;

      const meta = {
        name: functionReturnTypeName,
        dependencies,
        kind,
        decorators,
      };

      printToLog(
        `  as ${badgeColorForKind(meta.kind).padEnd(16)} func ${meta.name.padEnd(50)} ${meta.dependencies.length > 0 ? `depend on : ${meta.dependencies}` : "no dependency"}`
      );

      funcMap.set(functionReturnTypeName, { funcDeclaration: func, funcMetadata: meta });
    });
  });

  printToLog();

  return funcMap;
}

/**
 * Sorts functions by their kind using a dependency resolver.
 * @param funcMap - A map of function names to their metadata and declarations.
 * @returns An object containing arrays of functions sorted by their kinds: config, middleware, and action handlers.
 */
function sortFunctionsByKind(funcMap: Map<string, FuncDeclMetadata>) {
  const configMetadatas: FuncMetadata[] = [];
  const middlewareMetadatas: FuncMetadata[] = [];
  // const actionMetadatas: FuncMetadata[] = [];

  const gatewayMetadatas: FuncMetadata[] = [];
  const useCaseMetadatas: FuncMetadata[] = [];

  const nameAndDeps = Array.from(funcMap.values()).map((x) => ({ name: x.funcMetadata.name, dependencies: x.funcMetadata.dependencies }));
  const dr = new DependencyResolver(nameAndDeps);
  const orderedFunctions = dr.sortFunctions();

  orderedFunctions.forEach((x) => {
    //

    printToLog(`  - ${x}`);

    const fm = funcMap.get(x)?.funcMetadata;

    if (fm?.kind === "Config") {
      configMetadatas.push(fm);
      return;
    }

    if (fm?.kind === "Middleware") {
      middlewareMetadatas.push(fm);
      return;
    }

    if (fm?.kind === "Gateway") {
      gatewayMetadatas.push(fm);
      return;
    }

    if (fm?.kind === "UseCase") {
      useCaseMetadatas.push(fm);
      return;
    }
  });

  printToLog();

  return { configMetadatas, middlewareMetadatas, gatewayMetadatas, useCaseMetadatas };
}

/**
 * Resolves and instantiates configuration functions.
 * @param metadatas - Array of configuration function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolveConfigFunctions(metadatas: FuncMetadata[], funcMap: Map<string, FuncDeclMetadata>, funcResultMap: Map<string, FuncInstanceMetadata>) {
  for (const metadata of metadatas.map((x) => x.name)) {
    const funcDecl = funcMap.get(metadata)?.funcDeclaration as FunctionDeclaration;

    printToLog("  funcDecl          :", funcDecl.getName());

    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;

    const funcResult = module[funcName]();

    funcResultMap.set(metadata, {
      funcInstance: funcResult,
      funcMetadata: funcMap.get(metadata)?.funcMetadata as FuncMetadata,
    });
  }

  printToLog();
}

/**
 * Resolves and instantiates middleware functions with their dependencies.
 * @param metadatas - Array of middleware function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolveMiddlewareFunctions(metadatas: FuncMetadata[], funcMap: Map<string, FuncDeclMetadata>, funcResultMap: Map<string, FuncInstanceMetadata>) {
  for (const metadata of metadatas.map((x) => x.name)) {
    const funcDecl = funcMap.get(metadata)?.funcDeclaration as FunctionDeclaration;

    printToLog("  funcDecl          :", funcDecl.getName());

    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;

    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    const funcResult = module[funcName](...paramHandlers);

    funcResultMap.set(metadata, {
      funcInstance: funcResult,
      funcMetadata: funcMap.get(metadata)?.funcMetadata as FuncMetadata,
    });
  }
  printToLog();
}

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

  // const typeDecl = sourceFile.getTypeAlias(typeName) || sourceFile.getClass(typeName) || sourceFile.getInterface(typeName);
  // if (typeDecl) return sourceFile;

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

/**
 * Resolves and instantiates gateway handler functions, including their dependencies and middlewares.
 * @param metadatas - Array of action handler function metadata.
 * @param middlewareMetadatas - Array of middleware function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolveGatewayFunctions(
  metadatas: FuncMetadata[],
  middlewareMetadatas: FuncMetadata[],
  funcMap: Map<string, FuncDeclMetadata>,
  funcResultMap: Map<string, FuncInstanceMetadata>
) {
  for (const metadata of metadatas) {
    const funcDecl = funcMap.get(metadata.name)?.funcDeclaration as FunctionDeclaration;
    printToLog("  funcDecl          :", funcDecl.getName());

    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;
    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    let currentResult = module[funcName](...paramHandlers);

    for (const middlewareMetadata of middlewareMetadatas) {
      const middlewareHandler = funcResultMap.get(middlewareMetadata.name)?.funcInstance;
      currentResult = middlewareHandler(currentResult, metadata);
    }

    funcResultMap.set(metadata.name, { funcInstance: currentResult, funcMetadata: metadata });
  }
  printToLog();
}

/**
 * Resolves and instantiates action handler functions, including their dependencies and middlewares.
 * @param metadatas - Array of action handler function metadata.
 * @param middlewareMetadatas - Array of middleware function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolveUseCaseFunctions(
  metadatas: FuncMetadata[],
  middlewareMetadatas: FuncMetadata[],
  funcMap: Map<string, FuncDeclMetadata>,
  funcResultMap: Map<string, FuncInstanceMetadata>
) {
  for (const metadata of metadatas) {
    const funcDecl = funcMap.get(metadata.name)?.funcDeclaration as FunctionDeclaration;
    printToLog("  funcDecl          :", funcDecl.getName());

    const aliasSourceFile = getTypeDeclarationSourceFile(funcDecl.getSourceFile(), metadata.name);
    printToLog("  aliasSourceFile   :", aliasSourceFile.getFilePath());

    const aliasDecl = aliasSourceFile.getTypeAlias(metadata.name);
    if (!aliasDecl) continue;
    printToLog("  aliasDecl         :", aliasDecl?.getText());

    const typeNode = aliasDecl.getTypeNode();
    if (!typeNode) continue;
    printToLog("  typeNode          :", typeNode.getText());

    const typeReferenceNode = typeNode.asKindOrThrow(ts.SyntaxKind.TypeReference);
    printToLog("  typeReferenceNode :", typeReferenceNode.getText());

    const typeArguments = typeReferenceNode.getTypeArguments();

    typeArguments.forEach((typeArgument, index) => {
      printToLog("  typeArgumentKind  :", typeArgument.getKindName());

      if (typeArgument.getKind() === SyntaxKind.TypeReference) {
        printToLog("  typeArgumentText  :", typeArgument.getText(true));

        const payloadSourceFile = getTypeDeclarationSourceFile(aliasSourceFile, typeArgument.getText(true));
        printToLog("  payloadSourceFile :", payloadSourceFile.getFilePath());

        const dk = getDeclarationKind(payloadSourceFile, typeArgument.getText(true));

        if (dk) {
          const properties = dk.decl?.getType().getProperties()!;

          const typeFields = properties.map((prop) => {
            const name = prop.getName();
            const type = prop.getTypeAtLocation(aliasDecl).getText();

            const decorator = prop.getJsDocTags().map((doc) => {
              const texts = doc.getText();

              const text = texts.length > 0 ? texts[0].text : "";

              try {
                const jsonText = JSON.parse(text);
                return { name: doc.getName(), data: jsonText };
              } catch {
                return { name: doc.getName(), data: text };
              }
            });

            return { name, type, decorator } as TypeField;
          });

          metadata[index === 0 ? "request" : "response"] = {
            name: dk.decl?.getName() as string,
            path: payloadSourceFile.getFilePath(),
            structure: typeFields,
          };
        }
      } else if (typeArgument.getKind() === SyntaxKind.TypeLiteral) {
        // Handle TypeLiteral case
      } else {
        // throw new Error("the type should be Reference or Literal");
      }
    });

    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;
    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    let currentResult = module[funcName](...paramHandlers);

    for (const middlewareMetadata of middlewareMetadatas) {
      const middlewareHandler = funcResultMap.get(middlewareMetadata.name)?.funcInstance;
      currentResult = middlewareHandler(currentResult, metadata);
    }

    funcResultMap.set(metadata.name, { funcInstance: currentResult, funcMetadata: metadata });
    printToLog();
  }
  printToLog();
}

/**
 * Scans the project for functions, sorts them by kind, resolves their dependencies and middlewares, and returns the results.
 * @param project - The project containing the source files.
 * @returns A map of function names to their resolved instances and metadata.
 */
export async function scanFunctions(project: Project) {
  //

  printToLog("scanned function:");
  const funcMap = extractFunctions(project);

  printToLog("sort by dependencies");
  const { configMetadatas, middlewareMetadatas, gatewayMetadatas, useCaseMetadatas } = sortFunctionsByKind(funcMap);

  const funcResultMap: Map<string, FuncInstanceMetadata> = new Map();

  printToLog("resolve config");
  await resolveConfigFunctions(configMetadatas, funcMap, funcResultMap);

  printToLog("resolve middleware");
  await resolveMiddlewareFunctions(middlewareMetadatas, funcMap, funcResultMap);

  printToLog("resolve gateway");
  await resolveGatewayFunctions(gatewayMetadatas, middlewareMetadatas, funcMap, funcResultMap);

  printToLog("resolve useCase");
  await resolveUseCaseFunctions(useCaseMetadatas, middlewareMetadatas, funcMap, funcResultMap);

  return funcResultMap;
}

function printToLog(message?: any, ...optionalParams: any[]) {
  if (!message) {
    console.log();
    return;
  }
  console.log(message, ...optionalParams);
}
