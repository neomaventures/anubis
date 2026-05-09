import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { ExampleModule } from "@lib"

import { AppController } from "./app.controller"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: ":memory:",
      entities: ["src/**/*.entity.ts"],
      synchronize: true,
    }),
    ExampleModule,
    // Add additional package modules here for E2E testing
    // Example: YourPackageModule.forRoot(),
  ],
  controllers: [AppController],
})
export class AppModule {}
