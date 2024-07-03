import { v4 as uuidv4 } from "uuid";
import { Person } from "./model_person.js";
import { getDataSourceFromContext } from "../infrastructure/transaction.js";
/**
 *
 * @Action
 */
export function implFindOnePersonByEmail(ds) {
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
export function implSavePerson(ds) {
    return async (ctx, req) => {
        await getDataSourceFromContext(ctx, ds).getRepository(Person).save(req);
    };
}
/**
 *
 * @Action
 */
export function implGenerateRandomId() {
    return async () => uuidv4();
}
//# sourceMappingURL=gateway.js.map