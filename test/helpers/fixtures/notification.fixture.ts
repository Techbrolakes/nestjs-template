import type { NotifyJob } from "../../../src/notifications/notifications.schema";

export function makeNotifyJob(overrides: Partial<NotifyJob> = {}): NotifyJob {
  return {
    userId: overrides.userId ?? "00000000-0000-0000-0000-000000000000",
    event: overrides.event ?? "test-event",
    payload: overrides.payload ?? { hello: "world" },
  };
}
