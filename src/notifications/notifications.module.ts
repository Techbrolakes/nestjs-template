import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [BullModule.registerQueue({ name: "notifications" })],
  providers: [
    NotificationsGateway,
    NotificationsProcessor,
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
