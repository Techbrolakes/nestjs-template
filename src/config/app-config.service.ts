import { Global, Injectable, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "./validation.schema";

@Injectable()
export class AppConfig extends ConfigService<Env, true> {}

@Global()
@Module({
  providers: [{ provide: AppConfig, useExisting: ConfigService }],
  exports: [AppConfig],
})
export class AppConfigModule {}
