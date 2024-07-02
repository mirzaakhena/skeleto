import express from "express";
import { ActionHandler, FuncInstanceMetadata, newContext } from "skeleto";
import { camelToPascalWithSpace, Methods } from "./shared.js";

type RequestWithContext = express.Request & {
  context?: Record<string, any>;
};

const getRequestWithContext = (req: express.Request) => {
  return (req as RequestWithContext).context;
};

export function generateController(router: express.Router, useCases: FuncInstanceMetadata[]) {
  //

  useCases.forEach(({ funcInstance, funcMetadata }) => {
    //

    const useCase = funcInstance as ActionHandler;

    const data = funcMetadata.additionalDecorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };

    if (!data) throw new Error("undefined path and method");

    router[data.method as Methods](data.path, async (req, res) => {
      //

      const ctx = getRequestWithContext(req);

      let payload = {};

      funcMetadata.request?.structure.forEach((tf) => {
        //

        tf.decorators.forEach((y) => {
          //

          if (y.name !== "RequestPart") return;

          if (y.data === "query") {
            payload = { ...payload, [tf.name]: req.query[tf.name] };
            return;
          }
          if (y.data === "param") {
            payload = { ...payload, [tf.name]: req.params[tf.name] };
            return;
          }
          if (y.data === "body") {
            payload = { ...payload, [tf.name]: req.body[tf.name] };
            return;
          }
          if (y.data === "header") {
            payload = { ...payload, [tf.name]: req.get(tf.name) };
            return;
          }

          if (y.data === "local" && ctx) {
            payload = { ...payload, [tf.name]: ctx[tf.name] };
            return;
          }
        });
      });

      try {
        const result = await useCase(newContext(), payload);
        res.json(result);
      } catch (error: any) {
        res.json({ message: error.message });
      }
    });
  });
}

export const handleJWTAuth = (secretKey: string, fieldName: string) => async (req: RequestWithContext, res: express.Response, next: express.NextFunction) => {
  //

  try {
    //
    // const authHeader = req.headers.authorization;
    // if (!authHeader) {
    //   res.sendStatus(401);
    //   return;
    // }

    // const token = authHeader.split(" ");
    // if (token.length !== 2 || token[0].toLowerCase() !== "bearer") {
    //   res.sendStatus(401);
    //   return;
    // }

    // const dataDecoded = jwt.verify(token[1], secretKey) as JwtPayload;
    const dataDecoded = { data: "" };

    if (!req.context) {
      req.context = {};
      req.context[fieldName] = dataDecoded.data; // split between user and vendor login data
    }

    next();
  } catch (e: any) {
    next(e);
  }
};

export function printController(usecases: FuncInstanceMetadata[]) {
  let maxLengthRoute = 0;
  let maxLengthUsecase = 0;
  let maxLengthTag = 0;

  usecases.forEach(({ funcMetadata }) => {
    //

    const data = funcMetadata.additionalDecorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };

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

    const data = funcMetadata.additionalDecorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };

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
