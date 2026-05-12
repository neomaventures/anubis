# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `AnubisModule` with `forRoot` and `forRootAsync` via `ConfigurableModuleBuilder`
- `RefreshService` fetches ECB historical exchange rate ZIP, parses CSV, and upserts rows on boot
- `CurrencyConversionService` skeleton (throws "not yet implemented")
- `EcbHistFetcher` supports both `https://` and `file://` protocols
- `EcbHistParser` unzips ECB archive and transforms wide CSV to long-format rows
- Daily cron refresh at 04:05 UTC via `@nestjs/schedule`
- `CurrencyRefreshFailedEvent` emitted on refresh failure with error, URL, and latest rate date
- Synchronous existence check for `file://` ratesUrl — missing file fails app start with clear error
- `CurrencyRate` interface for consumer entities
