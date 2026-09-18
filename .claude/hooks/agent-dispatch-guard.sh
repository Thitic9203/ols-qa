#!/usr/bin/env bash
# agent-dispatch-guard.sh — PreToolUse gate on the Agent tool.
#
# This shell layer PRINTS and RELAYS. Every decision is made by
# tools/agent-dispatch-guard/dispatch_rules.js. Two runtimes holding the same
# rules are two answers waiting to disagree (post-mortem #0003), so there is
# no regex here.
#
# fail-closed: if node is missing, or the guard cannot run, the dispatch is
# REFUSED. "cannot check" must never read as "clean" (#0005). The cost of a
# wrong refusal is one message; the cost of a wrong allow is a whole agent's
# work lost the next time the stream stalls.
#
# exit 0 = allow · exit 2 = block (Claude Code treats 2 on PreToolUse as a block)

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
GUARD="$ROOT/tools/agent-dispatch-guard/check.js"

PAYLOAD="$(cat)"

if [ ! -f "$GUARD" ]; then
  echo "[agent-dispatch-guard] $GUARD is missing — refusing the dispatch rather than running unchecked" >&2
  exit 2
fi

NODE_BIN=""
for c in node /usr/local/bin/node /opt/homebrew/bin/node /opt/local/bin/node; do
  if command -v "$c" >/dev/null 2>&1; then NODE_BIN="$c"; break; fi
done
if [ -z "$NODE_BIN" ]; then
  echo "[agent-dispatch-guard] no node runtime found — refusing (a guard that cannot run must not allow)" >&2
  exit 2
fi

OUT="$(printf '%s' "$PAYLOAD" | "$NODE_BIN" "$GUARD" 2>&1)"
RC=$?

if [ $RC -eq 0 ]; then
  [ -n "$OUT" ] && echo "$OUT"
  exit 0
fi

echo "$OUT" >&2
exit 2
