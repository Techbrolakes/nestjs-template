import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestingApp } from "../helpers/create-testing-app";

describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /api/v1/health returns a status", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/health");
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("status");
  });
});
