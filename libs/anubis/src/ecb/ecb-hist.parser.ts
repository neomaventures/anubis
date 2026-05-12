import AdmZip from "adm-zip"

/**
 * A single row of parsed ECB historical exchange rate data,
 * transformed from wide (one column per currency) to long format.
 */
export interface EcbHistRow {
  /** ISO date string (YYYY-MM-DD) */
  date: string
  /** ISO 4217 currency code */
  currency: string
  /** Exchange rate as a decimal string */
  rate: string
}

/**
 * Parses ECB historical exchange rate ZIP files into long-format rows.
 *
 * The ECB distributes rates in a wide CSV format (one column per currency)
 * inside a ZIP archive. This parser unzips the archive, reads the CSV,
 * and transforms it into individual date/currency/rate rows, skipping
 * any cells that are empty or contain "N/A".
 *
 * @example
 * ```typescript
 * const parser = new EcbHistParser()
 * const rows = parser.parse(zipBuffer)
 * // [{ date: "2024-11-08", currency: "USD", rate: "1.0801" }, ...]
 * ```
 */
export class EcbHistParser {
  /**
   * Parses a ZIP buffer containing ECB historical CSV data.
   *
   * @param buffer - The raw ZIP file contents
   * @returns An array of exchange rate rows in long format
   */
  public parse(buffer: Buffer): EcbHistRow[] {
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()
    const csvEntry = entries.find((e) => e.entryName.endsWith(".csv"))

    if (!csvEntry) {
      throw new Error("No CSV file found in ZIP archive")
    }

    const csv = csvEntry.getData().toString("utf-8")
    return this.parseCsv(csv)
  }

  private parseCsv(csv: string): EcbHistRow[] {
    const lines = csv
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length < 2) {
      return []
    }

    const headerLine = lines[0]
    const currencies = headerLine
      .split(",")
      .slice(1)
      .map((h) => h.trim())
      .filter((h) => h.length > 0)

    const rows: EcbHistRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(",").map((c) => c.trim())
      const date = columns[0]

      if (!date) continue

      for (let j = 0; j < currencies.length; j++) {
        const rate = columns[j + 1]?.trim()

        if (!rate || rate === "N/A" || rate === "") continue

        rows.push({
          date,
          currency: currencies[j],
          rate,
        })
      }
    }

    return rows
  }
}
