---
name: add-queue-job
description: Use when the user asks to add a background job, BullMQ job, queue task, "process X later", "enqueue a task", or anything that involves deferring work to a worker. Enforces this template's Zod-at-both-ends validation rule and retry defaults.
---

# Adding a BullMQ job

This template's invariant: **every payload crossing a boundary is Zod-parsed on both ends.** Queues are a boundary. Producers and consumers live in different processes in production — a job's shape is an inter-process contract.

## Steps

1. **Define a Zod schema for the job payload.** Co-locate with the module that owns the queue. Example for the `notifications` queue:

   ```ts
   // src/<module>/<module>.schema.ts
   import { z } from "zod";

   export const <jobName>JobSchema = z.object({
     // fields...
   });
   export type <JobName>Job = z.infer<typeof <jobName>JobSchema>;
   ```

   Reference: `src/notifications/notifications.schema.ts`.

2. **Register the queue (once per queue, not per job).** In the module:

   ```ts
   imports: [BullModule.registerQueue({ name: "<queue>" })],
   ```

   Redis connection is configured globally by `src/queue/queue.module.ts` — don't re-specify it.

3. **Producer: validate before enqueue.** In a service that owns the queue:

   ```ts
   @InjectQueue("<queue>") private readonly queue: Queue<<JobName>Job>

   enqueue<Action>(input: <JobName>Job) {
     const data = <jobName>JobSchema.parse(input);  // fail fast on bad callers
     return this.queue.add("<jobName>", data, {
       attempts: 5,
       backoff: { type: "exponential", delay: 1_000 },
       removeOnComplete: 1_000,
       removeOnFail: false,
     });
   }
   ```

   - `attempts: 5` is the template default; raise only if retries are cheap.
   - `removeOnFail: false` keeps failed jobs for inspection. Set a number only if you have an external monitoring story.
   - If the job is non-idempotent (sends an email, charges a card), use `attempts: 1` and let an outbox/saga handle retry at a higher level.

4. **Consumer: re-validate on receipt.** In a `@Processor` class:

   ```ts
   async process(job: Job<<JobName>Job>) {
     const data = <jobName>JobSchema.parse(job.data);  // producer and consumer may drift
     // ...do the work using `data`
     return { ok: true };
   }
   ```

   Parsing again is intentional — the producer and consumer versions may be deployed at different times.

5. **Graceful shutdown.** The processor class should implement `OnModuleDestroy` and call `await this.worker.close()` so SIGTERM drains in-flight jobs instead of killing them. (If the template does not yet have this pattern, note it and leave a `TODO` comment.)

6. **Unit-test the processor.** Mock the gateway / external side-effect; construct a `Job`-shaped object; assert the side-effect was called with the expected args and that the return shape is stable.

7. **Verify.** `pnpm build && pnpm test && pnpm lint`.

## Schema design rules

- Use `z.string().uuid()` for any ID that is a UUID. The template uses UUID primary keys.
- Payload fields must be serializable JSON — no `Date` objects, no class instances. Use ISO strings or `z.coerce.date()` with care.
- If the payload references an entity, include its ID, not the entity — the worker refetches. This prevents stale data.
- Include a `_meta: z.object({ requestId: z.string().optional() })` field if the template has correlation-ID propagation wired up.

## What NOT to do

- Do NOT skip the producer-side `.parse()` — letting bad data enter the queue means the worker fails N times before dead-lettering.
- Do NOT skip the consumer-side `.parse()` — a producer from an older deploy can push a shape the worker can't handle.
- Do NOT hardcode the Redis connection in the processor — it comes from `QueueModule`.
- Do NOT use `@OnQueueXxx()` decorators from the legacy `@nestjs/bull` package. This template uses `@nestjs/bullmq` with `WorkerHost`.

## Reference files

- Schema: `src/notifications/notifications.schema.ts`.
- Producer: `src/notifications/notifications.service.ts`.
- Processor: `src/notifications/notifications.processor.ts`.
- Queue registration: `src/queue/queue.module.ts`.
