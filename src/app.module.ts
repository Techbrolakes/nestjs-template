import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import configuration from "./config/configuration";
import { validateEnv } from "./config/validation.schema";
import { AppConfig, AppConfigModule } from "./config/app-config.service";
import { RedisModule } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { HealthModule } from "./health/health.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        const isDev = config.get("NODE_ENV") === "development";
        return {
          pinoHttp: {
            level: config.get("LOG_LEVEL"),
            genReqId: (req) =>
              (req.headers["x-request-id"] as string) ?? randomUUID(),
            transport: isDev
              ? {
                  target: "pino-pretty",
                  options: { singleLine: true, translateTime: "SYS:HH:MM:ss" },
                }
              : undefined,
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                'req.headers["x-api-key"]',
                "*.password",
                "*.passwordHash",
                "*.refreshToken",
                "*.refreshTokenHash",
              ],
              remove: true,
            },
            autoLogging: {
              ignore: (req) =>
                req.url === "/health" ||
                req.url === "/ready" ||
                req.url === "/api/v1/health" ||
                req.url === "/api/v1/ready",
            },
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res) => ({ statusCode: res.statusCode }),
            },
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        const env = config.get("NODE_ENV");
        return {
          type: "postgres",
          url: config.get("DATABASE_URL"),
          autoLoadEntities: true,
          synchronize: env === "test",
          logging: env === "development",
          migrations: [__dirname + "/migrations/*.{ts,js}"],
          migrationsTableName: "migrations",
          migrationsRun: false,
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    EventEmitterModule.forRoot({ wildcard: true }),
    RedisModule,
    QueueModule,
    AuthModule,
    UsersModule,
    NotificationsModule,
    WebhooksModule.forRoot(),
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
