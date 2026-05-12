import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

import { type CurrencyRate } from "@lib"

@Entity()
@Unique(["date", "currency"])
export class ExchangeRate implements CurrencyRate {
  @PrimaryGeneratedColumn()
  public id!: number

  @Column()
  public date!: string

  @Column()
  public currency!: string

  @Column()
  public rate!: string
}
