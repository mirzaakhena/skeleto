import { DataSource } from "typeorm";
import { FindOnePersonByEmail, GenerateRandomId, SavePerson } from "./types.js";
/**
 *
 * @Action
 */
export declare function implFindOnePersonByEmail(ds: DataSource): FindOnePersonByEmail;
/**
 *
 * @Action
 */
export declare function implSavePerson(ds: DataSource): SavePerson;
/**
 *
 * @Action
 */
export declare function implGenerateRandomId(): GenerateRandomId;
//# sourceMappingURL=gateway.d.ts.map