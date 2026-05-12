import { Inject, Injectable, Logger } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { Cron } from "@nestjs/schedule"
import { DataSource, type Repository } from "typeorm"

import {
  type AnubisOptions,
  type CurrencyRate,
  ANUBIS_OPTIONS,
  DEFAULT_RATES_URL,
} from "../anubis.options"
import { EcbHistFetcher } from "../ecb/ecb-hist.fetcher"
import { EcbHistParser } from "../ecb/ecb-hist.parser"
import { ANUBIS_REFRESH_FAILED_EVENT } from "../events/anubis-events"
import { CurrencyRefreshFailedEvent } from "../events/currency-refresh-failed.event"

/**
 * Service responsible for fetching, parsing, and upserting ECB exchange
 * rate data into the consumer's database.
 *
 * On failure, emits a {@link CurrencyRefreshFailedEvent} instead of
 * throwing, so that the application continues running with stale (or
 * no) data.
 *
 * @example
 * ```typescript
 * const refreshService = app.get(RefreshService)
 * await refreshService.run()
 * console.log(refreshService.initialised) // true
 * ```
 */
@Injectable()
export class RefreshService {
  private readonly logger = new Logger(RefreshService.name)
  private readonly fetcher = new EcbHistFetcher()
  private readonly parser = new EcbHistParser()
  private readonly repository: Repository<CurrencyRate>
  private _initialised = false

  public constructor(
    @Inject(ANUBIS_OPTIONS) private readonly options: AnubisOptions,
    private readonly eventEmitter: EventEmitter2,
    dataSource: DataSource,
  ) {
    this.repository = dataSource.getRepository(this.options.entity)
  }

  /**
   * Whether the initial rate sync has completed successfully at least once.
   */
  public get initialised(): boolean {
    return this._initialised
  }

  /**
   * Fetches the ECB exchange rate ZIP, parses it, and upserts all rows
   * into the database. Sets {@link initialised} to `true` on success.
   *
   * On failure, logs the error, emits a {@link CurrencyRefreshFailedEvent},
   * and returns without throwing. The {@link initialised} flag is not
   * reverted on failure.
   */
  public async run(): Promise<void> {
    const url = this.options.ratesUrl ?? DEFAULT_RATES_URL

    try {
      this.logger.log(`Fetching exchange rates from ${url}`)

      const buffer = await this.fetcher.fetch(url)
      const rows = this.parser.parse(buffer)

      this.logger.log(`Parsed ${rows.length} exchange rate rows`)

      await this.repository.upsert(
        rows.map((row) => ({
          date: row.date,
          currency: row.currency,
          rate: row.rate,
        })),
        ["date", "currency"],
      )

      this._initialised = true

      this.logger.log("Exchange rate sync complete")
    } catch (error) {
      this.logger.error(
        `Failed to sync exchange rates: ${(error as Error).message}`,
        (error as Error).stack,
      )

      const [latestRow] = await this.repository
        .find({ order: { date: "DESC" }, take: 1 })
        .catch(() => [] as CurrencyRate[])

      const latestRateDate = latestRow ? new Date(latestRow.date) : null

      this.eventEmitter.emit(
        ANUBIS_REFRESH_FAILED_EVENT,
        new CurrencyRefreshFailedEvent(error as Error, url, latestRateDate),
      )
    }
  }

  /**
   * Scheduled cron job that re-fetches and upserts exchange rates daily.
   * Runs at 04:05 UTC to allow time for the ECB to publish new data.
   */
  @Cron("5 4 * * *", { name: "anubis.refresh", timeZone: "UTC" })
  public async scheduledRefresh(): Promise<void> {
    this.logger.log("Scheduled refresh triggered")
    await this.run()
  }
}
