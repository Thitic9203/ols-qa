#!/bin/bash
# Post-mortem debt reminder — the layer that shouts.
#
# Reads docs/post-mortem/PENDING.md directly and prints every row still marked OPEN.
# Deliberately pure bash: the Node gate (tools/postmortem-guard/check.js) is a separate
# layer, and two layers that share a runtime fail together. If Node is broken, this still
# speaks; if this is broken, the gate still blocks the commit.
#
# Wired into four places, on purpose — one moment of forgetting is not enough to escape:
#   SessionStart      (via inject-context.sh)  a new session inherits last session's debt
#   UserPromptSubmit  (settings.json)          the reminder returns on every prompt
#   Stop              (settings.json)          "later" cannot quietly become never
#   PreCompact        (via pre-compact.sh)     compaction cannot eat the debt
#
# ALWAYS exits 0. A reminder that can break a session is a reminder that gets removed.
# There is no flag to silence it: the way out is to write the report.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
fi

LEDGER="$ROOT/docs/post-mortem/PENDING.md"

# A ledger that cannot be read is louder than one with debt in it — silence here would
# read as "no debt", which is exactly how the pre-commit gate came to allow a commit while
# a report was owed (report #0003). Existence is not readability: a file with its
# permissions closed passes `-f` and then yields nothing at all.
if [ ! -f "$LEDGER" ] || [ ! -r "$LEDGER" ]; then
  echo "=== ⚠️  อ่านบัญชีหนี้ post-mortem ไม่ได้: docs/post-mortem/PENDING.md ==="
  echo "    ชั้นป้องกันหายไปหนึ่งชั้น — กู้ไฟล์หรือแก้สิทธิ์ก่อนทำงานต่อ"
  echo "    ระหว่างนี้ยืนยันไม่ได้ว่ามีหนี้ค้างหรือไม่ และ pre-commit จะบล็อกคอมมิตไว้"
  exit 0
fi

# The rows come from the one module that owns the rules. Only when Node is unavailable
# does this fall back to the shell reader, which refuses rather than guessing.
GATE="$ROOT/tools/postmortem-guard/check.js"
COUNTER="$ROOT/tools/postmortem-guard/ledger_open_count.sh"

if command -v node >/dev/null 2>&1 && [ -f "$GATE" ]; then
  DEBT_OUT="$(node "$GATE" --debt 2>&1)"
  case "$DEBT_OUT" in
    *"no open post-mortem debt"*) exit 0 ;;
  esac
  printf '%s\n' "$DEBT_OUT" | sed 's/^\[postmortem-guard\] /=== 🔴 /'
  echo "    แม่แบบ: docs/post-mortem/TEMPLATE.md"
  echo "    เขียนเสร็จแล้วเปลี่ยนแถวใน docs/post-mortem/PENDING.md เป็น DONE + ใส่ชื่อไฟล์"
  echo "    ระหว่างที่ยังค้าง pre-commit จะบล็อกคอมมิตที่ไม่ใช่การเขียนรายงาน"
  exit 0
fi

COUNT="$(bash "$COUNTER" "$LEDGER" 2>&1)"
if [ $? -ne 0 ]; then
  echo "=== ⚠️  ตรวจบัญชีหนี้ post-mortem ไม่ได้ ==="
  echo "    $COUNT"
  echo "    ยืนยันไม่ได้ว่ามีหนี้ค้างหรือไม่ — pre-commit จะบล็อกคอมมิตไว้จนกว่าจะแก้"
  exit 0
fi
[ "$COUNT" = "0" ] && exit 0

echo "=== 🔴 หนี้ post-mortem ค้างอยู่ $COUNT รายการ — ต้องเขียนเอกสารก่อนงานอื่น ==="
echo "    รายละเอียด: node tools/postmortem-guard/check.js --debt"
echo "    แม่แบบ: docs/post-mortem/TEMPLATE.md"
echo "    เขียนเสร็จแล้วเปลี่ยนแถวใน docs/post-mortem/PENDING.md เป็น DONE + ใส่ชื่อไฟล์"
echo "    ตรวจด้วย: node tools/postmortem-guard/check.js"
echo "    ระหว่างที่ยังค้าง pre-commit จะบล็อกคอมมิตที่ไม่ใช่การเขียนรายงาน"
exit 0
