import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestingApp } from "../helpers/create-testing-app";
import { registerUser } from "../helpers/auth.helpers";
import { makeUserPayload } from "../helpers/fixtures/user.fixture";

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe("POST /api/v1/auth/register", () => {
    it("rejects an invalid payload with structured error", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "not-an-email", password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
          path: "/api/v1/auth/register",
          timestamp: expect.any(String),
        }),
      );
    });

    it("creates a user and returns access + refresh tokens", async () => {
      const payload = makeUserPayload();
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send(payload)
        .expect(201);

      expect(res.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it("returns AUTH_EMAIL_TAKEN on duplicate email", async () => {
      const { email, password } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email, password });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        code: "AUTH_EMAIL_TAKEN",
        details: { email },
      });
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("returns tokens on valid credentials", async () => {
      const session = await registerUser(app);

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: session.email, password: session.password })
        .expect(200);

      expect(res.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it("returns AUTH_INVALID_CREDENTIALS on wrong password", async () => {
      const { email } = await registerUser(app);

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email, password: "definitely-wrong-xxxxxxx" });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ code: "AUTH_INVALID_CREDENTIALS" });
    });
  });
});
