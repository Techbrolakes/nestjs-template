import { INestApplicationContext, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type Redis from "ioredis";
import type { Server, ServerOptions, Socket } from "socket.io";
import { REDIS_CLIENT } from "../../redis/redis.tokens";
import { AppConfig } from "../../config/app-config.service";

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private readonly config: AppConfig;
  private readonly jwt: JwtService;
  private readonly redis: Redis;
  private pubClient?: Redis;
  private subClient?: Redis;

  constructor(app: INestApplicationContext) {
    super(app);
    this.config = app.get(AppConfig);
    this.jwt = app.get(JwtService);
    this.redis = app.get<Redis>(REDIS_CLIENT);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.config.get("CORS_ORIGIN"),
        credentials: true,
      },
    });

    const pub = this.redis.duplicate();
    const sub = this.redis.duplicate();
    this.pubClient = pub;
    this.subClient = sub;
    pub.on("error", (err) =>
      this.logger.error({ err }, "socket.io redis pub error"),
    );
    sub.on("error", (err) =>
      this.logger.error({ err }, "socket.io redis sub error"),
    );
    server.adapter(createAdapter(pub, sub));

    server.use((socket, next) => {
      const token = this.extractToken(socket);
      if (!token) return next(new Error("UNAUTHORIZED"));
      this.jwt
        .verifyAsync<{ sub: string; email: string; role: string }>(token, {
          secret: this.config.get("JWT_SECRET"),
        })
        .then((payload) => {
          socket.data.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
          };
          next();
        })
        .catch((err) => {
          this.logger.debug(
            `ws handshake auth failed: ${(err as Error).message}`,
          );
          next(new Error("UNAUTHORIZED"));
        });
    });

    return server;
  }

  async close(server: Parameters<IoAdapter["close"]>[0]): Promise<void> {
    await super.close(server);
    await Promise.allSettled([this.pubClient?.quit(), this.subClient?.quit()]);
    this.pubClient = undefined;
    this.subClient = undefined;
  }

  private extractToken(socket: Socket): string | null {
    const header = socket.handshake.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice(7);
    }
    const auth = socket.handshake.auth?.token;
    return typeof auth === "string" ? auth : null;
  }
}
