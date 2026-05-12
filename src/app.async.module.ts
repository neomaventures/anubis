import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { AnubisModule } from "@lib"

import { AppController } from "./app.controller"
import { ExchangeRate } from "./exchange-rate.entity"

const fixtureZip = pathToFileURL(
  resolve(__dirname, "..", "fixtures", "ecb", "eurofxref-hist.zip"),
).href

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: ":memory:",
      entities: [ExchangeRate],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([ExchangeRate]),
    AnubisModule.forRootAsync({
      useFactory: () => ({
        ratesUrl: fixtureZip,
        entity: ExchangeRate,
      }),
    }),
  ],
  controllers: [AppController],
})
export class AsyncAppModule {}
