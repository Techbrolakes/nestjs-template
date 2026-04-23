import {
  ConflictDomainException,
  UnauthorizedDomainException,
} from "../../common/errors/domain.exception";

export class EmailAlreadyTakenError extends ConflictDomainException {
  constructor(email: string) {
    super("AUTH_EMAIL_TAKEN", "Email already in use", { email });
  }
}

export class InvalidCredentialsError extends UnauthorizedDomainException {
  constructor() {
    super("AUTH_INVALID_CREDENTIALS", "Invalid credentials");
  }
}
