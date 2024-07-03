import { ActionHandler, WrapperHandler } from "skeleto";
import { Person } from "./model_person.js";
export type Transaction = WrapperHandler;
export type Logger = WrapperHandler;
type FindOnePersonByEmailRequest = {
    email: string;
};
type FindOnePersonByEmailResponse = Person | null;
export type FindOnePersonByEmail = ActionHandler<FindOnePersonByEmailRequest, FindOnePersonByEmailResponse>;
type SavePersonRequest = Person;
type SavePersonResponse = void;
export type SavePerson = ActionHandler<SavePersonRequest, SavePersonResponse>;
type GenerateRandomIdRequest = void;
type GenerateRandomIdResponse = string;
export type GenerateRandomId = ActionHandler<GenerateRandomIdRequest, GenerateRandomIdResponse>;
type Request = {
    /**
     * @RequestPart body
     */
    email: string;
    /**
     * @RequestPart body
     */
    name: string;
    /**
     * @RequestPart query
     */
    page: number;
    /**
     * @RequestPart query
     */
    size: number;
    /**
     * @RequestPart param
     */
    something: "aaa" | "bbb" | 20;
};
type Response = {
    person: Person;
};
export type RegisterUniquePerson = ActionHandler<Request, Response>;
export {};
//# sourceMappingURL=types.d.ts.map