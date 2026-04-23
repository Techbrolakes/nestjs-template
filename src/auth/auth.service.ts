import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as argon2 from "argon2";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Session } from "./session.entity";
import {
  EmailAlreadyTakenError,
  InvalidCredentialsError,
} from "./errors/auth.errors";
import { AppConfig } from "../config/app-config.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new EmailAlreadyTakenError(dto.email);
    const user = await this.users.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new InvalidCredentialsError();
    return this.issueTokens(user.id, user.email, user.role);
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_SECRET"),
      expiresIn: this.config.get("JWT_EXPIRES_IN"),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN"),
    });
    const session = this.sessions.create({
      userId,
      refreshTokenHash: await argon2.hash(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.sessions.save(session);
    return { accessToken, refreshToken };
  }
}
