#!/usr/bin/env bash
# SessionStart: inject lightweight project context so Claude doesn't have to re-scan.
# Must output JSON with hookSpecificOutput.additionalContext. Fast — no test runs.

set +e

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || true

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ -d .git ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
  DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  LAST_COMMIT=$(git log -1 --pretty=format:'%h %s' 2>/dev/null || echo "no commits yet")
else
  BRANCH="no-git"
  DIRTY="0"
  LAST_COMMIT="not a git repo (run: git init)"
fi
NODE_VER=$(node --version 2>/dev/null || echo "node ?")
PNPM_VER=$(pnpm --version 2>/dev/null || echo "?")
ENV_PRESENT="no"
[ -f .env ] && ENV_PRESENT="yes"
DOCKER_UP="unknown"
if command -v docker >/dev/null 2>&1; then
  if docker compose ps --services --filter "status=running" 2>/dev/null | grep -q .; then
    DOCKER_UP="running"
  else
    DOCKER_UP="stopped"
  fi
fi

# TypeORM migrations on disk
MIGRATIONS="n/a"
if [ -d src/migrations ]; then
  MIGRATIONS=$(ls src/migrations/*.ts 2>/dev/null | wc -l | tr -d ' ')
fi

CONTEXT=$(cat <<EOF
## Repo state at session start

- Branch: $BRANCH ($DIRTY uncommitted files)
- Last commit: $LAST_COMMIT
- Node: $NODE_VER · pnpm: $PNPM_VER
- .env file present: $ENV_PRESENT
- docker compose: $DOCKER_UP
- TypeORM migrations on disk: $MIGRATIONS

Reminders:
- This is the nestjs-template master repo. Changes here propagate to all forks.
- Use pnpm (never npm). Direct commits to main/master are blocked.
- See .claude/CLAUDE.md for conventions and module map.
EOF
)

jq -n --arg ctx "$CONTEXT" '{
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: $ctx
  }
}'
