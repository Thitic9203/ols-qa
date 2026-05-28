#!/usr/bin/env bash
# Bump patch version, commit, and push (CI only). No-op if bump not needed.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! BASE_REF="${BASE_REF:-}" HEAD_REF="${HEAD_REF:-}" "$ROOT/scripts/ci-needs-version-bump.sh"; then
  echo "No automated version bump required."
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

OLD="$(tr -d '[:space:]' < VERSION)"
"$ROOT/scripts/bump-version.sh" patch
NEW="$(tr -d '[:space:]' < VERSION)"

git add VERSION .claude-plugin/plugin.json .claude-plugin/marketplace.json README.md
git commit -m "chore(ci): bump version ${OLD} -> ${NEW} [automated]"

"$ROOT/scripts/sync-version.sh" --check

git push origin HEAD:main

echo "Pushed automated version bump: ${OLD} -> ${NEW}"
