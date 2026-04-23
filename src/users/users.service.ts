import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { UsersRepository } from "./users.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserNotFoundError } from "./errors/users.errors";

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async create(dto: CreateUserDto) {
    return this.repo.create({
      email: dto.email,
      passwordHash: await argon2.hash(dto.password),
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
    });
  }

  async findByEmail(email: string) {
    return this.repo.findByEmail(email);
  }

  async getById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.getById(id);
    return this.repo.update(id, dto);
  }
}
