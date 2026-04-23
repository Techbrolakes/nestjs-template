#!/usr/bin/env bash
# PreToolUse (Bash): block `git commit` and `git push --force` on main/master.
# Exit 2 with a JSON permissionDecision so Claude sees the denial reason.

set -euo pipefail

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [ -z "$CMD" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

deny() {
  local reason="$1"
  jq -n --arg r "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 2
}

# Block direct commits to main/master
if echo "$CMD" | grep -qE '(^|[[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    deny "Direct commits to '$BRANCH' are blocked. Create a feature branch: git checkout -b <branch>"
  fi
fi

# Block force-push to main/master
if echo "$CMD" | grep -qE 'git[[:space:]]+push.*(--force|-f)([[:space:]]|$)'; then
  if echo "$CMD" | grep -qE '(main|master)'; then
    deny "Force-push to main/master is blocked. Use a regular push or rebase then push to a feature branch."
  fi
fi

# Block destructive operations without explicit confirmation
if echo "$CMD" | grep -qE 'rm[[:space:]]+-rf[[:space:]]+/'; then
  deny "Refusing 'rm -rf /' — would wipe the filesystem."
fi

exit 0
