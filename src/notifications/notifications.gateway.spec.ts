import type { Server, Socket } from "socket.io";
import { NotificationsGateway } from "./notifications.gateway";

function makeClient(overrides: Partial<Socket> = {}): Socket {
  return {
    id: "socket-1",
    data: {},
    join: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  } as unknown as Socket;
}

describe("NotificationsGateway", () => {
  let gateway: NotificationsGateway;

  beforeEach(() => {
    gateway = new NotificationsGateway();
  });

  describe("handleConnection", () => {
    it("joins the user's room when authenticated", async () => {
      const join = jest.fn();
      const client = makeClient({
        data: { user: { id: "u-42" } },
        join,
      } as Partial<Socket>);

      await gateway.handleConnection(client);

      expect(join).toHaveBeenCalledWith("user:u-42");
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it("disconnects when no user is on socket.data", async () => {
      const disconnect = jest.fn();
      const client = makeClient({ data: {}, disconnect } as Partial<Socket>);

      await gateway.handleConnection(client);

      expect(disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  describe("ping", () => {
    it("returns pong with the body echoed back", () => {
      const result = gateway.ping(makeClient(), { hello: "world" });
      expect(result).toEqual({ event: "pong", data: { hello: "world" } });
    });
  });

  describe("emitToUser", () => {
    it("emits to the user's scoped room", () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      gateway.server = { to } as unknown as Server;

      gateway.emitToUser("u-7", "new-message", { body: "hi" });

      expect(to).toHaveBeenCalledWith("user:u-7");
      expect(emit).toHaveBeenCalledWith("new-message", { body: "hi" });
    });
  });
});
