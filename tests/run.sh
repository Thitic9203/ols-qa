#!/usr/bin/env bash
# Helix QA — run all checks
# Usage: ./tests/run.sh [check-number]
#   ./tests/run.sh        → run all 4 checks
#   ./tests/run.sh 2      → run check 2 only

set -euo pipefail
TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"

OVERALL_PASS=0
OVERALL_FAIL=0

run_check() {
  local script="$1"
  chmod +x "$script"
  if bash "$script"; then
    ((OVERALL_PASS++))
  else
    ((OVERALL_FAIL++))
  fi
  echo ""
}

echo "┌─────────────────────────────────────┐"
echo "│  Helix QA Validation                │"
echo "└─────────────────────────────────────┘"
echo ""

if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  # Run single check
  script="$TESTS_DIR/0${1}-"*".sh"
  run_check $script
else
  # Run all checks
  for script in "$TESTS_DIR"/0*.sh; do
    run_check "$script"
  done
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $OVERALL_FAIL -eq 0 ]]; then
  echo "✅ All checks passed ($OVERALL_PASS/$((OVERALL_PASS + OVERALL_FAIL)))"
else
  echo "❌ $OVERALL_FAIL check(s) failed — fix errors above before releasing"
  exit 1
fi
