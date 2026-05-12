import { Inject, Injectable, Logger } from "@nestjs/common"
import { DataSource, type Repository } from "typeorm"

import {
  type AnubisOptions,
  type CurrencyRate,
  ANUBIS_OPTIONS,
  DEFAULT_RATES_URL,
} from "../anubis.options"
import { EcbHistFetcher } from "../ecb/ecb-hist.fetcher"
import { EcbHistParser } from "../ecb/ecb-hist.parser"

/**
 * Service responsible for fetching, parsing, and upserting ECB exchange
 * rate data into the consumer's database.
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
    dataSource: DataSource,
  ) {
    this.repository = dataSource.getRepository(this.options.entity)
  }

  /**
   * Whether the initial rate sync has completed successfully.
   */
  public get initialised(): boolean {
    return this._initialised
  }

  /**
   * Fetches the ECB exchange rate ZIP, parses it, and upserts all rows
   * into the database. Sets {@link initialised} to `true` on success.
   *
   * @throws {Error} If fetching, parsing, or upserting fails
   */
  public async run(): Promise<void> {
    const url = this.options.ratesUrl ?? DEFAULT_RATES_URL

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
  }
}
