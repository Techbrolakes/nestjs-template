import { Test } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";
import { UserRole } from "./user.entity";

describe("UsersService", () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    repo = moduleRef.get(UsersRepository);
  });

  it("should hash the password before persisting", async () => {
    repo.create.mockImplementation(
      async (data) =>
        ({
          id: "1",
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
          sessions: [],
        }) as any,
    );

    await service.create({ email: "a@b.co", password: "x".repeat(12) });

    const call = repo.create.mock.calls[0][0];
    expect(call.passwordHash).not.toBe("x".repeat(12));
    expect(call.passwordHash.startsWith("$argon2")).toBe(true);
  });
});
