import { ActionHandler } from "skeleto";

export type FindCityByName = ActionHandler<{ name: string }, { city: string } | null>;

/** @Action */
export function implFindCityByName(): FindCityByName {
  return async (ctx, req) => {
    if (req.name === "ade") return { city: "Jakarta" };
    if (req.name === "asep") return { city: "Bandung" };
    if (req.name === "anto") return { city: "Yogyakarta" };
    return null;
  };
}

export type HelloWorld = ActionHandler<{ name: string }, { message: string }>;

/** @Action */
export function implHelloWorld(findCity: FindCityByName): HelloWorld {
  return async (ctx, req) => {
    const result = await findCity(ctx, req);
    if (!result) return { message: `Hello ${req.name}` }; // Hello asep, you are from Bandung
    return { message: `Hello ${req.name}, you are from ${result.city}` }; // Hello john
  };
}
