import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { ScheduleModule, SchedulerRegistry } from "@nestjs/schedule"
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

describe("RefreshService (cron)", () => {
  let registry: SchedulerRegistry
  let dataSource: DataSource

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRoot(),
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

    await module.init()

    registry = module.get(SchedulerRegistry)
    dataSource = module.get(DataSource)
  })

  afterEach(async () => {
    await dataSource.destroy()
  })

  describe("Given the module has initialised", () => {
    it("should register a cron job named 'anubis.refresh'", () => {
      const job = registry.getCronJob("anubis.refresh")

      expect(job).toBeDefined()
    })

    it("should use the cron expression '5 4 * * *'", () => {
      const job = registry.getCronJob("anubis.refresh")

      // CronJob stores the cron time internally; we verify via the
      // string representation of the next scheduled dates.
      // The cronTime.source should be our cron expression.
      const cronTime = (job as any).cronTime
      expect(cronTime.source).toBe("5 4 * * *")
    })
  })
})
