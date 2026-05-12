import { Logger, Module, type OnModuleInit } from "@nestjs/common"

import { ConfigurableModuleClass } from "./anubis.module-definition"
import { RefreshService } from "./services/refresh.service"

/**
 * Historical ECB-based currency conversion module for NestJS.
 *
 * On module initialisation, fetches the ECB historical exchange rate
 * data, parses it, and upserts all rows into the consumer's database.
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
  private readonly logger = new Logger(AnubisModule.name)

  public constructor(private readonly refresh: RefreshService) {
    super()
  }

  public onModuleInit(): void {
    void this.refresh.run().catch((error: Error) => {
      this.logger.error(
        `Failed to sync exchange rates: ${error.message}`,
        error.stack,
      )
    })
  }
}
