#!/usr/bin/env bash
# Fail if committed skills/commands contain machine paths or single-project coupling.
# Excludes docs that list forbidden patterns as examples.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GLOBS=(skills commands)
EXCLUDES=(
  '!references/portable-content.md'
  '!**/gotchas.md'
)

PATTERNS=(
  '/Users/'
  'C:\\Users'
  '~/.helix'
  '~/.cursor'
  'pd3-web-portal'
  'pd3-api'
  'pw:login:pd3'
  'playwright.e2e.config'
  'learner-mhesi'
  'mycreditport.com'
)

ARGS=()
for g in "${GLOBS[@]}"; do
  ARGS+=("$g")
done
for e in "${EXCLUDES[@]}"; do
  ARGS+=("-g" "$e")
done

FOUND=0
for pat in "${PATTERNS[@]}"; do
  if rg -n --fixed-strings "$pat" "${ARGS[@]}" 2>/dev/null; then
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo "::error::Portable-content violation in skills/ or commands/. See references/portable-content.md"
  exit 1
fi

echo "ok: no portable-content violations in skills/ and commands/"
