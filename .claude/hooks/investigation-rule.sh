#!/bin/bash
# กฎหลักของ repo เรื่องการตรวจสอบปัญหา — ชั้นที่ "พูด"
#
# ห้ามเดา ห้ามมโน ห้ามสรุปก่อนตรวจของจริง และการตรวจสอบต้องใช้
# superpowers:systematic-debugging เป็นหลักเท่านั้น (คำสั่งเจ้าของงาน)
#
# ต่อไว้ 2 จุด:
#   SessionStart      อ่านกฎขึ้นมาทุก session — compaction กินไม่ได้ ลืมไม่ได้
#   UserPromptSubmit  prompt ไหนรูปทรง "ปัญหา" ให้สั่งเงื่อนไขซ้ำ + ติดธงไว้ให้ Stop gate
#
# ชั้นนี้ "ไม่มี logic ตัดสินเป็นของตัวเอง" โดยเจตนา — การตัดสินอยู่ที่
# tools/investigation-guard/investigation_rules.js ที่เดียว. สอง runtime ที่ถือ regex ชุด
# เดียวกันคือสองคำตอบที่รอวันไม่ตรงกัน และวันที่ไม่ตรงกัน ตัวที่ตะโกนกับตัวที่บล็อกจะเลิก
# พูดถึงกฎข้อเดียวกัน = การ์ดเริ่มโกหก. ที่นี่จึงพิมพ์ "ตัวกฎ" ซึ่ง drift ไม่ได้ แล้วส่ง
# การตัดสินต่อให้ node
#
# ALWAYS exits 0 — ตัวเตือนที่ทำให้ session พังคือตัวเตือนที่ถูกถอดทิ้ง
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
fi

INPUT="$(cat 2>/dev/null || true)"
EVENT="$(printf '%s' "$INPUT" | sed -n 's/.*"hook_event_name"[[:space:]]*:[[:space:]]*"\([A-Za-z]*\)".*/\1/p' | head -1)"
[ -z "$EVENT" ] && EVENT="SessionStart"

if [ "$EVENT" = "SessionStart" ]; then
  cat <<'RULE'
=== 🔴 กฎหลักของ repo — การตรวจสอบปัญหา (บังคับทุก session ไม่มีข้อยกเว้น) ===
1. ห้ามเดา ห้ามมโน ห้ามสรุปก่อนไปตรวจของจริงอย่างละเอียด
2. การตรวจสอบและการแก้ไขทุกครั้ง ใช้สกิล superpowers:systematic-debugging เป็นหลักเท่านั้น
   (เรียกเองในเธรดหลัก หรือแยก subagent ที่สั่งให้เรียกสกิลนี้ ก็นับทั้งคู่)
3. มีได้ 3 สถานะ — ตรวจแล้ว (แนบ path:line หรือ output จริง) · ยังไม่ตรวจ (พูดตรงๆ แล้วไปตรวจ)
   · ตรวจไม่ได้ (บอกว่าติดอะไร ต้องมีอะไรถึงตรวจได้ แล้วหยุดถาม)
4. บังคับด้วยเครื่อง ไม่ใช่ความจำ — prompt ที่เข้าข่ายจะถูกติดธง และ Stop hook จะไม่ยอมให้
   จบเทิร์นถ้ายังไม่เคยเรียกสกิลนั้น · ดู tools/investigation-guard/README.md
RULE
  exit 0
fi

# UserPromptSubmit — ให้ node เป็นคนตัดสินว่าเข้าข่ายไหม แล้วติดธง
if command -v node >/dev/null 2>&1 && [ -f "$ROOT/tools/investigation-guard/check.js" ]; then
  printf '%s' "$INPUT" | node "$ROOT/tools/investigation-guard/check.js" --arm 2>/dev/null || true
else
  echo "=== ⚠️  investigation-guard ตัดสินไม่ได้รอบนี้ (ไม่มี node หรือไฟล์ check.js หาย) ==="
  echo "    กฎยังบังคับอยู่เหมือนเดิม: ห้ามเดา และการตรวจสอบต้องใช้ superpowers:systematic-debugging"
  echo "    แต่ชั้นที่บล็อกอัตโนมัติใช้การไม่ได้ — ต้องกู้ก่อน ห้ามถือว่าผ่าน"
fi
exit 0
