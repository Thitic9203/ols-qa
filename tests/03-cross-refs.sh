#!/usr/bin/env bash
# Check 3: Skill cross-reference integrity
# Every `helix:skill-name` reference in any SKILL.md must point to an existing skill directory

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0; ERRORS=()

echo "=== Check 3: Skill Cross-References ==="

for skill_file in "$REPO_ROOT"/skills/*/SKILL.md; do
  rel="${skill_file#$REPO_ROOT/}"

  # Extract all `helix:something` references
  while IFS= read -r line; do
    # Match pattern: `helix:skill-name`
    while [[ "$line" =~ \`helix:([a-z0-9\-]+)\` ]]; do
      skill_name="${BASH_REMATCH[1]}"
      target_dir="$REPO_ROOT/skills/$skill_name"

      if [[ -d "$target_dir" ]]; then
        ((PASS++))
      else
        ERRORS+=("BROKEN REF: $rel → helix:$skill_name (skills/$skill_name/ not found)")
        ((FAIL++))
      fi

      # Remove matched portion to find next match in line
      line="${line#*\`helix:$skill_name\`}"
    done
  done < "$skill_file"
done

echo "  Checked: $((PASS + FAIL)) references"
echo "  Passed:  $PASS"
echo "  Failed:  $FAIL"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo ""
  for e in "${ERRORS[@]}"; do echo "  ✗ $e"; done
  exit 1
fi

echo "  ✓ All skill cross-references valid"
