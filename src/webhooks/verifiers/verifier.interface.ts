import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";

export interface VerifiedWebhook<T = unknown> {
  eventId: string;
  payload: T;
}

export abstract class WebhookVerifier {
  /** Machine-readable provider name used in URL path and DB. */
  abstract readonly provider: string;

  /**
   * Verify the signature against the raw body and parse the JSON payload.
   * Throws InvalidWebhookSignatureError / WebhookProviderNotConfiguredError on failure.
   */
  abstract verify(req: RawBodyRequest<Request>): VerifiedWebhook;
}
