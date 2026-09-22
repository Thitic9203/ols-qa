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
# RC=2 ต้องส่งไป stderr เท่านั้น — Claude Code harness อ่านเหตุผลบล็อกจาก stderr
# (2026-09-22: investigation-gate.sh/issue-creation-guard.sh/issue-creation-stop.sh เคยส่งไป
# stdout เหมือนไฟล์นี้มาก่อน ทำให้ harness รายงาน "No stderr output" แทนข้อความจริง — แก้
# ทั้งคลาสพร้อมกันให้ตรงกับ pattern ที่ถูกต้องอยู่แล้วใน discord-notify-guard.sh/ask-guard.sh)
OUT="$(printf '%s' "$INPUT" | node "$CHECK" --gate 2>&1)"
RC=$?
case "$RC" in
  0) [ -n "$OUT" ] && printf '%s\n' "$OUT"; exit 0 ;;
  2) printf '%s\n' "$OUT" >&2; exit 2 ;;
  *) echo "=== ⚠️  jira-ticket-guard: check.js จบด้วยรหัส $RC (ไม่ใช่คำตัดสิน) — ปล่อยผ่าน ==="
     [ -n "$OUT" ] && printf '%s\n' "$OUT"
     exit 0 ;;
esac
