import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";
import { RedisService } from "./redis.service";
import { AppConfig } from "../config/app-config.service";
import { REDIS_CLIENT } from "./redis.tokens";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [AppConfig],
      useFactory: (config: AppConfig) =>
        new Redis(config.get("REDIS_URL"), {
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
        }),
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
