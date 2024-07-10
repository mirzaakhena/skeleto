import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Person {
  //

  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  email: string;
}
