#!/usr/bin/env bash
# Activate ols-qa git hooks (pre-commit + pre-push gates).
# Shared skill files are edited in Helix only; ols-qa receives them via .github/workflows/helix-sync.yml
# (docs/sdd/helix-sync-pull R1, R9).
# Run once per clone:  bash scripts/setup-hooks.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
chmod +x "$ROOT"/scripts/hooks/* 2>/dev/null || true
git -C "$ROOT" config core.hooksPath scripts/hooks
echo "✅ ols-qa hooks active (core.hooksPath=scripts/hooks)."
echo "   Shared skills: edit in Helix; this repo receives them via .github/workflows/helix-sync.yml."
