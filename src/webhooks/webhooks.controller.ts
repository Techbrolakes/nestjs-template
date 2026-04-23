import {
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../common/decorators/public.decorator";
import { WebhooksService } from "./webhooks.service";

@ApiTags("webhooks")
@Controller({ path: "webhooks", version: "1" })
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Public()
  @Post(":provider")
  @HttpCode(200)
  async handle(
    @Param("provider") provider: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const result = await this.webhooks.handle(provider, req);
    return { received: true, duplicate: result.duplicate };
  }
}
