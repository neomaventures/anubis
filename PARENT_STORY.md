# @neoma/currency — v0.1.0 parent story

`@neoma/currency` is a NestJS package that answers a single question: *"roughly,
what was X in currency A worth in currency B on date D?"* It pulls free European
Central Bank (ECB) reference-rate data, persists it via a consumer-supplied
TypeORM entity, and exposes a `CurrencyConversionService.convert()` method that
returns an amount along with the rate, the requested date, and the source date
the rate actually came from.

This package is **for rough historical estimates only** — analytics dashboards,
"what did this expense cost in my reporting currency?", lifetime-value reporting
across currencies, etc. It is **not** for transactional FX, settlement, billing,
or anything where precision, mid/bid/ask spreads, or intraday timing matter.
ECB publishes a single daily reference rate per currency on weekdays only; this
package surfaces exactly that and nothing more.

## Conversation

### 2026-05-09 — initial scoping (TPO + user)

Pain originates in Bertie: ad-hoc historical conversions written inline against
hand-rolled rate tables. The pattern has appeared in two independent places
(historical revenue reporting and a one-off dashboard), the consumer would
otherwise write fetch/parse/upsert boilerplate rather than business logic, and
the surface area is small enough to commit to post-v1. Extraction approved.

Key design decisions captured before slicing — these are settled and should
**not** be relitigated during architect review or slicing:

- **Data source.** ECB `eurofxref-hist.zip`
  (`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip`). Free, no
  auth, ~30 currencies, EUR-quoted, daily rates back to 1999, weekdays only.
- **Cross-rate.** Always via EUR. Hardcoded for v0.1.0 — no pluggable bases.
- **Storage.** Consumer-supplied TypeORM entity implementing the rate
  interface (date, currency code, rate-vs-EUR). Same convention as
  `@neoma/garmr` (`Authenticatable` + `entity: User`).
- **Non-trading-day handling.** Fall back to the most recent prior rate. The
  service returns a result object — never a bare number — so consumers always
  see whether the rate was exact or a fallback.
- **Init strategy.** On module init, kick off a background fetch + upsert of
  the full hist zip. No freshness check, no calendar logic. Queries during
  cold start (before any data has landed) throw
  `CurrencyConversionNotInitialisedException`.
- **Daily refresh.** `@nestjs/schedule` cron inside the package, daily, same
  fetch + upsert. Idempotent.
- **Multi-instance behaviour.** Single `repository.upsert(allRows, ['date',
  'currency'])` call per sync — no batching, no transaction management, no
  advisory locks. Concurrent replicas race; final state is consistent because
  every replica writes identical values. Short-term lock contention accepted
  as a v0.1.0 trade-off.
- **Unsupported currency.** Typed `UnsupportedCurrencyException`. ECB only
  covers ~30 currencies — exotic pairs (NGN, VND, etc.) fail loudly rather
  than silently producing a wrong answer.
- **`ratesUrl` semantics.** Any URL. Defaults to the ECB hist zip. Supports
  `file://` for local dev / test fixtures / air-gapped mirrors. The daily
  cron runs regardless of scheme — re-reading a local file daily is
  harmless. Implementation branches on `URL.protocol === 'file:'`
  (`fs.readFile(new URL(url))`) vs HTTP (`fetch()`).
- **Missing file (when `ratesUrl` is `file://`).** Throws at module init,
  not lazily on first query. Misconfiguration surfaces immediately.

### 2026-05-09 — open-question resolutions (TPO-final-call)

Locking in answers to the open questions surfaced after initial scoping. Brief
rationale per item so the architect inherits the *why*, not just the *what*.

- **Rate is a string end-to-end.** ECB CSV ships values as strings; storing
  them as strings avoids floating-point precision corruption on the round
  trip. `CurrencyRate.rate`, `ConvertInput.amount`, `ConvertResult.amount`,
  and `ConvertResult.rate` are all `string`. **Architect must pick a decimal
  library** (`decimal.js` or `bignumber.js`) for the cross-rate arithmetic in
  `convert()` — multiplying amount by a rate, dividing by a cross-rate — so
  precision is preserved end-to-end. This is a hard requirement, not a
  suggestion.
- **Exception taxonomy — three distinct types, no staleness threshold.**
  - `CurrencyConversionNotInitialisedException` — no data has been synced yet
    (cold start, before first sync completes). Consumers can interpret this
    as "wait and retry."
  - `CurrencyConversionDateOutOfRangeException` — requested date is pre-1999
    (no ECB data exists). Permanent for that input; retrying will not help.
    Future dates are **not** out-of-range — they fall back to the most recent
    prior rate, identical to weekend/holiday/staleness gaps.
  - `UnsupportedCurrencyException` — from/to currency is not in ECB's ~30
    supported set.
  - **Stale data is silent.** If our cron has been broken for two weeks,
    `convert()` still succeeds with the most recent rate we have, and the
    result object's `sourceDate` reveals the gap. Consumers compare
    `date - sourceDate` if they care. The package owns no threshold logic —
    "how stale is too stale?" is a consumer policy question, not ours.
- **`forRootAsync` parity — yes.** Exposed via `ConfigurableModuleBuilder`,
  matching the `@neoma/garmr` precedent. Consumers can inject `ratesUrl`
  (and other options) from a config service rather than hardcoding them at
  module registration.
- **Multi-instance: one upsert call.** `repository.upsert(allRows, ['date',
  'currency'])` — no batching, no locks, no transactions. TypeORM's
  on-conflict semantics handle the dedup. Pure internal change to optimise
  later if it ever matters in practice.

### 2026-05-09 — future-date and decimal-library final calls (TPO-final-call)

Two follow-up resolutions narrowing the design further:

- **Future dates are not an error — they are just another gap.**
  `CurrencyConversionDateOutOfRangeException` now fires **only** for pre-1999
  dates (a permanent historical fact: ECB has no data before 1999). A date in
  the future is treated identically to a weekend, holiday, or stale-cron gap:
  fall back to the most recent prior rate, return `isExact: false`, and let
  `sourceDate` reveal the situation. Rationale: this avoids any timezone-aware
  "is this in the future?" comparison entirely. Real-world example that
  motivated this: an Australian bank statement may legitimately carry a
  transaction dated tomorrow-UTC. The honest answer is "rate as of
  `sourceDate`" — the consumer can retry later if they want a more exact
  figure. Collapses open question 7 (date normalisation / future-date
  semantics) into the existing staleness behaviour. **Drop open question 7.**
- **Decimal library is a runtime dep, not a peer dep.** The consumer never
  touches the decimal library directly — strings on the public API surface
  (input `amount`, output `amount` and `rate`), arithmetic purely internal to
  `convert()`. No reason to leak it into the consumer's `package.json` or
  invite implementation swaps. Architect still picks `decimal.js` vs
  `bignumber.js` (or equivalent), but installs it as a regular runtime
  dependency. Updates open question 1 — peer-vs-runtime is resolved (runtime).

## Mission fit

`@neoma/currency` owns one concern: **historical rough-estimate currency
conversion sourced from ECB**. That mission excludes:

- Transactional / precision FX (out of scope forever — different package, if at
  all)
- Non-ECB sources (Open Exchange Rates, Fixer, central-bank-of-X, etc.)
- Intraday / tick data
- Pluggable base currencies (EUR is hardcoded — ECB is EUR-quoted)
- Calendar logic / TARGET trading-day awareness
- Currency formatting, locale-aware display, symbol lookup

The package stands alone — no hard dependency on any other `@neoma/*` package.
Consumers wire their own TypeORM module, supply the entity, and inject
`CurrencyConversionService`.

## Public API sketch

```ts
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CurrencyModule, CurrencyRate } from "@neoma/currency"
import { ExchangeRate } from "./entities/exchange-rate.entity"

@Module({
  imports: [
    TypeOrmModule.forRoot({ /* ... */ }),
    TypeOrmModule.forFeature([ExchangeRate]),
    CurrencyModule.forRoot({
      ratesEntity: ExchangeRate,
      // ratesUrl defaults to the ECB hist zip; override for tests / mirrors
    }),
  ],
})
export class AppModule {}
```

```ts
// forRootAsync parity — inject ratesUrl from a config service
import { ConfigModule, ConfigService } from "@nestjs/config"
import { CurrencyModule } from "@neoma/currency"
import { ExchangeRate } from "./entities/exchange-rate.entity"

@Module({
  imports: [
    CurrencyModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ratesEntity: ExchangeRate,
        ratesUrl: config.get<string>("CURRENCY_RATES_URL"),
      }),
    }),
  ],
})
export class AppModule {}
```

```ts
// Consumer-supplied entity implements the rate interface
import { Entity, PrimaryColumn, Column } from "typeorm"
import { CurrencyRate } from "@neoma/currency"

@Entity()
export class ExchangeRate implements CurrencyRate {
  @PrimaryColumn({ type: "date" })
  public date: string // ISO yyyy-mm-dd, ECB publication date

  @PrimaryColumn({ length: 3 })
  public currency: string // ISO 4217 code, e.g. "USD"

  @Column("numeric", { precision: 18, scale: 8 })
  public rate: string // units of `currency` per 1 EUR (string for precision)
}
```

```ts
// Consumer usage
import { CurrencyConversionService } from "@neoma/currency"

@Injectable()
export class ReportingService {
  constructor(private readonly currency: CurrencyConversionService) {}

  async usdToEurOn(date: Date, amount: string) {
    const result = await this.currency.convert({
      amount,
      from: "USD",
      to: "EUR",
      date,
    })
    // result: { amount: string, rate: string, date: Date, sourceDate: Date, isExact: boolean }
    return result
  }
}
```

```ts
// Public surface — consumer-visible exports

export interface CurrencyRate {
  date: string        // ISO yyyy-mm-dd
  currency: string    // ISO 4217
  rate: string        // units per 1 EUR (string for numeric precision)
}

export interface ConvertInput {
  amount: string      // decimal string for precision
  from: string        // ISO 4217
  to: string          // ISO 4217
  date: Date
}

export interface ConvertResult {
  amount: string      // converted amount (decimal string)
  rate: string        // effective rate applied (to-units per 1 from-unit)
  date: Date          // requested date
  sourceDate: Date    // date of the rate row actually used
  isExact: boolean    // date.getTime() === sourceDate.getTime()
}

export class CurrencyConversionService {
  convert(input: ConvertInput): Promise<ConvertResult>
}

export class CurrencyConversionNotInitialisedException extends HttpException {}
export class CurrencyConversionDateOutOfRangeException extends HttpException {
  readonly date: Date
}
export class UnsupportedCurrencyException extends HttpException {
  readonly currency: string
}
```

## Acceptance criteria — consumer behaviours

1. A consumer can register `CurrencyModule.forRoot({ ratesEntity })` with their
   own TypeORM entity and inject `CurrencyConversionService` anywhere in the
   app.
2. A consumer can register `CurrencyModule.forRootAsync({ useFactory, inject })`
   and have their `ratesEntity` / `ratesUrl` resolved from another module
   (e.g. injecting `ratesUrl` from a `ConfigService`).
3. A consumer can `convert({ amount: "10", from: "USD", to: "EUR", date: <2014-11-04> })`
   on a known trading day and receive a `ConvertResult` with `isExact: true`
   and `sourceDate` equal to the requested date.
4. A consumer querying a Saturday gets a result with `isExact: false` and a
   `sourceDate` equal to the most recent prior trading day (typically the
   Friday).
5. A consumer querying a public-holiday weekday (e.g. ECB closed) gets the
   most recent prior published rate with `isExact: false` — no calendar
   awareness, just "last known".
6. A consumer converting between two non-EUR currencies (e.g. USD → GBP) gets a
   correctly cross-rated result via EUR, with arithmetic performed using a
   decimal library so the result preserves precision (no floating-point drift).
7. A consumer converting to or from EUR gets a result that uses the ECB rate
   directly (no double conversion).
8. A consumer querying *before any data has been synced at all* (cold start)
   receives a `CurrencyConversionNotInitialisedException` — distinct from the
   date-out-of-range case — that they can interpret as "wait and retry".
9. A consumer querying a pre-1999 date (before ECB's coverage begins)
   receives a `CurrencyConversionDateOutOfRangeException` carrying the
   offending date — distinct from the not-yet-initialised case, and signalling
   a permanent condition for that input. Future dates are **not** an error
   (see #10): they fall back to the most recent prior rate like any other
   gap.
10. A consumer whose data is stale (the cron hasn't run recently) still
    receives a successful `ConvertResult` using the most recent rate the
    package holds; the staleness is observable via `sourceDate` and the
    package throws no exception. Threshold judgement is the consumer's.
11. A consumer requesting a currency ECB does not publish (e.g. NGN) receives
    an `UnsupportedCurrencyException` carrying the offending currency code.
12. A consumer can point `ratesUrl` at a `file://` zip in tests and the module
    bypasses the network entirely; `convert()` works against the fixture data.
13. A consumer whose `file://` `ratesUrl` does not exist sees the application
    fail to start (not at first query) with a clear error message naming the
    missing path and the option that produced it.
14. A consumer running multiple replicas observes idempotent rate storage — no
    duplicate rows, no init-time crashes from concurrent upserts — produced by
    a single `repository.upsert(rows, ['date', 'currency'])` call per sync.
15. A consumer who deploys the app and waits for the daily cron observes that
    rates refresh once per day without manual intervention.

## Semver impact

**Minor — initial release of a new package at 0.1.0.** Pre-v1, breaking changes
remain on the table for subsequent 0.x releases as the package learns from
real Bertie use; each will be captured in `CHANGELOG.md` with migration notes.

## Lifecycle stage

**v0.x iteration.** First public version. v1 will be considered after the
package has been used in Bertie for at least two minor cycles without
API-shape changes and we are willing to commit indefinitely to:

- the `ConvertInput` / `ConvertResult` shape (including string-typed amounts
  and rates)
- the `CurrencyRate` entity contract
- ECB as the sole data source
- the EUR-as-base cross-rate model
- the three named exception types

## Out of scope for v0.1.0

Explicitly deferred — do not slice these into v0.1.0 even if they look easy:

- Freshness checks / TARGET-calendar awareness (the package always re-fetches
  the full hist zip on init and once a day; "is today a trading day?" is not
  something the package decides)
- Staleness thresholds / "data too old" exceptions (consumer policy)
- The ECB `eurofxref-daily.xml` fast path (only the hist zip for v0.1.0)
- Advisory locks / leader election / batched upserts to coordinate
  multi-replica writes
- Pluggable base currencies (EUR is hardcoded — fine, ECB is EUR-quoted)
- Precision / transactional FX (mid/bid/ask spreads, settlement-grade rates)
- Non-ECB sources (Open Exchange Rates, Fixer, central banks, custom feeds)
- Intraday / tick rates
- Currency formatting, symbol lookup, locale-aware display
- Manual "force a refresh now" admin endpoint
- Metrics / observability hooks beyond what falls out of NestJS' `Logger`
- Migration generator for the rate entity (consumers own their migrations)

## Open questions for the architect

1. **Decimal library choice.** Pick one of `decimal.js` or `bignumber.js`
   (or equivalent) for `convert()` arithmetic and document the rationale
   (bundle size, API ergonomics, maintenance) in the slice brief. Installed
   as a **runtime dep** — resolved by TPO; the consumer never touches the
   library directly (strings on the public API surface).
2. **Fetcher / parser exposure.** Should `EcbHistFetcher` and `EcbHistParser`
   be injectable services (overridable in tests via Nest's `overrideProvider`)
   or internal helpers behind `CurrencyConversionService`? Leaning internal
   for v0.1.0 — `ratesUrl` + `file://` fixtures should cover the testing
   need without exposing internal seams. Confirm.
3. **Exception base / module structure.** Should the three exceptions extend
   `HttpException` directly (Garmr precedent) or a package-local
   `CurrencyException` base? Status codes and `getResponse()` shapes need
   choosing consistently with `@neoma/exception-handling` conventions —
   suggested defaults: `NotInitialised` → 503, `DateOutOfRange` → 400/422,
   `UnsupportedCurrency` → 400/422.
4. **Cron testability.** `@nestjs/schedule` cron triggers are awkward to test
   without waiting 24h. Options: (a) expose the refresh routine as a public
   method on a service so a test can call it directly; (b) use Nest's
   `SchedulerRegistry` to trigger the job by name in tests; (c) factor the
   refresh into a tiny `RefreshService` whose `run()` is the cron handler and
   is also callable directly. Recommend a path.
5. **Cold-start signal.** How does `CurrencyConversionService` know "the
   initial sync has not yet landed any data" so it can throw
   `CurrencyConversionNotInitialisedException`? Options: a boolean flag
   flipped after the first successful upsert (in-memory, per-process); a
   `count()` check; an `EXISTS` probe. Pick one and justify. Note the
   distinction from `DateOutOfRange` — initialised state is a process-level
   fact, not a per-query lookup result.
6. **Module global vs scoped.** Garmr is `global: true`; Logging is
   `global: true`; Config is `global: true`. Default to `global: true` for
   `CurrencyModule` unless there's a reason not to. Confirm.
