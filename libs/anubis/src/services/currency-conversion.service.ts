import { Injectable } from "@nestjs/common"

/**
 * Service for converting between currencies using historical ECB exchange rates.
 *
 * @example
 * ```typescript
 * const result = await conversionService.convert({
 *   amount: "100.00",
 *   from: "USD",
 *   to: "GBP",
 *   date: "2024-11-08",
 * })
 * ```
 */
@Injectable()
export class CurrencyConversionService {
  /**
   * Converts an amount from one currency to another using historical rates.
   *
   * @param _params - The conversion parameters
   * @returns The converted amount
   * @throws {Error} Always throws — not yet implemented
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async convert(params: {
    amount: string
    from: string
    to: string
    date: string
  }): Promise<string> {
    throw new Error("not yet implemented")
  }
}
