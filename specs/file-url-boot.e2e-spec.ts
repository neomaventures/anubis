import { managedAppInstance } from "@neoma/managed-app"
import { DataSource } from "typeorm"

import { RefreshService } from "@lib"

const appModules: [string, string][] = [
  ["forRoot", "src/app.module.ts#AppModule"],
  ["forRootAsync", "src/app.async.module.ts#AsyncAppModule"],
]

/**
 * Polls the RefreshService until it reports initialised, or times out.
 */
const waitForInitialised = async (
  refresh: RefreshService,
  timeoutMs = 5000,
  intervalMs = 50,
): Promise<void> => {
  const start = Date.now()
  while (!refresh.initialised) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("RefreshService did not initialise within timeout")
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

appModules.forEach(([name, modulePath]) => {
  describe(`file:// ratesUrl boot (${name})`, () => {
    let app: Awaited<ReturnType<typeof managedAppInstance>>

    beforeEach(async () => {
      app = await managedAppInstance(modulePath)
    })

    describe("When the module boots with a file:// ratesUrl", () => {
      it("should populate the database with exchange rates", async () => {
        const refresh = app.get(RefreshService)
        await waitForInitialised(refresh)

        const dataSource = app.get(DataSource)
        const repo = dataSource.getRepository("ExchangeRate")
        const count = await repo.count()

        // 5 dates x 4 currencies = 20 rows
        expect(count).toBe(20)
      })

      it("should store rates with correct structure", async () => {
        const refresh = app.get(RefreshService)
        await waitForInitialised(refresh)

        const dataSource = app.get(DataSource)
        const repo = dataSource.getRepository("ExchangeRate")
        const row = await repo.findOneBy({
          date: "2024-11-04",
          currency: "GBP",
        })

        expect(row).toMatchObject({
          date: "2024-11-04",
          currency: "GBP",
          rate: "0.8344",
        })
      })
    })
  })
})
