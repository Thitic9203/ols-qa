#!/bin/bash
# PreToolUse hook — AskUserQuestion. Blocks a question that asks the owner for a reference
# (thread · webhook · link · id · account · env · …) until an episodic-memory search ran in the
# same turn. See tools/ask-guard/README.md and post-mortem #0059.
#
# The decision lives in ONE place: tools/ask-guard/check.js. This wrapper only relays its exit
# code (0 = allow, 2 = block). A blocked call's reason goes to STDERR, which is what Claude Code
# feeds back to the model for a PreToolUse exit 2. If node or check.js is missing, or check.js
# crashes, that is an infra failure, not a verdict — allow with a loud warning, the same policy
# as jira-ticket-guard.sh and investigation-gate.sh.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
fi

INPUT="$(cat 2>/dev/null || true)"
CHECK="$ROOT/tools/ask-guard/check.js"

if ! command -v node >/dev/null 2>&1 || [ ! -f "$CHECK" ]; then
  echo "=== ⚠️  ask-guard รันไม่ได้ (node หรือ check.js หายไป) — ปล่อยผ่านแบบไม่มีการ์ด ==="
  exit 0
fi

ERR_FILE="$(mktemp 2>/dev/null || echo "/tmp/ask-guard.$$")"
OUT="$(printf '%s' "$INPUT" | node "$CHECK" --gate 2>"$ERR_FILE")"
RC=$?
ERR="$(cat "$ERR_FILE" 2>/dev/null || true)"
rm -f "$ERR_FILE"

case "$RC" in
  0) [ -n "$OUT" ] && printf '%s\n' "$OUT"; exit 0 ;;
  2) [ -n "$ERR" ] && printf '%s\n' "$ERR" >&2; exit 2 ;;
  *) echo "=== ⚠️  ask-guard: check.js จบด้วยรหัส $RC (ไม่ใช่คำตัดสิน) — ปล่อยผ่าน ==="
     [ -n "$ERR" ] && printf '%s\n' "$ERR"
     exit 0 ;;
esac
