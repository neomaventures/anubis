import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { Test } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

import { AnubisModule } from "./anubis.module"
import { type CurrencyRate } from "./anubis.options"

@Entity()
@Unique(["date", "currency"])
class TestExchangeRate implements CurrencyRate {
  @PrimaryGeneratedColumn()
  public id!: number

  @Column()
  public date!: string

  @Column()
  public currency!: string

  @Column()
  public rate!: string
}

const fixtureZip = pathToFileURL(
  resolve(__dirname, "..", "..", "..", "fixtures", "ecb", "eurofxref-hist.zip"),
).href

describe("AnubisModule", () => {
  it("should compile the module", async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [TestExchangeRate],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([TestExchangeRate]),
        AnubisModule.forRoot({
          ratesUrl: fixtureZip,
          entity: TestExchangeRate,
        }),
      ],
    }).compile()

    expect(module).toBeDefined()

    await module.close()
  })
})
