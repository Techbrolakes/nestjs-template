import { z } from "zod";

export const webhookJobSchema = z.object({
  ledgerId: z.string().uuid(),
  provider: z.string().min(1),
  eventId: z.string().min(1),
  payload: z.unknown(),
});

export type WebhookJob = z.infer<typeof webhookJobSchema>;
