import { ConfigurableModuleBuilder } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"

import { type AnubisOptions, ANUBIS_OPTIONS } from "./anubis.options"
import { CurrencyConversionService } from "./services/currency-conversion.service"
import { RefreshService } from "./services/refresh.service"

const ANUBIS_PROVIDERS = [CurrencyConversionService, RefreshService]

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE,
  OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<AnubisOptions>({
  optionsInjectionToken: ANUBIS_OPTIONS,
})
  .setClassMethodName("forRoot")
  .setExtras({}, (definition) => ({
    ...definition,
    global: true,
    imports: [ScheduleModule.forRoot(), ...(definition.imports ?? [])],
    providers: [...(definition.providers ?? []), ...ANUBIS_PROVIDERS],
    exports: [
      ...(definition.exports ?? []),
      ...ANUBIS_PROVIDERS,
      ANUBIS_OPTIONS,
    ],
  }))
  .build()
