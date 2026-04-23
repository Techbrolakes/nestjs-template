import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { notifyJobSchema, type NotifyJob } from "./notifications.schema";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue("notifications") private readonly queue: Queue<NotifyJob>,
  ) {}

  enqueue(userId: string, event: string, payload: unknown) {
    const data = notifyJobSchema.parse({ userId, event, payload });
    return this.queue.add("notify", data, {
      attempts: 5,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: 1_000,
      removeOnFail: false,
    });
  }
}
