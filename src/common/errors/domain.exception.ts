import { HttpException, HttpStatus } from "@nestjs/common";

export interface DomainExceptionBody {
  code: string;
  message: string;
  details?: unknown;
}

export class DomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: number,
    public readonly details?: unknown,
  ) {
    const body: DomainExceptionBody = { code, message, details };
    super(body, status);
  }
}

export class BadRequestDomainException extends DomainException {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(
    code = "UNAUTHORIZED",
    message = "Unauthorized",
    details?: unknown,
  ) {
    super(code, message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(code = "FORBIDDEN", message = "Forbidden", details?: unknown) {
    super(code, message, HttpStatus.FORBIDDEN, details);
  }
}

export class NotFoundDomainException extends DomainException {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, HttpStatus.NOT_FOUND, details);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, HttpStatus.CONFLICT, details);
  }
}
