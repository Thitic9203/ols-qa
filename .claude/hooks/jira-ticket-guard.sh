#!/bin/bash
# PreToolUse hook — blocks creating a new Jira issue (any Atlassian MCP connector)
# unless tools/jira-ticket-guard/check.js was armed with an explicit owner confirm
# this turn. See tools/jira-ticket-guard/README.md and post-mortem #0054.
#
# The decision lives in ONE place: check.js. This wrapper only relays its exit code
# (0 = allow, 2 = block) and prints whatever it said. If node or the script itself is
# missing, that is an infra failure, not a "block everything" signal — allow through
# with a loud warning, same policy investigation-gate.sh uses for the same reason: a
# guard that jams a session on its own breakage gets deleted within a day.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
fi

INPUT="$(cat 2>/dev/null || true)"
CHECK="$ROOT/tools/jira-ticket-guard/check.js"

if ! command -v node >/dev/null 2>&1 || [ ! -f "$CHECK" ]; then
  echo "=== ⚠️  jira-ticket-guard รันไม่ได้ (node หรือ check.js หายไป) — ปล่อยผ่านแบบไม่มีการ์ด ==="
  exit 0
fi

# rc "ตั้งใจ" มีแค่ 0 (ผ่าน) กับ 2 (บล็อก) — อย่างอื่นคือ node เองพังกลางทาง ไม่ใช่คำตัดสิน
# printf ไปที่ stdout เสมอ (ไม่ใช่ stderr) — ทำตามแพตเทิร์นเดียวกับ investigation-gate.sh เป๊ะ
# ซึ่งพิสูจน์แล้วว่าใช้งานได้จริงใน repo นี้
OUT="$(printf '%s' "$INPUT" | node "$CHECK" --gate 2>&1)"
RC=$?
case "$RC" in
  0|2) [ -n "$OUT" ] && printf '%s\n' "$OUT"; exit "$RC" ;;
  *)   echo "=== ⚠️  jira-ticket-guard: check.js จบด้วยรหัส $RC (ไม่ใช่คำตัดสิน) — ปล่อยผ่าน ==="
       [ -n "$OUT" ] && printf '%s\n' "$OUT"
       exit 0 ;;
esac
