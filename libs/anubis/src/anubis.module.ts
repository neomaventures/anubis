import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { Inject, Module, type OnModuleInit } from "@nestjs/common"

import { ConfigurableModuleClass } from "./anubis.module-definition"
import {
  type AnubisOptions,
  ANUBIS_OPTIONS,
  DEFAULT_RATES_URL,
} from "./anubis.options"
import { RefreshService } from "./services/refresh.service"

/**
 * Historical ECB-based currency conversion module for NestJS.
 *
 * On module initialisation, fetches the ECB historical exchange rate
 * data, parses it, and upserts all rows into the consumer's database.
 * If the fetch fails, a {@link CurrencyRefreshFailedEvent} is emitted
 * and the application continues running.
 *
 * For `file://` URLs, the file must exist at boot time or the module
 * will throw synchronously, preventing the application from starting
 * with a missing data source.
 *
 * @requires TypeOrmModule must be configured in your application with
 * the entity class registered via `TypeOrmModule.forFeature([YourEntity])`.
 *
 * @example Static configuration
 * ```typescript
 * AnubisModule.forRoot({
 *   ratesUrl: 'file:///path/to/eurofxref-hist.zip',
 *   entity: ExchangeRate,
 * })
 * ```
 *
 * @example Async configuration via DI
 * ```typescript
 * AnubisModule.forRootAsync({
 *   useFactory: () => ({
 *     ratesUrl: process.env.RATES_URL,
 *     entity: ExchangeRate,
 *   }),
 * })
 * ```
 */
@Module({})
export class AnubisModule
  extends ConfigurableModuleClass
  implements OnModuleInit
{
  public constructor(
    @Inject(ANUBIS_OPTIONS) private readonly options: AnubisOptions,
    private readonly refresh: RefreshService,
  ) {
    super()
  }

  public onModuleInit(): void {
    const url = this.options.ratesUrl ?? DEFAULT_RATES_URL

    try {
      const parsed = new URL(url)

      if (parsed.protocol === "file:") {
        const filePath = fileURLToPath(url)

        if (!existsSync(filePath)) {
          throw new Error(
            `ratesUrl file not found: ${filePath} — check your ratesUrl configuration`,
          )
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("ratesUrl")) {
        throw error
      }
      // URL parsing errors for non-file protocols are handled by the
      // fetch step below
    }

    void this.refresh.run()
  }
}
