#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

find "$REPO/skills" -name SKILL.md \
  -not -path '*/in-progress/*' \
  -not -path '*/deprecated/*' \
  | while read -r f; do
  name=$(basename "$(dirname "$f")")
  desc=$(grep -m1 '^description:' "$f" | sed 's/^description: *//')
  echo "- $name"
  echo "  $desc"
  echo "  $f"
done
