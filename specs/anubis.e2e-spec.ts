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
  describe(`AnubisModule (${name})`, () => {
    let app: Awaited<ReturnType<typeof managedAppInstance>>

    beforeEach(async () => {
      app = await managedAppInstance(modulePath)
    })

    describe("When the module boots with a valid file:// ratesUrl", () => {
      it("should sync exchange rates into the database", async () => {
        const refresh = app.get(RefreshService)
        await waitForInitialised(refresh)

        expect(refresh.initialised).toBe(true)

        const dataSource = app.get(DataSource)
        const repo = dataSource.getRepository("ExchangeRate")
        const rows = await repo.find()

        // 5 dates x 4 currencies = 20 rows
        expect(rows).toHaveLength(20)
      })

      it("should store correct rate data", async () => {
        const refresh = app.get(RefreshService)
        await waitForInitialised(refresh)

        const dataSource = app.get(DataSource)
        const repo = dataSource.getRepository("ExchangeRate")
        const row = await repo.findOneBy({
          date: "2024-11-08",
          currency: "USD",
        })

        expect(row).toMatchObject({
          date: "2024-11-08",
          currency: "USD",
          rate: "1.0801",
        })
      })
    })
  })
})
