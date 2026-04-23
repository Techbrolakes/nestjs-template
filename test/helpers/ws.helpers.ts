import type { INestApplication } from "@nestjs/common";
import { io, type Socket } from "socket.io-client";
import type { AddressInfo } from "node:net";

export interface TestSocket {
  socket: Socket;
  waitFor<T = unknown>(event: string, timeoutMs?: number): Promise<T>;
  close(): void;
}

export async function listenOnRandomPort(
  app: INestApplication,
): Promise<number> {
  await app.listen(0);
  const address = app.getHttpServer().address() as AddressInfo | null;
  if (!address || typeof address === "string") {
    throw new Error("app.listen did not return an address");
  }
  return address.port;
}

export async function connectSocket(
  port: number,
  token: string,
  timeoutMs = 5000,
): Promise<TestSocket> {
  const socket = io(`http://localhost:${port}`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
    forceNew: true,
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`socket did not connect within ${timeoutMs}ms`)),
      timeoutMs,
    );
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  return {
    socket,
    waitFor: <T>(event: string, eventTimeoutMs = 3000) =>
      new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`timeout waiting for '${event}'`)),
          eventTimeoutMs,
        );
        socket.once(event, (payload: T) => {
          clearTimeout(timer);
          resolve(payload);
        });
      }),
    close: () => {
      socket.removeAllListeners();
      socket.close();
    },
  };
}
