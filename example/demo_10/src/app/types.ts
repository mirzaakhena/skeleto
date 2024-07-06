import { ActionHandler, WrapperHandler } from "skeleto";
import { Person } from "./model_person.js";

// define transaction
export type Transaction = WrapperHandler;

// define logging
export type Logging = WrapperHandler;

// define error handler
export type ErrorHandler = WrapperHandler;

// define request type
type FindOnePersonByEmailRequest = {
  email: string;
};

// define response type
type FindOnePersonByEmailResponse = Person | null;

// define a function type as Gateway with a defined request and response type
export type FindOnePersonByEmail = ActionHandler<FindOnePersonByEmailRequest, FindOnePersonByEmailResponse>;

type SavePersonRequest = Person;

type SavePersonResponse = void;

// define a function type as Gateway with a defined request and response type
export type SavePerson = ActionHandler<SavePersonRequest, SavePersonResponse>;

type GenerateRandomIdRequest = void;

type GenerateRandomIdResponse = string;

// define a function type as Gateway with a defined request and response type
export type GenerateRandomId = ActionHandler<GenerateRandomIdRequest, GenerateRandomIdResponse>;

// define request type
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

// define response type
type Response = {
  person: Person;
};

// define a function type as UseCase with a defined request and response type
export type RegisterUniquePerson = ActionHandler<Request, Response>;
