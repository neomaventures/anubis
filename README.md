# @neoma/anubis

NestJS module for historical currency conversion using ECB reference rates (1999-present).

## Overview

`@neoma/anubis` answers a single question: *"roughly, what was X in currency A worth in currency B on date D?"* It pulls free European Central Bank (ECB) reference-rate data, persists it via a consumer-supplied TypeORM entity, and exposes a `CurrencyConversionService.convert()` method that returns an amount along with the rate, the requested date, and the source date the rate actually came from.

This package is **for rough historical estimates only** -- analytics dashboards, "what did this expense cost in my reporting currency?", lifetime-value reporting across currencies, etc. It is **not** for transactional FX, settlement, billing, or anything where precision, mid/bid/ask spreads, or intraday timing matter.

## Installation

```bash
npm install @neoma/anubis
```

### Peer dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/typeorm @nestjs/schedule @nestjs/event-emitter typeorm reflect-metadata rxjs
```

## Usage

### 1. Create your entity

```typescript
import { Entity, PrimaryColumn, Column } from "typeorm"
import { CurrencyRate } from "@neoma/anubis"

@Entity()
export class ExchangeRate implements CurrencyRate {
  @PrimaryColumn({ type: "date" })
  public date!: string

  @PrimaryColumn({ length: 3 })
  public currency!: string

  @Column("numeric", { precision: 18, scale: 8 })
  public rate!: string
}
```

### 2. Register the module

```typescript
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AnubisModule } from "@neoma/anubis"
import { ExchangeRate } from "./entities/exchange-rate.entity"

@Module({
  imports: [
    TypeOrmModule.forRoot({ /* ... */ }),
    TypeOrmModule.forFeature([ExchangeRate]),
    AnubisModule.forRoot({
      ratesEntity: ExchangeRate,
    }),
  ],
})
export class AppModule {}
```

Or with async configuration:

```typescript
AnubisModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    ratesEntity: ExchangeRate,
    ratesUrl: config.get<string>("ANUBIS_RATES_URL"),
  }),
})
```

### 3. Inject and convert

```typescript
import { Injectable } from "@nestjs/common"
import { CurrencyConversionService } from "@neoma/anubis"

@Injectable()
export class ReportingService {
  public constructor(
    private readonly currency: CurrencyConversionService,
  ) {}

  public async convertToEur(amount: string, from: string, date: Date) {
    return this.currency.convert({ amount, from, to: "EUR", date })
  }
}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ratesEntity` | `class` | *required* | TypeORM entity implementing `CurrencyRate` |
| `ratesUrl` | `string` | ECB hist zip URL | URL to the ECB `eurofxref-hist.zip`. Supports `https://` and `file://` |

## Behaviour

- **On boot:** fetches the full ECB historical dataset and upserts into the consumer's entity table
- **Daily at 04:05 UTC:** re-fetches and upserts idempotently via `@nestjs/schedule`
- **Failure handling:** refresh failures emit `CurrencyRefreshFailedEvent` (subscribe via `@OnEvent`). The app never crashes on refresh failure
- **`file://` URLs:** for tests or air-gapped deployments, point `ratesUrl` at a local zip. Missing files fail app start immediately
- **Global module:** registered once, injectable anywhere

## Development

```bash
npm test          # Unit tests (watch mode)
npm run test:e2e  # E2E tests (watch mode)
npm run build     # Build the library
npm run lint      # Lint
```

## License

MIT
