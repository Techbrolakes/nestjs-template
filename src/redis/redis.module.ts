import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
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
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    if (this.redis.status !== "end") {
      await this.redis.quit().catch(() => this.redis.disconnect());
    }
  }
}
