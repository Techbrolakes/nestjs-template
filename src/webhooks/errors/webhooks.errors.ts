import {
  BadRequestDomainException,
  NotFoundDomainException,
  UnauthorizedDomainException,
} from "../../common/errors/domain.exception";

export class UnknownWebhookProviderError extends NotFoundDomainException {
  constructor(provider: string) {
    super("WEBHOOK_UNKNOWN_PROVIDER", "Unknown webhook provider", { provider });
  }
}

export class WebhookProviderNotConfiguredError extends BadRequestDomainException {
  constructor(provider: string) {
    super(
      "WEBHOOK_PROVIDER_NOT_CONFIGURED",
      "Webhook provider is not configured on this server",
      { provider },
    );
  }
}

export class InvalidWebhookSignatureError extends UnauthorizedDomainException {
  constructor(provider: string) {
    super("WEBHOOK_INVALID_SIGNATURE", "Invalid webhook signature", {
      provider,
    });
  }
}

export class MalformedWebhookPayloadError extends BadRequestDomainException {
  constructor(provider: string, issues: unknown) {
    super("WEBHOOK_MALFORMED_PAYLOAD", "Malformed webhook payload", {
      provider,
      issues,
    });
  }
}
