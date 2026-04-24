# AGENTS.md

This file is the shared context file for AI coding assistants working in this repository (Claude Code, Cursor, Aider, Codex, Copilot Workspace, etc.). It exists separately from `.claude/CLAUDE.md` so tools that only read conventional root-level context files still find the rules.

## Commit messages

Follow the convention in [`COMMITS.md`](./COMMITS.md). When generating a commit message, use the emoji-prefixed Conventional Commits format documented there.

## Project conventions

See [`.claude/CLAUDE.md`](./.claude/CLAUDE.md) for:

- Stack (NestJS 10, TypeScript 5.5, pnpm 9, Postgres 16, Redis 7, BullMQ, Socket.IO)
- Module map and repository-port pattern
- DTO + env + queue + socket validation all goes through Zod
- Testing conventions (unit + e2e layout)
- What NOT to add to this template

## Workflow rules

- **Package manager is pnpm.** Never run `npm install` or `yarn`.
- **Direct commits to `main`/`master` are blocked** by a pre-commit hook. Create a feature branch.
- **Do not hand-edit `pnpm-lock.yaml`**.
- **Do not skip hooks** (`--no-verify`) unless explicitly instructed.
- **Never commit `.env` or anything under `secrets/`**.

## Testing

- `pnpm test` — unit tests (fast, mocked, no infra).
- `pnpm test:e2e` — full-stack e2e (requires Postgres + Redis via `docker compose up -d postgres redis`).
- `pnpm build` — typecheck + compile.
- `pnpm lint` — ESLint v9 flat config.

Run all four before declaring a change complete.
