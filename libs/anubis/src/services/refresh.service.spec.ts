import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { EventEmitterModule, EventEmitter2 } from "@nestjs/event-emitter"
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
import { ANUBIS_REFRESH_FAILED_EVENT } from "../events/anubis-events"
import { CurrencyRefreshFailedEvent } from "../events/currency-refresh-failed.event"

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

const BAD_URL = "file:///nonexistent/path/to/rates.zip"

describe("RefreshService", () => {
  let service: RefreshService
  let dataSource: DataSource
  let eventEmitter: EventEmitter2

  const createModule = async (ratesUrl: string): Promise<void> => {
    const module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
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
            ratesUrl,
            entity: TestRate,
          },
        },
        RefreshService,
      ],
    }).compile()

    service = module.get(RefreshService)
    dataSource = module.get(DataSource)
    eventEmitter = module.get(EventEmitter2)
  }

  afterEach(async () => {
    await dataSource.destroy()
  })

  describe("run()", () => {
    describe("Given a valid file:// ratesUrl", () => {
      beforeEach(async () => {
        await createModule(fixtureZip)
      })

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

      it("should be idempotent — running twice does not duplicate rows", async () => {
        await service.run()
        await service.run()

        const repo = dataSource.getRepository(TestRate)
        const rows = await repo.find()

        // Still 20 rows, not 40
        expect(rows).toHaveLength(20)
      })
    })

    describe("Given a cold-start failure (empty DB, fetcher rejects)", () => {
      beforeEach(async () => {
        await createModule(BAD_URL)
      })

      it("should emit CurrencyRefreshFailedEvent with latestRateDate null", async () => {
        const events: CurrencyRefreshFailedEvent[] = []
        eventEmitter.on(
          ANUBIS_REFRESH_FAILED_EVENT,
          (e: CurrencyRefreshFailedEvent) => events.push(e),
        )

        await service.run()

        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          url: BAD_URL,
          latestRateDate: null,
        })
        expect(events[0].error).toBeDefined()
        expect(events[0].error.message).toContain("ENOENT")
      })

      it("should keep initialised as false", async () => {
        await service.run()

        expect(service.initialised).toBe(false)
      })

      it("should not throw", async () => {
        await expect(service.run()).resolves.toBeUndefined()
      })
    })

    describe("Given a post-sync failure (first run succeeds, second fails)", () => {
      let goodService: RefreshService

      beforeEach(async () => {
        // First: create a service with a good URL, run it to populate DB
        const goodModule = await Test.createTestingModule({
          imports: [
            EventEmitterModule.forRoot(),
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

        goodService = goodModule.get(RefreshService)
        dataSource = goodModule.get(DataSource)
        eventEmitter = goodModule.get(EventEmitter2)

        await goodService.run()

        // Now create a bad service using the same datasource
        // by swapping the options to a bad URL
        ;(goodService as any).options = {
          ratesUrl: BAD_URL,
          entity: TestRate,
        }
        service = goodService
      })

      it("should emit CurrencyRefreshFailedEvent with latestRateDate populated", async () => {
        const events: CurrencyRefreshFailedEvent[] = []
        eventEmitter.on(
          ANUBIS_REFRESH_FAILED_EVENT,
          (e: CurrencyRefreshFailedEvent) => events.push(e),
        )

        await service.run()

        expect(events).toHaveLength(1)
        expect(events[0].latestRateDate).toBeInstanceOf(Date)
        expect(events[0]).toMatchObject({
          url: BAD_URL,
        })
      })

      it("should keep initialised as true from the first successful run", async () => {
        await service.run()

        expect(service.initialised).toBe(true)
      })
    })
  })
})
