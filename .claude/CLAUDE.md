# Project Guide — NestJS Master Template

This is a production-ready NestJS template meant to be forked into new projects. Keep it lean and general-purpose; project-specific code belongs in the fork, not here.

## Stack

- **Runtime:** Node.js ≥20, TypeScript 5.5 (ES2022, strict)
- **Framework:** NestJS 10
- **DB:** PostgreSQL 16 via TypeORM 0.3 (swappable — see "Data layer")
- **Cache/Broker:** Redis 7 via ioredis
- **Jobs:** BullMQ
- **Realtime:** Socket.IO (with Redis adapter)
- **Transport:** REST (URI versioned, `/api/v1`), Swagger at `/docs`, optional Kafka via `@nestjs/microservices`
- **Auth:** JWT + Passport, Argon2 password hashing
- **Package manager:** pnpm 9 (Node 20+)

## Module map

```
src/
  main.ts                  bootstrap, helmet, compression, CORS, ValidationPipe, Swagger
  app.module.ts            wires config, TypeORM root, throttler, redis, queue, auth, users, notifications, health
  config/                  @nestjs/config + Joi env schema (src/config/validation.schema.ts)
  common/                  filters (AllExceptionsFilter), guards, interceptors (LoggingInterceptor), decorators
  database/data-source.ts  TypeORM DataSource for the migration CLI
  migrations/              generated TypeORM migrations (created on first run)
  redis/                   global ioredis client + helpers
  queue/                   BullMQ registration (@nestjs/bullmq)
  auth/                    JWT + Passport — register, login, refresh; guards + strategies
    session.entity.ts      Session entity (co-located with auth — that's what owns it)
  users/                   repository-port pattern: UsersRepository interface + TypeOrmUsersRepository adapter
    user.entity.ts         User entity (co-located with users)
  notifications/           Socket.IO gateway + BullMQ processor
  health/                  @nestjs/terminus — /health, /ready
```

## Conventions

- **DTOs** live under `src/<feature>/dto/`, use `class-validator` + `class-transformer`. Global `ValidationPipe` has `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Repository pattern:** feature modules define a port (interface) + adapter (TypeORM implementation). Callers depend on the interface. This is what makes the ORM swappable.
- **Entities live in their owning module**, not in a central database folder. `user.entity.ts` → `users/`. `session.entity.ts` → `auth/`. `autoLoadEntities: true` in `TypeOrmModule.forRootAsync()` picks them up.
- **Errors:** throw NestJS HTTP exceptions; `AllExceptionsFilter` in `common/filters/` normalizes responses.
- **Logging:** currently uses the default `Logger` + `LoggingInterceptor` for HTTP timing. `nestjs-pino` is installed but not wired — M3 will replace the default logger.
- **Auth on endpoints:** use `@UseGuards(JwtAuthGuard)` from `auth/guards/`; public endpoints need explicit `@Public()` decorator (see `common/decorators/`).
- **Rate limiting:** global Throttler at 100 req/60s; override per route via `@Throttle()`.
- **API versioning:** URI-based, all routes under `/api/v1`. Bump to `v2` per controller when breaking.

## Data layer (ORM-swappable)

The template ships with TypeORM 0.3 but is designed for swap:

- Port: `src/users/users.repository.ts` (interface)
- Adapter: `src/users/users.repository.typeorm.ts`
- To swap: implement the same interface with Prisma or Drizzle; rebind in `UsersModule` providers. Callers untouched.

**Migrations** use TypeORM CLI. IDs are UUID (`@PrimaryGeneratedColumn("uuid")`) — if a fork needs cuid/ulid, swap the column generator in the entity.

**Swap recipes** (in repo README): TypeORM → Prisma (centralize schema in `prisma/`) or Drizzle (co-locate `*.schema.ts` next to entities, aggregate in a root index).

## How to add a feature module

1. `nest g module <name>` (or copy `users/` as a skeleton).
2. Define a DTO under `dto/`.
3. Define a TypeORM entity in `<name>.entity.ts` (co-located, not in a shared folder).
4. Define a repository port + TypeORM adapter if persistent. Register the entity via `TypeOrmModule.forFeature([Entity])` in the module's `imports`.
5. Wire the controller with `@ApiTags()` + Swagger decorators; add guards.
6. Write a `.spec.ts` for the service at minimum.
7. Register the module in `app.module.ts`.
8. Generate a migration: `pnpm db:migrate:generate src/migrations/Add<Name>` then `pnpm db:migrate:run`.

## Testing

- **Unit:** Jest, `*.spec.ts` colocated with source; `rootDir: src`.
- **E2E:** `test/jest-e2e.json`, supertest-based; spin up the full Nest app.
- **Coverage:** not yet gated (M3 adds a threshold).

## Environment

- See `.env.example`. Validated by Joi in `src/config/validation.schema.ts` — app crashes on boot if required vars are missing.
- Never commit `.env` or anything under `secrets/`. Claude Code permissions in `.claude/settings.json` deny reads.

## Docker

- Multi-stage Alpine, non-root `app` user. Prod container runs `pnpm db:migrate:run && node dist/main.js`.
- `docker compose up -d postgres redis` for local infra.

## Commit messages

Follow the convention in [`COMMITS.md`](../COMMITS.md). Conventional Commits with an optional emoji prefix. Enforced locally by commitlint via a husky `commit-msg` hook. When generating a commit message, invoke the `write-commit-message` skill in `.claude/skills/` — it has the procedural version.

## Claude Code conventions for this repo

- Use `/security-review` before merging anything that touches `auth/`, `common/guards/`, or migrations.
- Use the `superpowers:test-driven-development` skill for new modules — the repository-port pattern is trivial to TDD.
- Use the `superpowers:brainstorming` skill before any multi-module feature.
- Keep commits off `main`/`master` — pre-commit hook blocks direct commits; use feature branches.
- Don't `npm install` — this is a pnpm repo. Never touch `pnpm-lock.yaml` by hand.

## What NOT to do

- Don't add features to this template that don't generalize (project-specific business logic belongs in the fork).
- Don't remove the repository-port pattern — it's what keeps the ORM swappable.
- Don't wire cloud-specific code (AWS/GCP/Vercel) into the template core. Put provider hooks behind feature flags or leave for the fork.
- Don't skip `pnpm lint` before committing. The PostToolUse hook formats for you, but ESLint errors must be fixed manually.

## Reference docs

- NestJS: https://docs.nestjs.com
- TypeORM: https://typeorm.io
- @nestjs/typeorm: https://docs.nestjs.com/techniques/database
- BullMQ: https://docs.bullmq.io
- Context7 MCP is recommended for current docs lookups (see `PLUGINS.md`).
