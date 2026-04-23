import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { WebhookEvent } from "./webhook-event.entity";
import { WebhookEventRepository } from "./webhook-event.repository";

const PG_UNIQUE_VIOLATION = "23505";

@Injectable()
export class TypeOrmWebhookEventRepository extends WebhookEventRepository {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly events: Repository<WebhookEvent>,
  ) {
    super();
  }

  async record(
    provider: string,
    eventId: string,
  ): Promise<WebhookEvent | null> {
    const entity = this.events.create({ provider, eventId, processedAt: null });
    try {
      return await this.events.save(entity);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { code?: string }).code ===
          PG_UNIQUE_VIOLATION
      ) {
        return null;
      }
      throw err;
    }
  }

  async markProcessed(id: string): Promise<void> {
    await this.events.update({ id }, { processedAt: new Date() });
  }
}
