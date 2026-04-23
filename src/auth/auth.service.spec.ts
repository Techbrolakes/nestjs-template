import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { Session } from "./session.entity";
import { AppConfig } from "../config/app-config.service";
import { UserRole, User } from "../users/user.entity";
import {
  EmailAlreadyTakenError,
  InvalidCredentialsError,
} from "./errors/auth.errors";

jest.mock("argon2", () => ({
  hash: jest.fn(async (plain: string) => `$argon2$${plain}`),
  verify: jest.fn(
    async (hash: string, plain: string) => hash === `$argon2$${plain}`,
  ),
}));

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: "user-1",
    email: "a@b.co",
    passwordHash: "$argon2$password1234567890",
    firstName: null,
    lastName: null,
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    sessions: [],
    ...overrides,
  }) as User;

describe("AuthService", () => {
  let service: AuthService;
  let users: jest.Mocked<UsersService>;
  let jwt: jest.Mocked<JwtService>;
  let sessions: jest.Mocked<Repository<Session>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest
              .fn()
              .mockImplementation(async (_payload, opts) =>
                opts?.secret === "refresh-secret"
                  ? "refresh-token"
                  : "access-token",
              ),
          },
        },
        {
          provide: AppConfig,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case "JWT_SECRET":
                  return "access-secret";
                case "JWT_EXPIRES_IN":
                  return "15m";
                case "JWT_REFRESH_SECRET":
                  return "refresh-secret";
                case "JWT_REFRESH_EXPIRES_IN":
                  return "7d";
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            create: jest.fn((dto) => dto),
            save: jest.fn(async (dto) => dto),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    users = moduleRef.get(UsersService);
    jwt = moduleRef.get(JwtService);
    sessions = moduleRef.get(getRepositoryToken(Session));
  });

  describe("register", () => {
    it("issues access + refresh tokens on success", async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue(makeUser());

      const result = await service.register({
        email: "a@b.co",
        password: "password1234",
      });

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "a@b.co" }),
      );
      expect(jwt.signAsync).toHaveBeenCalledTimes(2);
      expect(sessions.save).toHaveBeenCalled();
    });

    it("throws EmailAlreadyTakenError if email exists", async () => {
      users.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.register({ email: "a@b.co", password: "password1234" }),
      ).rejects.toBeInstanceOf(EmailAlreadyTakenError);
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("issues tokens on valid credentials", async () => {
      users.findByEmail.mockResolvedValue(
        makeUser({ passwordHash: "$argon2$password1234" }),
      );

      const result = await service.login({
        email: "a@b.co",
        password: "password1234",
      });

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(sessions.save).toHaveBeenCalled();
    });

    it("throws InvalidCredentialsError when user is missing", async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "nope@b.co", password: "password1234" }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("throws InvalidCredentialsError when password is wrong", async () => {
      users.findByEmail.mockResolvedValue(
        makeUser({ passwordHash: "$argon2$different" }),
      );

      await expect(
        service.login({ email: "a@b.co", password: "password1234" }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });
});
