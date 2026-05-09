import { DataSource } from "typeorm"

/**
 * Create a new datasource for testing that uses an in-memory SQLite database.
 *
 * @returns  An initialized datasource.
 */
export const datasource = async (): Promise<DataSource> => {
  const dataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    entities: ["src/**/*.entity.ts"],
    synchronize: true,
  })
  return dataSource.initialize()
}

let datasourceInstance: DataSource
beforeEach(async () => {
  datasourceInstance = await datasource()
})

afterEach(async () => {
  await datasourceInstance.destroy()
})

/**
 * Convenience function to get the Datasource instance for testing.
 *
 * Note: The datasource instance's lifecycle is managed by beforeEach and
 * afterEach hooks that are automatically added to Jest when this module is
 * imported.
 *
 * @returns A ephemeral DataSource instance for any tests that require a database.
 */
export const managedDatasourceInstance = (): DataSource => datasourceInstance
