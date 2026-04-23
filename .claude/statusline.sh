#!/usr/bin/env bash
# Claude Code status line for nestjs-template.
# Reads session JSON from stdin, prints a single line.

set -euo pipefail

INPUT=$(cat)
MODEL=$(printf '%s' "$INPUT" | jq -r '.model.display_name // .model.id // "claude"' 2>/dev/null || echo "claude")
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // .workspace.current_dir // ""' 2>/dev/null || echo "")

cd "${CWD:-$PWD}" 2>/dev/null || true

DIR=$(basename "${CWD:-$PWD}")

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ -d .git ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
  DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [ "$DIRTY" = "0" ]; then
    STATE="clean"
  else
    STATE="${DIRTY} changed"
  fi
  printf '[%s] %s · %s · %s' "$MODEL" "$DIR" "$BRANCH" "$STATE"
else
  printf '[%s] %s · no-git' "$MODEL" "$DIR"
fi
