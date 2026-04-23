import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import type { ZodSchema } from "zod";

@Injectable()
export class WsZodValidationPipe<T extends ZodSchema> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new WsException({
        message: "Validation failed",
        issues: result.error.issues,
      });
    }
    return result.data;
  }
}
