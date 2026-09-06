#!/bin/bash
# Runs every test suite in this repo, and refuses when it measured none.
#
# This is the command CLAUDE.md tells a person to run before committing. It exists so that
# instruction is not a pattern anyone types: the suite list comes from list-test-suites.sh,
# the same script the pre-push hook and the CI workflow call. When the pattern lived in three
# places they drifted, and the copy without a zero-suite refusal printed a tick over a commit
# it had never measured (report #0006).
#
# exit 0 = every suite passed · 1 = a suite failed, or there were none, or the list could not
# be read. "Could not run" and "nothing to run" are never reported as a pass.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || ROOT=""
[ -n "$ROOT" ] || ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LISTER="$ROOT/scripts/list-test-suites.sh"

if [ ! -f "$LISTER" ]; then
  echo "[ols-qa] ❌ หา scripts/list-test-suites.sh ไม่เจอ — ตรวจไม่ได้ ไม่เท่ากับตรวจแล้วผ่าน"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[ols-qa] ❌ ไม่มี node — รันชุดเทสต์ไม่ได้"
  exit 1
fi

# The status is read on its own line, never folded into the assignment: under `set -e` a bare
# V="$(cmd)" aborts before any `case $?` can run, and the refusal then carries no reason.
SUITES="$(bash "$LISTER" "$ROOT")"
LIST_RC=$?
case "$LIST_RC" in
  0) ;;
  1) echo "[ols-qa] ❌ ไม่พบไฟล์เทสต์เลยสักไฟล์ — ไม่มีอะไรให้วัด ไม่เท่ากับวัดแล้วผ่าน"; exit 1 ;;
  *) echo "[ols-qa] ❌ อ่านรายชื่อชุดเทสต์ไม่ได้ (lister จบด้วยรหัส $LIST_RC)"; exit 1 ;;
esac

rc=0
found=0
while IFS= read -r t; do
  [ -n "$t" ] || continue
  found=$((found + 1))
  node "$ROOT/$t" || rc=1
done <<< "$SUITES"

# Its own zero-check, not borrowed from the lister: `<<< "$SUITES"` on an empty value yields one
# empty line, not zero lines, so a lister that ever exits 0 with nothing on stdout would leave
# found=0 here and this loop would otherwise fall straight through to a tick.
if [ "$found" -eq 0 ]; then
  echo "[ols-qa] ❌ วัดไปได้ 0 ชุด — รายชื่อตอบว่าสำเร็จแต่ไม่มีชื่อไหนออกมา"
  exit 1
fi

if [ "$rc" -ne 0 ]; then
  echo "[ols-qa] ❌ เทสต์ไม่ผ่าน — วัดไป $found ชุด"
  exit 1
fi

echo "[ols-qa] ✅ เขียวครบ $found ชุด"
exit 0
