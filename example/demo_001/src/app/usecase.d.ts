import { FindOnePersonByEmail, GenerateRandomId, RegisterUniquePerson, SavePerson } from "./types.js";
/**
 *
 * @Action {"readTypeArguments": true}
 * @Transaction
 * @Controller {
 *  "method": "post",
 *  "path": "/person/:something",
 *  "tag": "person",
 *  "security": [{"bearerAuth": []}]
 * }
 */
export declare function ImplRegisterUniquePerson(findOnePersonByEmail: FindOnePersonByEmail, savePerson: SavePerson, generateRandomId: GenerateRandomId): RegisterUniquePerson;
//# sourceMappingURL=usecase.d.ts.map