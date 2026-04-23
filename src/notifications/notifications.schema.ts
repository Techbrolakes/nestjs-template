import { z } from "zod";

export const notifyJobSchema = z.object({
  userId: z.string().uuid(),
  event: z.string().min(1),
  payload: z.unknown(),
});

export type NotifyJob = z.infer<typeof notifyJobSchema>;

export const pingEventSchema = z.unknown();
