---
name: add-webhook-provider
description: Use when the user asks to add a webhook provider (Stripe, Paystack, Cloudinary, GitHub, Shopify, Twilio, or any inbound HTTP callback with HMAC signatures). The template ships with the webhooks scaffold but NO concrete providers — every project adds its own.
---

# Adding a webhook provider

The template's `src/webhooks/` folder is pure scaffold. Every fork adds the providers it actually uses. This skill walks through adding one.

## The three pieces every provider needs

1. **A Zod schema** for the event body (source of truth for the payload shape).
2. **A `WebhookVerifier`** that validates the signature on the raw body and extracts an event ID.
3. **A `WebhookHandler`** that processes the parsed event asynchronously.

Then register both in `WebhooksModule.forRoot({...})` in `app.module.ts`.

## Steps

### 1. Add provider secret(s) to the env schema

Edit `src/config/validation.schema.ts`:

```ts
<PROVIDER>_WEBHOOK_SECRET: z.string().optional(),   // optional so forks that don't use it still boot
```

### 2. Create the event schema

`src/webhooks/schemas/<provider>.schema.ts`:

```ts
import { z } from "zod";

export const <provider>EventSchema = z
  .object({
    // minimum fields you need to correlate + dispatch:
    //   - something that identifies the event (unique id)
    //   - something that identifies the event type
  })
  .passthrough();  // providers evolve; don't reject unknown fields

export type <Provider>Event = z.infer<typeof <provider>EventSchema>;
```

### 3. Implement the verifier

`src/webhooks/verifiers/<provider>.verifier.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { AppConfig } from "../../config/app-config.service";
import {
  InvalidWebhookSignatureError,
  MalformedWebhookPayloadError,
  WebhookProviderNotConfiguredError,
} from "../errors/webhooks.errors";
import { <provider>EventSchema, type <Provider>Event } from "../schemas/<provider>.schema";
import { WebhookVerifier, type VerifiedWebhook } from "./verifier.interface";

@Injectable()
export class <Provider>Verifier extends WebhookVerifier {
  readonly provider = "<provider>";

  constructor(private readonly config: AppConfig) { super(); }

  verify(req: RawBodyRequest<Request>): VerifiedWebhook<<Provider>Event> {
    const secret = this.config.get("<PROVIDER>_WEBHOOK_SECRET");
    if (!secret) throw new WebhookProviderNotConfiguredError(this.provider);

    const signature = /* read the right header(s) for this provider */;
    if (!signature || !req.rawBody) throw new InvalidWebhookSignatureError(this.provider);

    // Do the math THIS provider specifies. Examples:
    //   Stripe:     hmac_sha256(timestamp + "." + body, secret), compared to `t=...,v1=...`
    //   Paystack:   hmac_sha512(body, secret), compared to x-paystack-signature
    //   Cloudinary: sha1(body + timestamp + secret) (not HMAC)
    const expected = createHmac("sha256", secret).update(req.rawBody).digest("hex");
    if (!this.safeEqual(signature, expected)) {
      throw new InvalidWebhookSignatureError(this.provider);
    }

    const parsed = <provider>EventSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new MalformedWebhookPayloadError(this.provider, parsed.error.issues);
    }

    return {
      eventId: /* extract a provider-stable unique id from parsed.data */,
      payload: parsed.data,
    };
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  }
}
```

**Verifier rules (non-negotiable):**

- Use `timingSafeEqual` for signature comparison. Never `===`.
- Require the correct secret env var. If it's missing, throw `WebhookProviderNotConfiguredError` — don't silently accept.
- Verify timestamp-based signatures against a freshness window (typically 5 minutes) to prevent replay.
- Parse the body with Zod AFTER verifying — malformed bodies from authenticated senders are still rejections, not crashes.
- Extract an `eventId` that's unique and stable per-event (not per-delivery). Providers usually give you one; if not, construct one from `{type}:{object_id}:{timestamp}`.

### 4. Implement the handler

`src/webhooks/handlers/<provider>.handler.ts`:

```ts
import { Injectable, Logger } from "@nestjs/common";
import { <provider>EventSchema, type <Provider>Event } from "../schemas/<provider>.schema";
import { WebhookHandler } from "./handler.interface";

@Injectable()
export class <Provider>Handler extends WebhookHandler {
  readonly provider = "<provider>";
  private readonly logger = new Logger(<Provider>Handler.name);

  async handle(eventId: string, payload: unknown): Promise<void> {
    const event: <Provider>Event = <provider>EventSchema.parse(payload);
    // Switch on event type and do the work:
    //   case "charge.success":    await this.billing.markPaid(...)
    //   case "subscription.canceled":  await this.billing.downgrade(...)
  }
}
```

**Handler rules:**

- Parse the payload again (producer and consumer may be deployed at different times).
- Keep it idempotent where possible — the ledger prevents re-enqueue, but retries inside the handler still happen.
- Side effects that can't be reversed (charges, emails) should either be idempotent on their own (Stripe API keys etc.) or check a local `processed_at` before running.

### 5. Register in the module

`src/app.module.ts`:

```ts
WebhooksModule.forRoot({
  verifiers: [<Provider>Verifier /*, ...others */],
  handlers: [<Provider>Handler /*, ...others */],
}),
```

### 6. Verify

`pnpm build && pnpm test && pnpm lint`.

Then test with a real payload using the provider's test dashboard (Stripe CLI, Paystack test mode, etc.).

## What NOT to do

- Do NOT process inline in the controller. The service enqueues to BullMQ; the processor handles side effects. Webhook senders expect a sub-second 200.
- Do NOT skip the idempotency ledger. Providers retry. Charging twice is a support ticket.
- Do NOT log the raw body at info/log level — it often contains PII. Use `debug` if you must, or redact in pino's config.
- Do NOT bypass `timingSafeEqual`. `===` leaks signature bytes to timing attackers.
- Do NOT use the same endpoint for multiple providers. Each provider is a separate `:provider` path param — `/webhooks/stripe`, `/webhooks/paystack`, etc.

## Reference files in the template

- Verifier interface: `src/webhooks/verifiers/verifier.interface.ts`
- Handler interface: `src/webhooks/handlers/handler.interface.ts`
- Error types: `src/webhooks/errors/webhooks.errors.ts`
- Service (orchestration): `src/webhooks/webhooks.service.ts`
- Processor (worker): `src/webhooks/webhooks.processor.ts`
- Controller (entry): `src/webhooks/webhooks.controller.ts`
- Ledger: `src/webhooks/webhook-event.entity.ts`
- Module registration: `src/webhooks/webhooks.module.ts` (use `.forRoot({ verifiers, handlers })`)
