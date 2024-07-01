import { camelToPascalWithSpace, Methods } from "./helper.js";
import { FuncInstanceMetadata } from "./type.js";

export function printController(usecases: FuncInstanceMetadata[]) {
  let maxLengthRoute = 0;
  let maxLengthUsecase = 0;
  let maxLengthTag = 0;

  usecases.forEach(({ funcMetadata }) => {
    //

    const data = funcMetadata.decorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };

    if (maxLengthRoute < data.path.toString().length) {
      maxLengthRoute = data.path.toString().length;
    }

    const usecase = camelToPascalWithSpace(funcMetadata.name);
    if (maxLengthUsecase < usecase.length) {
      maxLengthUsecase = usecase.length;
    }

    if (maxLengthTag < data.tag.length) {
      maxLengthTag = data.tag.length;
    }
  });

  let tag = "";

  return usecases.map(({ funcMetadata }) => {
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
      usecase: camelToPascalWithSpace(funcMetadata.name).padEnd(maxLengthUsecase).substring(0),
      method: data.method.padStart(6).toUpperCase(),
      path: data.path.toString().padEnd(maxLengthRoute).substring(0),
    };
  });
}
