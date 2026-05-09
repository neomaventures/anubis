import { managedAppInstance } from "@neoma/managed-app"
import { HttpStatus } from "@nestjs/common"
import request from "supertest"

describe("AppController (e2e)", () => {
  it(`/status (GET) - responds with a HTTP ${HttpStatus.NO_CONTENT}`, async () => {
    const app = await managedAppInstance()
    return request(app.getHttpServer())
      .get("/status")
      .expect(HttpStatus.NO_CONTENT)
  })
})
