import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AppConfig } from "../config/app-config.service";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        const url = new URL(config.get("REDIS_URL"));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
            username: url.username || undefined,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: "notifications" }, { name: "email" }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
