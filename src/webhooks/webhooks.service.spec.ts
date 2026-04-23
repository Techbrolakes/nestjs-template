import { Test } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { WebhooksService } from "./webhooks.service";
import { WebhookEventRepository } from "./webhook-event.repository";
import { WebhookVerifier } from "./verifiers/verifier.interface";
import { WEBHOOK_VERIFIERS } from "./webhooks.tokens";
import { UnknownWebhookProviderError } from "./errors/webhooks.errors";

class FakeVerifier extends WebhookVerifier {
  readonly provider = "fake";
  verify = jest
    .fn()
    .mockReturnValue({ eventId: "evt_1", payload: { ok: true } });
}

const fakeReq = {} as unknown as RawBodyRequest<Request>;

describe("WebhooksService", () => {
  let service: WebhooksService;
  let events: jest.Mocked<WebhookEventRepository>;
  let queue: jest.Mocked<Queue>;
  let verifier: FakeVerifier;

  beforeEach(async () => {
    verifier = new FakeVerifier();

    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: WEBHOOK_VERIFIERS,
          useValue: [verifier],
        },
        {
          provide: WebhookEventRepository,
          useValue: {
            record: jest.fn(),
            markProcessed: jest.fn(),
          },
        },
        {
          provide: getQueueToken("webhooks"),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(WebhooksService);
    events = moduleRef.get(WebhookEventRepository);
    queue = moduleRef.get(getQueueToken("webhooks"));
  });

  it("verifies, records, and enqueues on a fresh event", async () => {
    events.record.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      provider: "fake",
      eventId: "evt_1",
      receivedAt: new Date(),
      processedAt: null,
    });

    const result = await service.handle("fake", fakeReq);

    expect(result).toEqual({ duplicate: false });
    expect(verifier.verify).toHaveBeenCalledWith(fakeReq);
    expect(events.record).toHaveBeenCalledWith("fake", "evt_1");
    expect(queue.add).toHaveBeenCalledWith(
      "process",
      expect.objectContaining({
        ledgerId: "11111111-1111-4111-8111-111111111111",
        provider: "fake",
        eventId: "evt_1",
      }),
      expect.any(Object),
    );
  });

  it("skips enqueue on a duplicate event", async () => {
    events.record.mockResolvedValue(null);

    const result = await service.handle("fake", fakeReq);

    expect(result).toEqual({ duplicate: true });
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("throws UnknownWebhookProviderError for an unregistered provider", async () => {
    await expect(service.handle("nope", fakeReq)).rejects.toBeInstanceOf(
      UnknownWebhookProviderError,
    );
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it("propagates verifier errors (e.g. bad signature)", async () => {
    verifier.verify.mockImplementation(() => {
      throw new Error("signature mismatch");
    });
    await expect(service.handle("fake", fakeReq)).rejects.toThrow(
      "signature mismatch",
    );
    expect(events.record).not.toHaveBeenCalled();
  });
});
