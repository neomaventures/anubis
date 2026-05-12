import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import AdmZip from "adm-zip"

import { EcbHistParser } from "./ecb-hist.parser"

const fixtureZip = readFileSync(
  resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "fixtures",
    "ecb",
    "eurofxref-hist.zip",
  ),
)

describe("EcbHistParser", () => {
  let parser: EcbHistParser

  beforeEach(() => {
    parser = new EcbHistParser()
  })

  describe("parse()", () => {
    describe("Given a valid ZIP with ECB CSV data", () => {
      it("should return rows in long format with date, currency, and rate", () => {
        const rows = parser.parse(fixtureZip)

        expect(rows.length).toBe(20) // 5 dates x 4 currencies

        expect(rows[0]).toMatchObject({
          date: "2024-11-08",
          currency: "USD",
          rate: "1.0801",
        })
      })

      it("should include all currencies from the header", () => {
        const rows = parser.parse(fixtureZip)
        const currencies = [...new Set(rows.map((r) => r.currency))]

        expect(currencies).toEqual(
          expect.arrayContaining(["USD", "GBP", "JPY", "AUD"]),
        )
        expect(currencies).toHaveLength(4)
      })

      it("should include all dates from the data", () => {
        const rows = parser.parse(fixtureZip)
        const dates = [...new Set(rows.map((r) => r.date))]

        expect(dates).toHaveLength(5)
        expect(dates).toEqual(
          expect.arrayContaining([
            "2024-11-08",
            "2024-11-07",
            "2024-11-06",
            "2024-11-05",
            "2024-11-04",
          ]),
        )
      })
    })

    describe("Given a ZIP without a CSV file", () => {
      it("should throw an error", () => {
        const zip = new AdmZip()
        zip.addFile("readme.txt", Buffer.from("not a csv"))
        const buffer: Buffer = zip.toBuffer()

        expect(() => parser.parse(buffer)).toThrow(
          "No CSV file found in ZIP archive",
        )
      })
    })
  })
})
