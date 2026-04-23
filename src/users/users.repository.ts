import { User } from "./user.entity";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
}

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: CreateUserInput): Promise<User>;
  abstract update(id: string, data: Partial<User>): Promise<User>;
}
