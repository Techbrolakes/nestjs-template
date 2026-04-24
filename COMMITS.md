# Commit Message Convention

This repository uses [Conventional Commits](https://www.conventionalcommits.org/) with optional emoji prefixes. This document is the single source of truth — every contributor (human or AI) follows it.

## Format

```
<emoji> <type>(<optional-scope>): <subject>

<optional body — wrap at 72, explain WHY>

<optional footer — BREAKING CHANGE, Closes #123, etc.>
```

- **Header** is required and must be ≤ 100 characters.
- **Emoji** is optional (documented, not enforced).
- **Type** is required and must be one of the types listed below.
- **Scope** is optional; use the module or subsystem name (e.g., `auth`, `webhooks`, `e2e`).
- **Subject** is lowercase, imperative mood ("add x", not "added x" or "adds x"), no trailing period.
- **Body** (if present) is separated from the header by one blank line.
- **Footer** (if present) is separated from the body by one blank line.

## Types

| Emoji | Type       | Use for                                      |
| ----- | ---------- | -------------------------------------------- |
| ✨    | `feat`     | New user-facing capability                   |
| 🐛    | `fix`      | Bug fix                                      |
| 🧹    | `chore`    | Maintenance, dependency bumps, tooling       |
| 📝    | `docs`     | Documentation only                           |
| ♻️    | `refactor` | Internal restructure with no behavior change |
| ✅    | `test`     | Tests only                                   |
| ⚡    | `perf`     | Performance improvement                      |
| 🎨    | `style`    | Formatting, whitespace, non-semantic change  |
| 🔧    | `build`    | Build system, Dockerfile, bundler config     |
| 👷    | `ci`       | CI/CD pipeline                               |
| ⏪    | `revert`   | Revert a prior commit                        |

## Examples

**Minimal:**

```
fix(auth): reject expired refresh tokens
```

**With emoji:**

```
✨ feat(webhooks): add provider dispatcher
```

**With body:**

```
🐛 fix(e2e): set valid PORT default in test setup-env

The setup was defaulting PORT to "0", which fails the Zod env
schema's .positive() check. CI leaves PORT unset, so the default
kicked in and the whole suite failed at bootstrap.
```

**With footer (breaking change):**

```
♻️ refactor(users): rename UsersRepository.findOne -> findById

BREAKING CHANGE: Callers using `findOne` must rename to `findById`.
The signature is unchanged.
```

**With footer (issue reference):**

```
✅ test(notifications): add full-loop e2e for BullMQ -> WS

Closes #42
```

## Breaking changes

Mark breaking changes in one of two ways:

1. Add `!` after the type/scope: `feat(api)!: drop legacy v1 endpoints`
2. Add a `BREAKING CHANGE:` footer describing the migration path.

Both together is fine. At least one is required for breaking changes.

## Scope guidance

Scopes are not enforced but are recommended. Common scopes in this template:

- `auth`, `users`, `notifications`, `webhooks`, `health` — feature modules
- `e2e`, `unit` — test-only changes
- `ci` — workflow files only (also use `ci` type)
- `config`, `env` — configuration or env schema
- `docker`, `build` — Dockerfile or build tooling

## Enforcement

`commitlint` runs via a husky `commit-msg` hook on every local `git commit`. Rules:

- `type-enum` — must be one of the types above.
- `subject-empty` — required.
- `subject-full-stop` — no trailing period.
- `header-max-length` — ≤ 100 characters.
- `body-leading-blank` — blank line before body.
- `footer-leading-blank` — blank line before footer.

The emoji prefix is **allowed but not required**. Forgetting it does not fail the hook.

CI does not re-validate git history — the source of truth is what lands in the repository.

## For AI tools

This file is referenced from [`AGENTS.md`](./AGENTS.md) and [`.claude/CLAUDE.md`](./.claude/CLAUDE.md) so any agent (Claude Code, Cursor, Aider, Codex, Copilot Workspace) picks up the same convention. When asked to generate a commit message, follow this file exactly.
