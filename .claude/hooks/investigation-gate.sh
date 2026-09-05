#!/bin/bash
# กฎหลักของ repo เรื่องการตรวจสอบปัญหา — ชั้นที่ "บล็อก"
#
# Stop hook: ถ้าเทิร์นนี้ถูกติดธงว่าเป็นการตรวจสอบปัญหา แต่ตลอดทั้งเทิร์นไม่เคยเรียก
# superpowers:systematic-debugging เลย = ปฏิเสธไม่ให้จบเทิร์น (exit 2, เหตุผลออก stderr
# กลับไปหา agent)
#
# ทำไมต้องเป็น Stop ไม่ใช่แค่ข้อความเตือน: ข้อความเตือนถูกอ่านแล้วเดินผ่านได้ การจบเทิร์น
# ไม่ได้ ผ่านไม่ได้. นี่คือจุดเดียวในวงจรที่ "สรุปโดยไม่สืบ" ถูกจับได้จริง เพราะกว่าจะถึง
# ตรงนี้ ข้อสรุปถูกเขียนไปแล้ว และ hook เห็น transcript ทั้งเทิร์น
#
# node พังเมื่อไหร่ = ตะโกนดังๆ แล้วปล่อยผ่าน (exit 0) — การ์ดที่พังแล้วขังงานเอาไว้
# คือการ์ดที่ถูกถอดทิ้งภายในวันเดียว ชั้น bash ที่ SessionStart/UserPromptSubmit ยังพูดอยู่
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
fi

INPUT="$(cat 2>/dev/null || true)"
CHECK="$ROOT/tools/investigation-guard/check.js"

if ! command -v node >/dev/null 2>&1 || [ ! -f "$CHECK" ]; then
  # ไม่มีธงติดอยู่ก็ไม่ต้องพูดอะไร — เตือนเฉพาะตอนที่มีของค้างจริง
  if ls "$ROOT/.claude/.investigation-state/"*.json >/dev/null 2>&1; then
    echo "=== ⚠️  investigation gate รันไม่ได้ ทั้งที่มีธงการตรวจสอบค้างอยู่ ==="
    echo "    ชั้นที่บล็อกหายไป — ห้ามถือว่าผ่าน ต้องกู้ node / tools/investigation-guard/check.js ก่อน"
  fi
  exit 0
fi

printf '%s' "$INPUT" | node "$CHECK" --gate
exit $?
