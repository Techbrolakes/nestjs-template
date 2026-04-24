import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleDestroy } from "@nestjs/common";
import type { Job } from "bullmq";
import { NotificationsGateway } from "./notifications.gateway";
import { notifyJobSchema, type NotifyJob } from "./notifications.schema";

@Processor("notifications")
export class NotificationsProcessor
  extends WorkerHost
  implements OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly gateway: NotificationsGateway) {
    super();
  }

  async process(job: Job<NotifyJob>) {
    const data = notifyJobSchema.parse(job.data);
    this.gateway.emitToUser(data.userId, data.event, data.payload);
    this.logger.log(`Delivered '${data.event}' to user ${data.userId}`);
    return { delivered: true, at: new Date().toISOString() };
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
