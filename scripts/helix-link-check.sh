#!/bin/bash
# helix-link-check.sh — does the helix install carry an internal markdown link that points at nothing?
#
#   bash scripts/helix-link-check.sh            # the helix checkout helix-parity.sh compares
#   bash scripts/helix-link-check.sh <root>     # any tree, e.g. this repo
#
# Reads the working tree of <root> (what an install actually holds), every *.md under it.
# Rules and output contract live in tools/link-check/check.js:
#   exit 0  LINK-CHECK OK <n> links in <m> files
#   exit 1  "<file>:<line> -> <target>" per broken link, then LINK-CHECK BROKEN <k>
#   exit 2  CANNOT-VERIFY <reason>
#
# Env: HELIX_REPO (default: the directory beside this clone's main checkout, i.e. ../helix)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=git-env-clean.sh
. "$HERE/git-env-clean.sh"
git_env_clean 2>/dev/null || true

cannot() { echo "CANNOT-VERIFY $*"; exit 2; }
command -v node >/dev/null 2>&1 || cannot "node not found"

ROOT="${1:-}"
if [ -z "$ROOT" ]; then
  OLS="$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null)" || cannot "ols-qa is not a git work tree"
  # The main checkout, not a linked worktree: ../helix sits beside the main clone (same as helix-parity.sh).
  COMMON="$(git -C "$OLS" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || cannot "cannot locate ols-qa git dir"
  ROOT="${HELIX_REPO:-$(dirname "$COMMON")/../helix}"
  git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || cannot "helix repo not found (set HELIX_REPO)"
fi

exec node "$HERE/../tools/link-check/check.js" "$ROOT"
