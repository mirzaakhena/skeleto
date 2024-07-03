var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, PrimaryColumn } from "typeorm";
let Person = class Person {
    //
    id;
    name;
    email;
};
__decorate([
    PrimaryColumn({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], Person.prototype, "id", void 0);
__decorate([
    Column({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", String)
], Person.prototype, "name", void 0);
__decorate([
    Column({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", String)
], Person.prototype, "email", void 0);
Person = __decorate([
    Entity()
], Person);
export { Person };
//# sourceMappingURL=model_person.js.map