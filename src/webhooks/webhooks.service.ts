import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { WebhookVerifier } from "./verifiers/verifier.interface";
import { WebhookEventRepository } from "./webhook-event.repository";
import { UnknownWebhookProviderError } from "./errors/webhooks.errors";
import { webhookJobSchema, type WebhookJob } from "./webhooks.schema";
import { WEBHOOK_VERIFIERS } from "./webhooks.tokens";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly verifiers = new Map<string, WebhookVerifier>();

  constructor(
    @Inject(WEBHOOK_VERIFIERS) verifiers: WebhookVerifier[],
    private readonly events: WebhookEventRepository,
    @InjectQueue("webhooks") private readonly queue: Queue<WebhookJob>,
  ) {
    for (const v of verifiers) this.verifiers.set(v.provider, v);
  }

  async handle(
    provider: string,
    req: RawBodyRequest<Request>,
  ): Promise<{ duplicate: boolean }> {
    const verifier = this.verifiers.get(provider);
    if (!verifier) throw new UnknownWebhookProviderError(provider);

    const { eventId, payload } = verifier.verify(req);

    const ledger = await this.events.record(provider, eventId);
    if (ledger === null) {
      this.logger.debug(
        { provider, eventId },
        "duplicate webhook; skipping enqueue",
      );
      return { duplicate: true };
    }

    const data = webhookJobSchema.parse({
      ledgerId: ledger.id,
      provider,
      eventId,
      payload,
    });

    await this.queue.add("process", data, {
      attempts: 5,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: 1_000,
      removeOnFail: false,
    });

    return { duplicate: false };
  }
}
