import { randomUUID } from "node:crypto";

export interface UserPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export function makeUserPayload(
  overrides: Partial<UserPayload> = {},
): UserPayload {
  return {
    email: `${randomUUID()}@e2e.test`,
    password: "password1234567890",
    ...overrides,
  };
}
