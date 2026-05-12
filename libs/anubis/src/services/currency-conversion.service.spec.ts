import { CurrencyConversionService } from "./currency-conversion.service"

describe("CurrencyConversionService", () => {
  let service: CurrencyConversionService

  beforeEach(() => {
    service = new CurrencyConversionService()
  })

  describe("convert()", () => {
    it("should reject with not yet implemented", async () => {
      await expect(
        service.convert({
          amount: "100",
          from: "USD",
          to: "GBP",
          date: "2024-11-08",
        }),
      ).rejects.toThrow("not yet implemented")
    })
  })
})
