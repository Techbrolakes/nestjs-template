import { Controller, Get, Inject } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import type Redis from "ioredis";
import { ApiTags } from "@nestjs/swagger";
import { REDIS_CLIENT } from "../redis/redis.module";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck("database", { timeout: 1500 }),
      () => this.pingRedis(),
    ]);
  }

  private async pingRedis(): Promise<HealthIndicatorResult> {
    const reply = await this.redis.ping();
    const isHealthy = reply === "PONG";
    return { redis: { status: isHealthy ? "up" : "down" } };
  }
}
