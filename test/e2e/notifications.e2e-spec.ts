import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createTestingApp } from "../helpers/create-testing-app";
import { registerUser } from "../helpers/auth.helpers";
import {
  connectSocket,
  listenOnRandomPort,
  type TestSocket,
} from "../helpers/ws.helpers";
import { NotificationsService } from "../../src/notifications/notifications.service";

describe("Notifications (e2e, full loop)", () => {
  let app: INestApplication;
  let port: number;
  let testSocket: TestSocket;

  beforeAll(async () => {
    app = await createTestingApp();
    port = await listenOnRandomPort(app);
  });

  afterAll(async () => {
    testSocket?.close();
    await app?.close();
  });

  it("HTTP-authenticated client receives WS event when a job is enqueued for its user", async () => {
    const session = await registerUser(app);

    // Decode the access token to get the userId (sub) without hitting /me.
    const jwt = app.get(JwtService);
    const payload = jwt.decode(session.accessToken) as { sub: string };
    const userId = payload.sub;

    testSocket = await connectSocket(port, session.accessToken);

    const received = testSocket.waitFor<{ hello: string }>("test-event");
    await app.get(NotificationsService).enqueue(userId, "test-event", {
      hello: "world",
    });

    await expect(received).resolves.toEqual({ hello: "world" });
  });

  it("rejects a socket connection with no token", async () => {
    await expect(connectSocket(port, "", 2000)).rejects.toBeDefined();
  });

  it("rejects a socket connection with an invalid token", async () => {
    await expect(
      connectSocket(port, "not-a-valid-jwt", 2000),
    ).rejects.toBeDefined();
  });
});
