#!/bin/bash
# Inject OLS QA workspace context at session start.
# This repo is PUBLIC — no real URLs, hosts, ids or accounts may be hardcoded here.
# Live links come from the local, untracked secrets store.
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Layer 3 of the post-mortem defence: an unpaid debt from a previous session is the first
# thing this session hears, before anything else can crowd it out. Prints nothing when
# there is no debt, and can never fail the hook.
bash "$CLAUDE_PROJECT_DIR/.claude/hooks/postmortem-debt.sh" 2>/dev/null || true

# Auto-update skills from remote
BEFORE=$(git rev-parse HEAD 2>/dev/null)
git pull --ff-only origin main --quiet 2>/dev/null
AFTER=$(git rev-parse HEAD 2>/dev/null)
if [ "$BEFORE" != "$AFTER" ]; then
  echo "=== Skills updated ($(git log --oneline "$BEFORE".."$AFTER" 2>/dev/null | wc -l | tr -d ' ') new commit(s)) ==="
fi

echo "=== OLS QA Workspace ==="

SECRETS="$HOME/.ols-qa-secrets/ols-secrets.md"
if [ -f "$SECRETS" ]; then
  echo "Config store: $SECRETS (local, untracked — holds the real URLs/accounts/ids)"
  echo "Repo docs use placeholders only: <JIRA_DOMAIN> <DEV_HOST> <TEST_ACCOUNT_n> ..."
else
  echo "!!  $SECRETS not found — OLS links/accounts unavailable this session."
  echo "    Restore it from your password manager or ask the QA Lead; do NOT paste"
  echo "    real values into this repo, it is public."
fi
echo ""
echo "Helix commands: /helix  /tc-fe-prep  /tc-api-prep  /retest-bug  /testing-ticket  /create-bug"
echo ""

# Machine-written state first: it is regenerated on every turn by the Stop hook, so it is the only
# part of this injection that cannot be stale. The hand-written note below it can be days old — on
# 2026-08-20 it was four days old and described an expired job while eleven agents' work went
# unmentioned, which is the reason this section exists.
if [ -f .claude/session-state.md ]; then
  echo "=== Session state (auto-generated, current) ==="
  cat .claude/session-state.md
  echo ""
fi

# Show WIP context if exists
if [ -f .claude/session-context.md ]; then
  echo "=== WIP Context (hand-written — check its date before trusting it) ==="
  cat .claude/session-context.md
fi
