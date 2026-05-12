import { Test, type TestingModuleBuilder } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

import { AnubisModule, type CurrencyRate } from "@lib"

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

const missingFileUrl = "file:///nonexistent/path/to/eurofxref-hist.zip"

const moduleConfigs: [string, () => TestingModuleBuilder][] = [
  [
    "forRoot",
    (): TestingModuleBuilder =>
      Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: "sqlite",
            database: ":memory:",
            entities: [TestExchangeRate],
            synchronize: true,
          }),
          TypeOrmModule.forFeature([TestExchangeRate]),
          AnubisModule.forRoot({
            ratesUrl: missingFileUrl,
            entity: TestExchangeRate,
          }),
        ],
      }),
  ],
  [
    "forRootAsync",
    (): TestingModuleBuilder =>
      Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: "sqlite",
            database: ":memory:",
            entities: [TestExchangeRate],
            synchronize: true,
          }),
          TypeOrmModule.forFeature([TestExchangeRate]),
          AnubisModule.forRootAsync({
            useFactory: () => ({
              ratesUrl: missingFileUrl,
              entity: TestExchangeRate,
            }),
          }),
        ],
      }),
  ],
]

moduleConfigs.forEach(([name, createBuilder]) => {
  describe(`Missing file:// ratesUrl (${name})`, () => {
    it("should throw on app.init() with error containing the path and ratesUrl", async () => {
      const module = await createBuilder().compile()

      try {
        await expect(module.init()).rejects.toThrow("ratesUrl")
      } finally {
        await module.close().catch(() => {})
      }
    })

    it("should include the file path in the error message", async () => {
      const module = await createBuilder().compile()

      try {
        await expect(module.init()).rejects.toThrow(
          "/nonexistent/path/to/eurofxref-hist.zip",
        )
      } finally {
        await module.close().catch(() => {})
      }
    })
  })
})
