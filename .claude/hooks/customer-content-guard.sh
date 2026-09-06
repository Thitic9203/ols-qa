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

# Choose the interpreter deterministically, the way scripts/check-no-secrets.sh already does.
# A plugin on this machine prepends a `python3` shim to PATH that refuses (and has hung) instead
# of executing; a bare `python3` here therefore fails, and while the guard now refuses rather
# than allowing when that happens, refusing every write to an OLS environment because of a shim
# is a guard people would work around. First candidate that is not a shim and can actually run a
# trivial program wins; an empty PYBIN is handled at each call site, never assumed away.
PYBIN=""
for cand in /opt/homebrew/bin/python3 /usr/bin/python3 /usr/local/bin/python3 "$(command -v python3 2>/dev/null)"; do
  case "$cand" in ""|*hooks/shims*) continue ;; esac
  [ -x "$cand" ] || continue
  if "$cand" -c "pass" >/dev/null 2>&1; then PYBIN="$cand"; break; fi
done

# The marker tokens come from tools/name-guard/customer_content.js — the single source every
# other layer of the toolkit already reads (scan.js, write_guard.js, alert_format.js, notify.js
# all `require('./customer_content')`; this hook was the one place that still spelled the token
# itself). Resolved via node, which is this repo's own runtime and is on PATH in every real
# invocation; the path is built from this script's own location so it does not depend on the
# caller's cwd. When node cannot be found or the module cannot be read, the one token known at
# the time this line was written is the fail-closed default — the same shape as the OLS-host
# fallback further down when the secrets dir is unreadable: a source going dark does not mean
# the check gets to do nothing.
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
MARKER_TOKENS=""
if [ -n "$HOOK_DIR" ] && command -v node >/dev/null 2>&1; then
  CC_MODULE="$HOOK_DIR/../../tools/name-guard/customer_content.js"
  if [ -f "$CC_MODULE" ]; then
    MARKER_TOKENS="$(node -e '
      try {
        const c = require(process.argv[1]);
        process.stdout.write(c.CUSTOMER_MARKERS.map((m) => m.token).join(" "));
      } catch (e) { /* leave empty — the fallback below covers it */ }
    ' "$CC_MODULE" 2>/dev/null)"
  fi
fi
[ -z "$MARKER_TOKENS" ] && MARKER_TOKENS="RGS"

# The command the Bash tool is about to run. Prefer python for correct JSON decoding; if that is
# unavailable, fall back to the raw payload — over-matching here can only cause a false BLOCK,
# never a false ALLOW, and a false block is the cheap direction.
# The exit status is checked, not just the output. A python3 that a PATH shim has replaced
# prints its own refusal ON STDOUT and exits non-zero — a NON-EMPTY wrong value, which slid
# past a `[ -z ... ]` fallback and became the "command" this guard then searched for a marker
# in. That machine has carried such a shim before (memory python3-shim-breaks-guard).
CMD_RC=127
CMD=""
if [ -n "$PYBIN" ]; then
  CMD_RC=0
  CMD="$(printf '%s' "$INPUT" | "$PYBIN" -c '
import json,sys
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("command", "") or "")
except Exception:
    print("")
' 2>/dev/null)" || CMD_RC=$?
fi
if [ "$CMD_RC" -ne 0 ] || [ -z "$CMD" ]; then CMD="$INPUT"; fi

# (a) Does it name the marker? Compared on normalised text, for the same reason the toolkit
# does: `[R<zwsp>GS]` and `[ＲＧＳ]` read on screen exactly as `[RGS]` does.
MARKER_RC=127
MARKER=""
if [ -n "$PYBIN" ]; then
MARKER_RC=0
MARKER="$(printf '%s' "$CMD" | MARKER_TOKENS="$MARKER_TOKENS" "$PYBIN" -c '
import sys, os, unicodedata, re
raw = sys.stdin.read()
t = unicodedata.normalize("NFKC", raw)
t = re.sub(r"[­​-‏⁠⁦-⁩﻿]", "", t)
found = ""
for tok in os.environ.get("MARKER_TOKENS", "").split():
    if re.search(r"(?<![A-Za-z])" + re.escape(tok) + r"(?![A-Za-z])", t, re.I):
        found = tok
        break
print(found)
' 2>/dev/null)" || MARKER_RC=$?
fi

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
  # No interpreter left to normalise with, so this tolerates characters wedged between a
  # token's own letters — the cheap version of what NFKC does properly above — built from the
  # same $MARKER_TOKENS list rather than retyped. The fullwidth literal is checked only for the
  # one token this branch was written against ("RGS"); a token added later still gets the ASCII
  # fuzzy match here even before anyone extends the fullwidth line for it too.
  for tok in $MARKER_TOKENS; do
    fuzzy="" i=0 len=${#tok}
    while [ "$i" -lt "$len" ]; do
      [ "$i" -gt 0 ] && fuzzy="${fuzzy}[^A-Za-z0-9]{0,3}"
      fuzzy="${fuzzy}${tok:$i:1}"
      i=$((i + 1))
    done
    if printf '%s' "$CMD" | grep -qiE -- "$fuzzy"; then MARKER="$tok"; break; fi
    if [ "$tok" = "RGS" ] && printf '%s' "$CMD" | grep -qF 'ＲＧＳ'; then MARKER="$tok"; break; fi
  done
fi

if [ -z "$MARKER" ] && [ "$NORMALISED" -eq 1 ]; then exit 0; fi

# (b) Would it change anything? A read is always fine — that is how anyone checks what is there.
#
# Every short form must be listed beside its long form, and a short flag must be allowed to
# carry its value GLUED to it, because that is how people actually type curl. The first
# version required whitespace after `-d` and knew nothing of `-T`, `-F` or `--json`;
# measured 2026-09-06 against this very regex, `curl -d'{…}'`, `curl -d@payload.json`,
# `curl -T cover.png`, `curl -F file=@a.png` and `curl --json '{…}'` were all classified as
# READS and took the exit below — before the marker or the target were ever considered.
# Each of those implies POST or PUT in curl, so the calls that got through were precisely
# the destructive ones.
#
# The line is deliberately over-inclusive: `-d` on a `-G` request is a query string, not a
# write, and it is matched anyway. Over-blocking costs a rephrasing; under-blocking costs
# the customer's fixtures, and this file has no override to reach for (report #0005).
if ! printf '%s' "$CMD" | grep -Eqi -- \
  '-X[[:space:]]*(POST|PUT|PATCH|DELETE)|--request[[:space:]]*(POST|PUT|PATCH|DELETE)|--data(-raw|-binary|-urlencode)?|--form(-string)?|--upload-file|--json|(^|[[:space:]])-[A-Za-z]*[dFT]([[:space:]]|@|=|'"'"'|"|$)|method[[:space:]]*[:=][[:space:]]*.?(POST|PUT|PATCH|DELETE)'; then
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
