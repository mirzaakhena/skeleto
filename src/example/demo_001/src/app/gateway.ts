import { v4 as uuidv4 } from "uuid";
import { Person } from "./model_person.js";
import { getDataSourceFromContext } from "./transaction.js";
import { AppDataSource, FindOnePersonByEmail, GenerateRandomId, SavePerson } from "./types.js";

/**
 *
 * @Action
 */
export function implFindOnePersonByEmail(ds: AppDataSource): FindOnePersonByEmail {
  return async (ctx, req) => {
    return await getDataSourceFromContext(ctx, ds)
      .getRepository(Person)
      .findOne({ where: { email: req.email } });
  };
}

/**
 *
 * @Action
 */
export function implSavePerson(ds: AppDataSource): SavePerson {
  return async (ctx, req) => {
    await getDataSourceFromContext(ctx, ds).getRepository(Person).save(req);
  };
}

/**
 *
 * @Action
 */
export function implGenerateRandomId(): GenerateRandomId {
  return async (ctx, req) => uuidv4();
}
