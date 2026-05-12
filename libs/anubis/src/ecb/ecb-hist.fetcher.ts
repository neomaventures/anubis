import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

/**
 * Fetches ECB historical exchange rate ZIP data from a URL.
 *
 * Supports two protocols:
 * - `https://` (or `http://`) — fetches via `globalThis.fetch`
 * - `file://` — reads from the local filesystem via `fs.readFile`
 *
 * The `file://` protocol is useful for testing or air-gapped environments
 * where the ECB endpoint is not reachable.
 *
 * @example
 * ```typescript
 * const fetcher = new EcbHistFetcher()
 * const buffer = await fetcher.fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip")
 * ```
 *
 * @example
 * ```typescript
 * const fetcher = new EcbHistFetcher()
 * const buffer = await fetcher.fetch("file:///path/to/eurofxref-hist.zip")
 * ```
 */
export class EcbHistFetcher {
  /**
   * Fetches the ZIP data from the given URL.
   *
   * @param url - The URL to fetch from (http://, https://, or file://)
   * @returns The raw ZIP file contents as a Buffer
   * @throws {Error} If the fetch fails or the protocol is unsupported
   */
  public async fetch(url: string): Promise<Buffer> {
    const parsed = new URL(url)

    switch (parsed.protocol) {
      case "file:": {
        const filePath = fileURLToPath(url)
        return readFile(filePath)
      }
      case "http:":
      case "https:": {
        const response = await globalThis.fetch(url)

        if (!response.ok) {
          throw new Error(
            `Failed to fetch rates: HTTP ${response.status} ${response.statusText}`,
          )
        }

        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }
      default:
        throw new Error(`Unsupported protocol: ${parsed.protocol}`)
    }
  }
}
