import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe, patchNestJsSwagger } from "nestjs-zod";
import { Logger } from "nestjs-pino";
import helmet from "helmet";
import compression from "compression";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RedisIoAdapter } from "./common/adapters/redis-io.adapter";
import { AppConfig } from "./config/app-config.service";

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  app.useLogger(app.get(Logger));
  const config = app.get(AppConfig);

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: config.get("CORS_ORIGIN"),
    credentials: true,
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.setGlobalPrefix("api");

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useWebSocketAdapter(new RedisIoAdapter(app));
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle("API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger));

  await app.listen(config.get("PORT"));
}

bootstrap();
