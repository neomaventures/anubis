import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { Test } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import {
  Column,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm"

import { ANUBIS_OPTIONS, type CurrencyRate } from "../anubis.options"

import { RefreshService } from "./refresh.service"

@Entity()
@Unique(["date", "currency"])
class TestRate implements CurrencyRate {
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
  resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "fixtures",
    "ecb",
    "eurofxref-hist.zip",
  ),
).href

describe("RefreshService", () => {
  let service: RefreshService
  let dataSource: DataSource

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [TestRate],
          synchronize: true,
        }),
      ],
      providers: [
        {
          provide: ANUBIS_OPTIONS,
          useValue: {
            ratesUrl: fixtureZip,
            entity: TestRate,
          },
        },
        RefreshService,
      ],
    }).compile()

    service = module.get(RefreshService)
    dataSource = module.get(DataSource)
  })

  afterEach(async () => {
    await dataSource.destroy()
  })

  describe("run()", () => {
    describe("Given a valid file:// ratesUrl", () => {
      it("should upsert all parsed rows into the database", async () => {
        await service.run()

        const repo = dataSource.getRepository(TestRate)
        const rows = await repo.find()

        // 5 dates x 4 currencies = 20 rows
        expect(rows).toHaveLength(20)
      })

      it("should set initialised to true", async () => {
        expect(service.initialised).toBe(false)

        await service.run()

        expect(service.initialised).toBe(true)
      })

      it("should store correct rate data", async () => {
        await service.run()

        const repo = dataSource.getRepository(TestRate)
        const row = await repo.findOneBy({
          date: "2024-11-08",
          currency: "USD",
        })

        expect(row).toMatchObject({
          date: "2024-11-08",
          currency: "USD",
          rate: "1.0801",
        })
      })
    })
  })
})
