export abstract class WebhookHandler {
  abstract readonly provider: string;
  abstract handle(eventId: string, payload: unknown): Promise<void>;
}
