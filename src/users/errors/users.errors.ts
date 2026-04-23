import { NotFoundDomainException } from "../../common/errors/domain.exception";

export class UserNotFoundError extends NotFoundDomainException {
  constructor(id: string) {
    super("USER_NOT_FOUND", "User not found", { id });
  }
}
