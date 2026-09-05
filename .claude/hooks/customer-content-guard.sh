#!/bin/bash
# The last gap: a shell command typed by hand.
#
# Nine layers stop the toolkit from touching HI's `[RGS]` fixtures — the scanner, the alert,
# the notifier, the write guard, the ten mutators and their runner. None of them is in the way
# of somebody opening a terminal and issuing the request directly. That path is not hypothetical:
# it is how most one-off content changes on pre-prod have actually been made, including by an
# agent following a fix list.
#
# So this sits on the Bash tool itself (PreToolUse). It sees every shell command whatever binary
# path it uses — `curl`, `/usr/bin/curl`, python, node, httpie — which a shell function or a PATH
# shim cannot, because a command written with a slash in it skips both.
#
# WHAT IT BLOCKS: a command that (a) names the customer's marker, (b) would change something,
# and (c) is aimed at an OLS environment. All three, so ordinary work is untouched — reading an
# `[RGS]` row, grepping for it, editing this repo's own files, or PATCHing a Discord alert whose
# text quotes it, all pass.
#
# Exit 0 = allow. Exit 2 = block, and the reason on stderr goes back to the agent.
#
# PUBLIC REPO: no hostname is written here. The environment hosts are read at runtime from the
# off-repo secrets dir; when that is unreadable the check falls back to OLS API path shapes,
# which are not secret.
set -uo pipefail

INPUT="$(cat)"

# The command the Bash tool is about to run. Prefer python for correct JSON decoding; if that is
# unavailable, fall back to the raw payload — over-matching here can only cause a false BLOCK,
# never a false ALLOW, and a false block is the cheap direction.
# The exit status is checked, not just the output. A python3 that a PATH shim has replaced
# prints its own refusal ON STDOUT and exits non-zero — a NON-EMPTY wrong value, which slid
# past a `[ -z ... ]` fallback and became the "command" this guard then searched for a marker
# in. That machine has carried such a shim before (memory python3-shim-breaks-guard).
CMD_RC=0
CMD="$(printf '%s' "$INPUT" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("command", "") or "")
except Exception:
    print("")
' 2>/dev/null)" || CMD_RC=$?
if [ "$CMD_RC" -ne 0 ] || [ -z "$CMD" ]; then CMD="$INPUT"; fi

# (a) Does it name the marker? Compared on normalised text, for the same reason the toolkit
# does: `[R<zwsp>GS]` and `[ＲＧＳ]` read on screen exactly as `[RGS]` does.
MARKER_RC=0
MARKER="$(printf '%s' "$CMD" | python3 -c '
import sys, unicodedata, re
raw = sys.stdin.read()
t = unicodedata.normalize("NFKC", raw)
t = re.sub(r"[­​-‏⁠⁦-⁩﻿]", "", t)
print("RGS" if re.search(r"(?<![A-Za-z])RGS(?![A-Za-z])", t, re.I) else "")
' 2>/dev/null)" || MARKER_RC=$?

# "Could not check" is not "nothing found". An empty MARKER used to exit 0 outright, so every
# way this normaliser can fail — absent, shimmed, erroring — turned the guard off silently
# while it still reported success. Measured 2026-09-06: all three modes allowed a write aimed
# at customer content. When it fails, fall back to a deliberately over-inclusive match that
# needs no interpreter, and if even that finds nothing, DO NOT exit here — carry the doubt
# down to the block decision, where a write aimed at an OLS environment is refused anyway.
NORMALISED=1
if [ "$MARKER_RC" -ne 0 ]; then
  NORMALISED=0
  MARKER=""
  # Tolerates characters wedged between the letters, which is the cheap version of what the
  # normaliser does properly; the fullwidth form is matched literally.
  if printf '%s' "$CMD" | grep -qiE 'R[^A-Za-z0-9]{0,3}G[^A-Za-z0-9]{0,3}S' \
     || printf '%s' "$CMD" | grep -qF 'ＲＧＳ'; then
    MARKER="RGS"
  fi
fi

if [ -z "$MARKER" ] && [ "$NORMALISED" -eq 1 ]; then exit 0; fi

# (b) Would it change anything? A read is always fine — that is how anyone checks what is there.
if ! printf '%s' "$CMD" | grep -Eqi -- '-X[[:space:]]*(POST|PUT|PATCH|DELETE)|--request[[:space:]]+(POST|PUT|PATCH|DELETE)|--data|--form|-d[[:space:]]|--upload-file|method[[:space:]]*[:=][[:space:]]*.?(POST|PUT|PATCH|DELETE)'; then
  exit 0
fi

# (c) Is it aimed at an OLS environment? Hosts come from the off-repo secrets dir so that no
# hostname ever appears in this public repo.
TARGETS=""
for f in "$HOME"/.ols-qa-secrets/*.env; do
  [ -f "$f" ] || continue
  TARGETS="$TARGETS $(sed -n 's|^OLS_ORIGIN=https\{0,1\}://||p' "$f" | tr -d '"'"'"' \r')"
done

hit=""
for h in $TARGETS; do
  [ -z "$h" ] && continue
  printf '%s' "$CMD" | grep -qF -- "$h" && { hit="$h"; break; }
done

# Fallback when the secrets dir is unreadable: the OLS content endpoints themselves. Path shapes
# are not secret, and without this a missing secrets dir would silently turn the check off.
if [ -z "$hit" ]; then
  printf '%s' "$CMD" | grep -Eq -- '/api/(media|courses|learning-paths|achievements|livestreams)' && hit="OLS API path"
fi
[ -z "$hit" ] && exit 0

# Reaching here means: a write, aimed at an OLS environment. If the marker was found, that is
# the customer's fixture. If the normaliser could not run, we cannot tell whose row it is —
# and the guard refuses rather than guesses, because the mistake it exists to prevent cannot
# be undone by us. Over-blocking costs one confirmation; the other direction costs the
# customer's data.
if [ -z "$MARKER" ]; then
  MARKER="ตรวจไม่ได้ — ตัวปรับข้อความ (python3) ทำงานไม่ได้ จึงยืนยันไม่ได้ว่าแตะของลูกค้าหรือเปล่า"
fi

cat >&2 <<EOF
BLOCKED — คำสั่งนี้จะแก้ข้อมูลที่เป็นของลูกค้า

  marker : $MARKER  (= ข้อมูลทดสอบของ HI)
  target : $hit

RGS = fixture ของ HI บน catalogue ที่ใช้ร่วมกัน — ห้ามแก้ ห้ามลบ ห้ามเปลี่ยนชื่อ ทุกกรณี
(กฎเจ้าของงาน 2026-08-25 · CLAUDE.md · tools/name-guard/README.md §Customer-owned content)

อ่านได้ตามปกติ — ที่ถูกปิดคือคำสั่งที่ "เขียน" เท่านั้น
ถ้าเป็นแถวของเราเองที่บังเอิญมีคำว่า RGS อยู่ในข้อความ ให้ยืนยันกับเจ้าของงานก่อน อย่าปลดการ์ด
EOF
exit 2
