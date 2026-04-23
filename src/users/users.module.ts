import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";
import { TypeOrmUsersRepository } from "./users.repository.typeorm";
import { User } from "./user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: TypeOrmUsersRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
