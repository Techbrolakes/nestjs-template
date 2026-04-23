import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { makeUserPayload, type UserPayload } from "./fixtures/user.fixture";

export interface AuthenticatedSession {
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(
  app: INestApplication,
  overrides: Partial<UserPayload> = {},
): Promise<AuthenticatedSession> {
  const payload = makeUserPayload(overrides);
  const res = await request(app.getHttpServer())
    .post("/api/v1/auth/register")
    .send(payload)
    .expect(201);

  return {
    email: payload.email,
    password: payload.password,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
  };
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request(app.getHttpServer())
    .post("/api/v1/auth/login")
    .send({ email, password })
    .expect(200);
  return res.body;
}

export function bearer(token: string): [string, string] {
  return ["Authorization", `Bearer ${token}`];
}
