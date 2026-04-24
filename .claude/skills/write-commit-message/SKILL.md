---
name: write-commit-message
description: Use when generating a git commit message for this repository, when the user asks to commit changes, or when drafting a commit subject. Enforces the project's Conventional Commits convention documented in COMMITS.md and validated by commitlint via the husky commit-msg hook.
---

# Writing a commit message

This repo uses Conventional Commits with optional emoji prefixes. The authoritative spec is [`COMMITS.md`](../../../COMMITS.md) at the repo root; this skill is the procedural version for Claude.

## Format

```
<emoji> <type>(<optional-scope>): <subject>

<optional body — wrap at 72, explain WHY>

<optional footer — BREAKING CHANGE: ... / Closes #123>
```

## Steps

1. **Pick the type** based on the primary intent of the change:
   | Emoji | Type | Use for |
   | ----- | ---- | ------- |
   | ✨ | `feat` | New user-facing capability |
   | 🐛 | `fix` | Bug fix |
   | 🧹 | `chore` | Maintenance, deps, tooling |
   | 📝 | `docs` | Documentation only |
   | ♻️ | `refactor` | Internal restructure, no behavior change |
   | ✅ | `test` | Tests only |
   | ⚡ | `perf` | Performance improvement |
   | 🎨 | `style` | Formatting, whitespace |
   | 🔧 | `build` | Build system, Dockerfile |
   | 👷 | `ci` | CI/CD pipeline |
   | ⏪ | `revert` | Revert a prior commit |

   If a commit legitimately mixes types (rare — avoid by splitting), choose the most load-bearing one.

2. **Pick a scope** (optional but recommended). Use the module or subsystem: `auth`, `users`, `notifications`, `webhooks`, `health`, `e2e`, `unit`, `ci`, `config`, `env`, `docker`.

3. **Write the subject.**
   - Imperative mood (`add`, `fix`, `remove` — NOT `added`, `fixes`, `removing`).
   - Lowercase.
   - No trailing period.
   - ≤ 100 characters total including emoji prefix.
   - Describe WHAT changed at the behavior level, not the mechanics.

4. **Decide on a body.** Include one only when the WHY is non-obvious:
   - An incident or bug class this prevents.
   - A surprising trade-off chosen vs. obvious alternatives.
   - Context future readers will need when tracing blame.
     Skip the body for mechanical changes (renames, dep bumps, formatting).

5. **Add a footer only when there's**:
   - A breaking change — prefix with `BREAKING CHANGE:` and describe the migration path.
   - An issue to close — `Closes #123`.
   - Co-authors — `Co-Authored-By: Name <email>`.

6. **Verify against commitlint rules:**
   - `type` in the enum above.
   - `subject-empty: never` — subject is not empty.
   - `subject-full-stop: never` — no trailing period.
   - `header-max-length: 100`.
   - `body-leading-blank: always` — blank line before body.
   - `footer-leading-blank: always` — blank line before footer.

7. **Commit.** The `commit-msg` husky hook runs commitlint automatically. If the hook is bypassed (e.g., by `--no-verify`), the convention is still expected — CI reviewers enforce it manually.

## Examples

**Good:**

```
🐛 fix(e2e): serialize jest workers to avoid postgres sync race

Three e2e specs booted AppModule in parallel workers; two concurrent
CREATE TYPE calls race on pg_type_typname_nsp_index. Setting
maxWorkers: 1 in jest-e2e.json serializes them. E2E tests share a
DB; parallelism here is unsafe without per-worker schemas.
```

**Good (minimal):**

```
🧹 chore(deps): bump @nestjs/core to 10.4.22
```

**Good (breaking):**

```
♻️ refactor(users)!: rename UsersRepository.findOne to findById

BREAKING CHANGE: Callers using `findOne` must migrate to `findById`.
The signature is unchanged.
```

**Bad and why:**

- `Updated auth` — wrong mood, wrong case, no type, no scope.
- `fix(auth): fixed a bug.` — past tense, trailing period.
- `feat: add a new feature to improve the user experience for authentication` — vague subject.
- `chore: stuff` — subject carries no information.

## What NOT to do

- Do NOT skip the hook with `--no-verify` unless the user explicitly says so and has a concrete reason.
- Do NOT write `WIP`/`wip` as a type. Work-in-progress commits still use a valid type; use `chore` or the real intent.
- Do NOT include a `Co-Authored-By: Claude` line unless the user has asked for it.
- Do NOT rewrite the user's commit message unless asked — if they hand you a subject, respect it (fix formatting only).

## Reference

- Full convention: [`COMMITS.md`](../../../COMMITS.md)
- Commitlint config: [`commitlint.config.cjs`](../../../commitlint.config.cjs)
- Cross-tool context: [`AGENTS.md`](../../../AGENTS.md)
