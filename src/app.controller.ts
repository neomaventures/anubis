import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common"

@Controller()
export class AppController {
  @Get("status")
  @HttpCode(HttpStatus.NO_CONTENT)
  public status(): void {
    // Health check endpoint - replace with your own endpoints
  }
}
