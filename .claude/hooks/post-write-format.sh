#!/usr/bin/env bash
# PostToolUse (Write|Edit): format the changed file with prettier + eslint --fix.
# Non-blocking: always exits 0. Errors are swallowed so edits are never rejected.

set +e

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$PWD}" || exit 0

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.yml|*.yaml)
    if command -v pnpm >/dev/null 2>&1; then
      pnpm exec prettier --write --log-level warn "$FILE" >/dev/null 2>&1
    fi
    ;;
esac

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    if command -v pnpm >/dev/null 2>&1; then
      pnpm exec eslint --fix --quiet "$FILE" >/dev/null 2>&1
    fi
    ;;
esac

exit 0
