import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import { CreateUserInput, UsersRepository } from "./users.repository";

@Injectable()
export class TypeOrmUsersRepository extends UsersRepository {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super();
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  create(data: CreateUserInput): Promise<User> {
    const user = this.users.create(data);
    return this.users.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.users.update({ id }, data);
    const updated = await this.users.findOne({ where: { id } });
    if (!updated) throw new NotFoundException("User not found after update");
    return updated;
  }
}
