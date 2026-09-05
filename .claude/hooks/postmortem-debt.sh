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

# A missing ledger is itself worth saying out loud — silence would read as "no debt".
if [ ! -f "$LEDGER" ]; then
  echo "=== ⚠️  post-mortem ledger MISSING: docs/post-mortem/PENDING.md ==="
  echo "    ชั้นป้องกันหายไปหนึ่งชั้น — กู้ไฟล์คืนก่อนทำงานต่อ"
  exit 0
fi

OPEN_ROWS="$(awk -F'|' '
  /^[[:space:]]*\|/ {
    if (NF < 7) next
    id = $2; occurred = $3; symptom = $4; status = $6
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", id)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", occurred)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", symptom)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", status)
    if (status == "OPEN" && id ~ /^PM-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}$/)
      printf "  - %s (%s)  %s\n", id, occurred, symptom
  }
' "$LEDGER" 2>/dev/null)"

if [ -z "$OPEN_ROWS" ]; then
  exit 0
fi

COUNT="$(printf '%s\n' "$OPEN_ROWS" | grep -c '^  - ')"

echo "=== 🔴 หนี้ post-mortem ค้างอยู่ $COUNT รายการ — ต้องเขียนเอกสารก่อนงานอื่น ==="
printf '%s\n' "$OPEN_ROWS"
echo "    แม่แบบ: docs/post-mortem/TEMPLATE.md"
echo "    เขียนเสร็จแล้วเปลี่ยนแถวใน docs/post-mortem/PENDING.md เป็น DONE + ใส่ชื่อไฟล์"
echo "    ตรวจด้วย: node tools/postmortem-guard/check.js"
echo "    ระหว่างที่ยังค้าง pre-commit จะบล็อกคอมมิตที่ไม่ใช่การเขียนรายงาน"
exit 0
