import { WebhookEvent } from "./webhook-event.entity";

export abstract class WebhookEventRepository {
  /**
   * Inserts a ledger row. Returns null if a row for (provider, eventId) already exists
   * (duplicate webhook — caller should ack without reprocessing).
   */
  abstract record(
    provider: string,
    eventId: string,
  ): Promise<WebhookEvent | null>;

  abstract markProcessed(id: string): Promise<void>;
}
