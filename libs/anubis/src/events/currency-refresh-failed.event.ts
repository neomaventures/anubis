/**
 * Event emitted when a currency refresh operation fails.
 *
 * Consumers can listen for this event to implement alerting, fallback
 * logic, or retry strategies.
 *
 * @example
 * ```typescript
 * @OnEvent(ANUBIS_REFRESH_FAILED_EVENT)
 * handleRefreshFailed(event: CurrencyRefreshFailedEvent): void {
 *   console.error(`Refresh failed: ${event.error.message}`)
 *   console.log(`Latest rate date: ${event.latestRateDate}`)
 * }
 * ```
 */
export class CurrencyRefreshFailedEvent {
  /**
   * @param error - The error that caused the refresh to fail
   * @param url - The URL that was being fetched when the failure occurred
   * @param latestRateDate - The most recent rate date in the DB, or null if the DB is empty
   */
  public constructor(
    public readonly error: Error,
    public readonly url: string,
    public readonly latestRateDate: Date | null,
  ) {}
}
