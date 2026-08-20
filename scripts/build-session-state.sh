#!/bin/bash
# Regenerate the machine-written half of the session handoff note.
#
# WHY THIS EXISTS
# On 2026-08-20 a session ended while eleven background agents were still working. The next session
# was handed `.claude/session-context.md`, which is injected at SessionStart and had last been
# touched on 2026-08-16 — it described a scheduled job that had already expired, so the note was
# not merely absent, it was actively misleading. Roughly six hours and fifteen commits of work were
# invisible to the session that had to continue them.
#
# The mechanism was never unreliable; there was no writer at all. Both existing hooks only READ
# (SessionStart injects, PreCompact echoes constants). A note that must be current cannot depend on
# somebody remembering to update it — the same lesson the round report and the route map each cost
# us earlier that day. So this derives the note from artifacts the work already leaves behind: git
# history, the round's own JSON, the worktree, and the background-agent output files. It cannot be
# staler than the last commit.
#
# Output is `.claude/session-state.md`, which is GITIGNORED on purpose. `ols-qa` is a public repo and
# this runs on every turn; a tracked file would mean constant churn and one more place a host or an
# account could leak. The hand-written `.claude/session-context.md` stays tracked and is left alone.
#
# Contract: fast, quiet, and never fatal. It is wired to a Stop hook, so a failure here must not cost
# the user their turn — every section degrades to a note rather than an error.
set -uo pipefail

QA_REPO="$HOME/GitHub/ols-qa"
OUT="$QA_REPO/.claude/session-state.md"
REPOS=("$QA_REPO" "$HOME/GitHub/ols-qa-e2e" "$HOME/GitHub/ols-qa-evidence")

TMP="$(/usr/bin/mktemp -t ols-session-state)"
exec 3>&1 1>"$TMP"

echo "# Session state — regenerated automatically, do not hand-edit"
echo
echo "_Written by \`scripts/build-session-state.sh\` on every turn. Derived from git, the round JSON"
echo "and the worktree, so it cannot be staler than the last commit. Hand-written notes belong in"
echo "\`.claude/session-context.md\` instead._"
echo
echo "Generated: $(/bin/date '+%Y-%m-%d %H:%M:%S %Z')"
echo

for repo in "${REPOS[@]}"; do
  [ -d "$repo/.git" ] || continue
  name="$(/usr/bin/basename "$repo")"
  branch="$(/usr/bin/git -C "$repo" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  head="$(/usr/bin/git -C "$repo" log -1 --format='%h %s' 2>/dev/null || echo '?')"
  echo "## $name — \`$branch\` @ $head"
  echo

  # Uncommitted work is the single most important thing a resuming session needs: it is the work
  # that exists but is not yet safe, and on 2026-08-20 it was how a dead agent's edits were found.
  dirty="$(/usr/bin/git -C "$repo" status --porcelain 2>/dev/null)"
  if [ -n "$dirty" ]; then
    echo "**Uncommitted — this is unsaved work, check it before starting anything new:**"
    echo '```'
    echo "$dirty"
    echo '```'
  else
    echo "Worktree clean."
  fi
  echo

  today="$(/usr/bin/git -C "$repo" log --since=midnight --format='- `%h` %s' 2>/dev/null)"
  if [ -n "$today" ]; then
    echo "Commits today:"
    echo "$today"
    echo
  fi
done

# The round's own numbers, read from the file the round itself writes, never retyped.
REPORT="$HOME/GitHub/ols-qa-e2e/docs/round-report.md"
if [ -f "$REPORT" ]; then
  echo "## Latest E2E round"
  echo
  echo "$(/usr/bin/head -1 "$REPORT")"
  echo
  echo "_from \`docs/round-report.md\`, rebuilt by \`run-staged.sh\` at the end of each round"
  echo "(modified $(/bin/date -r "$REPORT" '+%Y-%m-%d %H:%M'))_"
  echo
  # Naming the still-red cases matters more than the totals: they are the work that remains.
  failing="$(/usr/bin/grep -E ' ❌ ' "$REPORT" 2>/dev/null |
    /usr/bin/awk -F'|' '{ id=$4; gsub(/^ +| +$/,"",id); if (id != "") print id }' | /usr/bin/head -20)"
  if [ -n "$failing" ]; then
    echo "Still failing:"
    echo "$failing" | /usr/bin/sed 's/^/- /'
    echo
  fi
fi

# Background agents outlive nothing — when the process exits they are gone, and only their output
# files remain. Listing the recent ones tells a resuming session where to look instead of assuming
# the work landed.
TASKS="$(/bin/ls -dt /private/tmp/claude-*/*/*/tasks 2>/dev/null | /usr/bin/head -1)"
if [ -n "$TASKS" ] && [ -d "$TASKS" ]; then
  recent="$(/usr/bin/find "$TASKS" -name '*.output' -size +1k -mmin -720 2>/dev/null | /usr/bin/head -12)"
  if [ -n "$recent" ]; then
    echo "## Background agents with output in the last 12h"
    echo
    echo "Their transcripts survive the process that spawned them. If a session ended while one was"
    echo "running its edits may sit uncommitted above — check the worktree before re-dispatching."
    echo
    echo "$recent" | while read -r f; do
      echo "- \`$(/usr/bin/basename "$f")\` — $(/usr/bin/stat -f '%z bytes, %Sm' -t '%H:%M' "$f" 2>/dev/null)"
    done
    echo
  fi
fi

exec 1>&3 3>&-
/bin/mv -f "$TMP" "$OUT" 2>/dev/null || /bin/rm -f "$TMP"
exit 0
