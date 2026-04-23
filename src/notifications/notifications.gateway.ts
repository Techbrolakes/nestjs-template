import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Logger, UsePipes } from "@nestjs/common";
import type { Server, Socket } from "socket.io";
import { WsZodValidationPipe } from "../common/pipes/ws-zod-validation.pipe";
import { pingEventSchema } from "./notifications.schema";

@WebSocketGateway()
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer() server!: Server;

  afterInit(_server: Server) {
    this.logger.log("notifications gateway initialized");
  }

  async handleConnection(client: Socket) {
    const userId = client.data.user?.id;
    if (!userId) {
      client.disconnect();
      return;
    }
    await client.join(`user:${userId}`);
    this.logger.log(`client connected: ${client.id} (user ${userId})`);
  }

  handleDisconnect(client: Socket) {
    const reason = (client as unknown as { disconnectReason?: string })
      .disconnectReason;
    this.logger.log(
      `client disconnected: ${client.id}${reason ? ` (${reason})` : ""}`,
    );
  }

  @SubscribeMessage("ping")
  @UsePipes(new WsZodValidationPipe(pingEventSchema))
  ping(@ConnectedSocket() _client: Socket, @MessageBody() body: unknown) {
    return { event: "pong", data: body };
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
