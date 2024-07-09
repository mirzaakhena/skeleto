import { ActionHandler } from "skeleto";

export type FindCityByName = ActionHandler<{ name: string }, { city: string } | null>;

/** @Action */
export function implFindCityByName(): FindCityByName {
  return async (ctx, req) => {
    if (req.name === "ade") return { name: "ade", city: "Jakarta" };
    if (req.name === "asep") return { name: "asep", city: "Bandung" };
    if (req.name === "anto") return { name: "anto", city: "Yogyakarta" };
    return null;
  };
}

export type HelloWorld = ActionHandler<{ name: string }, { message: string }>;

/** @Action */
export function implHelloWorld(findCity: FindCityByName): HelloWorld {
  return async (ctx, req) => {
    const result = await findCity(ctx, req);
    if (!result) return { message: `Hello ${req.name}` };
    return { message: `Hello ${req.name}, you are from ${result.city}` };
  };
}
