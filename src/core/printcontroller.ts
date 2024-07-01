import { camelToPascalWithSpace, Methods } from "./helper.js";
import { FuncInstanceMetadata } from "./type.js";

export function printController(useCases: FuncInstanceMetadata[]) {
  let maxLengthRoute = 0;
  let maxLengthUseCase = 0;
  let maxLengthTag = 0;

  useCases.forEach(({ funcMetadata }) => {
    //

    const data = funcMetadata.decorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };

    if (maxLengthRoute < data.path.toString().length) {
      maxLengthRoute = data.path.toString().length;
    }

    const useCase = camelToPascalWithSpace(funcMetadata.name);
    if (maxLengthUseCase < useCase.length) {
      maxLengthUseCase = useCase.length;
    }

    if (maxLengthTag < data.tag.length) {
      maxLengthTag = data.tag.length;
    }
  });

  let tag = "";

  return useCases.map(({ funcMetadata }) => {
    //

    const data = funcMetadata.decorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };

    let groupLabel = data.tag;

    if (tag !== data.tag) {
      tag = data.tag;
    } else {
      groupLabel = "";
    }

    return {
      //
      tag: groupLabel.toUpperCase().padEnd(maxLengthTag),
      useCase: camelToPascalWithSpace(funcMetadata.name).padEnd(maxLengthUseCase).substring(0),
      method: data.method.padStart(6).toUpperCase(),
      path: data.path.toString().padEnd(maxLengthRoute).substring(0),
    };
  });
}
