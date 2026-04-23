# nestjs-template

Production-ready Nest.js template: TypeScript + PostgreSQL (TypeORM) + Redis + BullMQ + Socket.IO.

Architectural notes, Claude Code harness, and plugin recommendations live in `.claude/CLAUDE.md` and `PLUGINS.md`.

## Quick start

```bash
# 1. Copy env and fill in secrets
cp .env.example .env
openssl rand -hex 32                 # paste into JWT_SECRET
openssl rand -hex 32                 # paste into JWT_REFRESH_SECRET
# Set POSTGRES_PASSWORD and update DATABASE_URL with credentials

# 2. Install (uses pnpm — run `corepack enable` once if needed)
pnpm install

# 3. Infra (Postgres + Redis)
docker compose up -d postgres redis

# 4. Create initial migration + apply
pnpm db:migrate:generate src/migrations/Init
pnpm db:migrate:run

# 5. Run
pnpm start:dev
```

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/api/v1/health

## Scripts

| Command                   | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `pnpm start:dev`          | Watch mode                                    |
| `pnpm build`              | Compile                                       |
| `pnpm test`               | Unit tests                                    |
| `pnpm test:e2e`           | E2E tests                                     |
| `pnpm db:migrate:generate <path>` | Diff entities vs DB; write a new migration |
| `pnpm db:migrate:run`     | Apply pending migrations                      |
| `pnpm db:migrate:revert`  | Undo the last migration                       |
| `pnpm db:migrate:show`    | List migration status                         |

## Layout

```
src/
  main.ts              app.module.ts
  config/              configuration + Joi env schema
  common/              filters, guards, interceptors, decorators
  database/
    data-source.ts     TypeORM DataSource (used by migration CLI)
  migrations/          generated TypeORM migrations
  redis/               ioredis client + helpers (global)
  queue/               BullMQ registration
  auth/                JWT + Passport (register, login, refresh tokens)
    session.entity.ts  Session entity
  users/               repository port + TypeORM adapter + service + controller
    user.entity.ts     User entity (co-located with its domain module)
  notifications/       Socket.IO gateway + BullMQ processor
  health/              /health, /ready via @nestjs/terminus
```

Entities live next to the feature module that owns them (`user.entity.ts` in `users/`, `session.entity.ts` in `auth/`). `autoLoadEntities: true` in `app.module.ts` picks them up automatically.

## Replace the default recipe

- **Swap TypeORM for Prisma or Drizzle**: the repository-port pattern (`UsersRepository` interface + `TypeOrmUsersRepository` adapter) lets you replace the adapter without touching callers. For Prisma, centralize schema under `prisma/`; for Drizzle, co-locate `*.schema.ts` next to entities.
- **Add Kafka alongside BullMQ**: wire `@nestjs/microservices` in `main.ts` (`connectMicroservice`, `Transport.KAFKA`) and add `@MessagePattern` handlers. Use BullMQ for in-app jobs, Kafka for cross-service streams.

## Docker

```bash
docker compose up --build
# Container runs: pnpm db:migrate:run && node dist/main.js
```
