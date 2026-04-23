import { DynamicModule, Module, Type } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { WebhooksProcessor } from "./webhooks.processor";
import { WebhookEvent } from "./webhook-event.entity";
import { WebhookEventRepository } from "./webhook-event.repository";
import { TypeOrmWebhookEventRepository } from "./webhook-event.repository.typeorm";
import { WebhookVerifier } from "./verifiers/verifier.interface";
import { WebhookHandler } from "./handlers/handler.interface";
import { WEBHOOK_HANDLERS, WEBHOOK_VERIFIERS } from "./webhooks.tokens";

export interface WebhooksModuleOptions {
  verifiers?: Type<WebhookVerifier>[];
  handlers?: Type<WebhookHandler>[];
}

@Module({})
export class WebhooksModule {
  static forRoot(options: WebhooksModuleOptions = {}): DynamicModule {
    const verifiers = options.verifiers ?? [];
    const handlers = options.handlers ?? [];

    return {
      module: WebhooksModule,
      imports: [
        TypeOrmModule.forFeature([WebhookEvent]),
        BullModule.registerQueue({ name: "webhooks" }),
      ],
      controllers: [WebhooksController],
      providers: [
        ...verifiers,
        ...handlers,
        {
          provide: WebhookEventRepository,
          useClass: TypeOrmWebhookEventRepository,
        },
        {
          provide: WEBHOOK_VERIFIERS,
          useFactory: (...instances: WebhookVerifier[]) => instances,
          inject: verifiers,
        },
        {
          provide: WEBHOOK_HANDLERS,
          useFactory: (...instances: WebhookHandler[]) => instances,
          inject: handlers,
        },
        WebhooksService,
        WebhooksProcessor,
      ],
      exports: [WebhooksService],
    };
  }
}
