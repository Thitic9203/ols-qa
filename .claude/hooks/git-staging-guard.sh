#!/bin/bash
# กันการ stage แบบเหมา — worktree นี้มีหลาย session ทำงานพร้อมกัน
#
# PreToolUse บน Bash: ปฏิเสธคำสั่งที่เอาไฟล์เข้า index โดยไม่ระบุชื่อไฟล์
# (git add -A · git add . · git add <โฟลเดอร์>/ · git commit -a) เพราะคำสั่งพวกนี้
# มองไม่เห็นความต่างระหว่าง "ไฟล์ของงานรอบนี้" กับ "ไฟล์ที่อีก session เพิ่งเขียนไป 4 วินาทีก่อน"
#
# อ่าน · diff · commit index ที่ถูกต้องอยู่แล้ว ไม่โดนอะไรเลย
#
# exit 0 = ผ่าน · exit 2 = บล็อก (เหตุผลออก stderr กลับไปหา agent)
#
# node พังเมื่อไหร่ = เตือนแล้วปล่อยผ่าน ความเสียหายที่ชั้นนี้กันคือ "กวาดไฟล์คนอื่น"
# ซึ่งกู้คืนได้เสมอ ต่างจาก secret guard ที่ต้อง fail-closed เพราะ secret ที่หลุดขึ้น
# GitHub แล้วเอากลับไม่ได้ การบล็อก git ทุกคำสั่งเพราะ node พัง แพงกว่าสิ่งที่กัน
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
fi

INPUT="$(cat 2>/dev/null || true)"
RULES="$ROOT/tools/git-staging-guard/staging_rules.js"

if ! command -v node >/dev/null 2>&1 || [ ! -f "$RULES" ]; then
  echo "=== ⚠️  git-staging-guard รันไม่ได้ (ไม่มี node หรือ staging_rules.js หาย) ===" >&2
  echo "    กฎยังบังคับอยู่: stage ต้องระบุไฟล์ทีละตัว ห้าม git add -A / . / <โฟลเดอร์>/ / commit -a" >&2
  exit 0
fi

node -e '
const fs = require("fs"), path = require("path");
const R = require(process.argv[1]);
let hook = {};
try { hook = JSON.parse(fs.readFileSync(0, "utf8")); } catch {}
const cmd = (hook.tool_input && hook.tool_input.command) || "";
const cwd = hook.cwd || process.cwd();
const isDir = (p) => {
  try { return fs.statSync(path.resolve(cwd, p)).isDirectory(); } catch { return false; }
};
const d = R.decideCommand(cmd, isDir);
if (!d.block) process.exit(0);
process.stderr.write(
`BLOCKED — ห้าม stage แบบเหมาใน worktree ที่มีหลาย session ทำงานพร้อมกัน

  คำสั่ง : ${d.segment}
  ปัญหา  : ${d.reason}

ให้ระบุไฟล์ทีละตัวแทนครับ เช่น
  git add path/to/file-a.js path/to/file-b.sh

อ่าน git status --short ให้ครบก่อน แล้ว add เฉพาะไฟล์ของงานรอบนี้
ไฟล์ที่ไม่ใช่ของงานรอบนี้ = ปล่อยไว้ ห้ามกวาด ห้ามลบ

เหตุ: 2026-09-05 คอมมิตที่ stage ด้วย path กวาดไฟล์กลางคันของอีก session ขึ้น main
ทำให้ครึ่งฟีเจอร์ขึ้นสาขาหลักและเทสต์แดงอยู่พักหนึ่ง (CLAUDE.md · tools/git-staging-guard/)
`);
process.exit(2);
' "$RULES" <<< "$INPUT"
exit $?
