/**
 * Injection token for AnubisModule configuration options.
 */
export const ANUBIS_OPTIONS = Symbol("ANUBIS_OPTIONS")

/**
 * Default URL for the ECB historical exchange rate data.
 */
export const DEFAULT_RATES_URL =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip"

/**
 * Interface that the consumer's entity must implement to store exchange rates.
 *
 * All fields are strings to preserve decimal precision and date formatting
 * as provided by the ECB data source.
 */
export interface CurrencyRate {
  /** ISO date string (YYYY-MM-DD) */
  date: string
  /** ISO 4217 currency code (e.g. "USD", "GBP") */
  currency: string
  /** Exchange rate relative to EUR as a decimal string */
  rate: string
}

/**
 * Configuration options for the Anubis currency conversion module.
 *
 * @example
 * ```typescript
 * AnubisModule.forRoot({
 *   ratesUrl: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip',
 *   entity: ExchangeRate,
 * })
 * ```
 */
export interface AnubisOptions {
  /**
   * URL to fetch the ECB historical exchange rate ZIP file from.
   *
   * Supports both `https://` and `file://` protocols. The `file://` protocol
   * reads the ZIP directly from the local filesystem, which is useful for
   * testing or air-gapped environments.
   *
   * @default DEFAULT_RATES_URL
   */
  ratesUrl?: string

  /**
   * The TypeORM entity class that implements {@link CurrencyRate}.
   *
   * This entity must have `date` and `currency` columns suitable for
   * use as a composite unique key (for upsert operations).
   */
  entity: new () => CurrencyRate
}
