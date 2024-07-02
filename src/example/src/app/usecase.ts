import { Person } from "./model_person.js";
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
export function ImplRegisterUniquePerson(
  //
  findOnePersonByEmail: FindOnePersonByEmail,
  savePerson: SavePerson,
  generateRandomId: GenerateRandomId
): RegisterUniquePerson {
  //

  return async (ctx, req) => {
    //
    if (req.payload.email.trim() === "") {
      throw new Error(`Email must not be empty`);
    }

    const objPerson = await findOnePersonByEmail(ctx, { email: req.payload.email });

    if (objPerson) {
      throw new Error(`Person with email ${req.payload.email} already exists`);
    }

    const newPerson = new Person();
    newPerson.name = req.payload.name;
    newPerson.email = req.payload.email;
    newPerson.id = await generateRandomId(ctx);

    await savePerson(ctx, newPerson);

    return { person: newPerson };
  };
}
