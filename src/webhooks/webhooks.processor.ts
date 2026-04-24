import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger, OnModuleDestroy } from "@nestjs/common";
import type { Job } from "bullmq";
import { WebhookHandler } from "./handlers/handler.interface";
import { WebhookEventRepository } from "./webhook-event.repository";
import { webhookJobSchema, type WebhookJob } from "./webhooks.schema";
import { WEBHOOK_HANDLERS } from "./webhooks.tokens";

@Processor("webhooks")
export class WebhooksProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(WebhooksProcessor.name);
  private readonly handlers = new Map<string, WebhookHandler>();

  constructor(
    @Inject(WEBHOOK_HANDLERS) handlers: WebhookHandler[],
    private readonly events: WebhookEventRepository,
  ) {
    super();
    for (const h of handlers) this.handlers.set(h.provider, h);
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  async process(job: Job<WebhookJob>) {
    const data = webhookJobSchema.parse(job.data);
    const handler = this.handlers.get(data.provider);
    if (!handler) {
      this.logger.warn(
        { provider: data.provider, eventId: data.eventId },
        "no handler registered; dropping webhook job",
      );
      return { handled: false };
    }

    await handler.handle(data.eventId, data.payload);
    await this.events.markProcessed(data.ledgerId);
    return { handled: true };
  }
}
