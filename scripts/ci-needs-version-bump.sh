#!/usr/bin/env bash
# Exit 0 if workflow files changed between BASE_REF and HEAD_REF but VERSION did not.
# Usage: BASE_REF=before_sha HEAD_REF=after_sha ./scripts/ci-needs-version-bump.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${BASE_REF:-HEAD~1}"
HEAD="${HEAD_REF:-HEAD}"

CHANGED="$(git -C "$ROOT" diff --name-only "$BASE" "$HEAD" 2>/dev/null || true)"

if [ -z "$CHANGED" ]; then
  exit 1
fi

WORKFLOW_PATTERN='^(skills/[^/]+/SKILL\.md|commands/[^/]+\.md|references/[^/]+\.md|skills/[^/]+/references/)'

if ! echo "$CHANGED" | grep -qE "$WORKFLOW_PATTERN"; then
  exit 1
fi

if echo "$CHANGED" | grep -qx 'VERSION'; then
  exit 1
fi

exit 0
