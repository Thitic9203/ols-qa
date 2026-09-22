#!/usr/bin/env bash
# ตัวส่งต่อบางๆ — คำตัดสินทั้งหมดอยู่ใน tools/discord-notify-guard/check.js
#   discord-notify-guard.sh --gate    (PreToolUse)       0 = ผ่าน · 2 = บล็อก
#   discord-notify-guard.sh --record  (UserPromptSubmit) บันทึก "อนุมัติ <รหัส>" ของเจ้าของงาน · ไม่บล็อกเสมอ
# รหัสอื่น = ตัดสินไม่ได้ → ปล่อยผ่านพร้อมเสียงดัง (การ์ดที่ล็อกเซสชันคือการ์ดที่ถูกลบทิ้ง)
set -uo pipefail
MODE="${1:-}"
ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
fi
INPUT="$(cat 2>/dev/null || true)"
CHECK="$ROOT/tools/discord-notify-guard/check.js"
if ! command -v node >/dev/null 2>&1 || [ ! -f "$CHECK" ]; then
  echo "=== ⚠️  discord-notify-guard รันไม่ได้ (node หรือ check.js หายไป) — ปล่อยผ่านแบบไม่มีการ์ด ==="
  exit 0
fi
OUT="$(printf '%s' "$INPUT" | node "$CHECK" "$MODE" 2>&1)"
RC=$?
case "$RC" in
  0)   [ -n "$OUT" ] && printf '%s\n' "$OUT"; exit 0 ;;
  2)   printf '%s\n' "$OUT" >&2; exit 2 ;;   # a block is relayed to the agent only via stderr (measured 2026-09-21)
  *)   echo "=== ⚠️  discord-notify-guard: check.js จบด้วยรหัส $RC (ไม่ใช่คำตัดสิน) — ปล่อยผ่าน ==="
       [ -n "$OUT" ] && printf '%s\n' "$OUT"
       exit 0 ;;
esac
