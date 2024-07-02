export function camelToPascalWithSpace(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCase
    .replace(/([a-zA-Z])+/g, (match) => match.charAt(0).toUpperCase() + match.slice(1)); // Convert to PascalCase
}

export type Methods = "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head";
