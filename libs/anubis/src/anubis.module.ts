import { Module, type OnModuleInit } from "@nestjs/common"

import { ConfigurableModuleClass } from "./anubis.module-definition"
import { RefreshService } from "./services/refresh.service"

/**
 * Historical ECB-based currency conversion module for NestJS.
 *
 * On module initialisation, fetches the ECB historical exchange rate
 * data, parses it, and upserts all rows into the consumer's database.
 * If the fetch fails, a {@link CurrencyRefreshFailedEvent} is emitted
 * and the application continues running.
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
  public constructor(private readonly refresh: RefreshService) {
    super()
  }

  public onModuleInit(): void {
    void this.refresh.run()
  }
}
