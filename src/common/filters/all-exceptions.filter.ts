import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { DomainException } from "../errors/domain.exception";

interface ErrorResponseBody {
  code: string;
  message: string;
  details?: unknown;
  path: string;
  requestId?: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    const requestId = req.id;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "Internal server error";
    let details: unknown;

    if (exception instanceof DomainException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();
      const normalized = this.normalizeHttpExceptionBody(raw, status);
      code = normalized.code;
      message = normalized.message;
      details = normalized.details;
    }

    const body: ErrorResponseBody = {
      code,
      message,
      details,
      path: req.url,
      requestId,
      timestamp: new Date().toISOString(),
    };

    const logPayload = {
      requestId,
      path: req.url,
      status,
      code,
      err:
        exception instanceof Error ? exception : new Error(String(exception)),
    };
    if (status >= 500) {
      this.logger.error(logPayload);
    } else {
      this.logger.warn(logPayload);
    }

    res.status(status).json(body);
  }

  private normalizeHttpExceptionBody(
    raw: unknown,
    status: number,
  ): { code: string; message: string; details?: unknown } {
    if (typeof raw === "string") {
      return { code: this.codeForStatus(status), message: raw };
    }
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      const code =
        typeof r.code === "string" ? r.code : this.codeForStatus(status);
      const message =
        typeof r.message === "string"
          ? r.message
          : Array.isArray(r.message)
            ? r.message.join(", ")
            : "Error";
      const details = r.details ?? r.errors;
      return { code, message, details };
    }
    return { code: this.codeForStatus(status), message: "Error" };
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "BAD_REQUEST";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.CONFLICT:
        return "CONFLICT";
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return "UNPROCESSABLE_ENTITY";
      case HttpStatus.TOO_MANY_REQUESTS:
        return "RATE_LIMITED";
      default:
        return status >= 500 ? "INTERNAL_ERROR" : "HTTP_ERROR";
    }
  }
}
