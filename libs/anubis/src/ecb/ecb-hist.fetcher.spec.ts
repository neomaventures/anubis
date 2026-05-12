import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { EcbHistFetcher } from "./ecb-hist.fetcher"

const fixturePath = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "fixtures",
  "ecb",
  "eurofxref-hist.zip",
)
const fixtureUrl = pathToFileURL(fixturePath).href
const fixtureBuffer = readFileSync(fixturePath)

describe("EcbHistFetcher", () => {
  let fetcher: EcbHistFetcher

  beforeEach(() => {
    fetcher = new EcbHistFetcher()
  })

  describe("fetch()", () => {
    describe("Given a file:// URL", () => {
      it("should read the file from disk and return a Buffer", async () => {
        const result = await fetcher.fetch(fixtureUrl)

        expect(Buffer.isBuffer(result)).toBe(true)
        expect(result.length).toBe(fixtureBuffer.length)
      })

      it("should NOT call globalThis.fetch", async () => {
        const fetchSpy = jest.spyOn(globalThis, "fetch")

        await fetcher.fetch(fixtureUrl)

        expect(fetchSpy).not.toHaveBeenCalled()

        fetchSpy.mockRestore()
      })
    })

    describe("Given an https:// URL", () => {
      it("should fetch via globalThis.fetch and return a Buffer", async () => {
        const mockResponse = {
          ok: true,
          arrayBuffer: jest
            .fn()
            .mockResolvedValue(
              fixtureBuffer.buffer.slice(
                fixtureBuffer.byteOffset,
                fixtureBuffer.byteOffset + fixtureBuffer.byteLength,
              ),
            ),
        }
        const fetchSpy = jest
          .spyOn(globalThis, "fetch")
          .mockResolvedValue(mockResponse as unknown as Response)

        const result = await fetcher.fetch(
          "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip",
        )

        expect(Buffer.isBuffer(result)).toBe(true)
        expect(fetchSpy).toHaveBeenCalledWith(
          "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip",
        )

        fetchSpy.mockRestore()
      })

      it("should throw when the HTTP response is not ok", async () => {
        const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as unknown as Response)

        await expect(
          fetcher.fetch("https://example.com/rates.zip"),
        ).rejects.toThrow(
          "Failed to fetch rates: HTTP 500 Internal Server Error",
        )

        fetchSpy.mockRestore()
      })
    })

    describe("Given an unsupported protocol", () => {
      it("should throw an error", async () => {
        await expect(
          fetcher.fetch("ftp://example.com/rates.zip"),
        ).rejects.toThrow("Unsupported protocol: ftp:")
      })
    })
  })
})
