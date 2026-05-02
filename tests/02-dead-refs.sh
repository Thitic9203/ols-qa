#!/usr/bin/env bash
# Check 2: Knowledge file references
# Every .md file listed in a SKILL.md "Knowledge References" section must exist

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0; ERRORS=()

echo "=== Check 2: Knowledge File References ==="

for skill_file in "$REPO_ROOT"/skills/*/SKILL.md; do
  skill_dir="$(dirname "$skill_file")"
  rel_skill="${skill_file#$REPO_ROOT/}"

  # Extract lines like: > `filename.md` — description
  # (inside Knowledge References section)
  in_section=0
  while IFS= read -r line; do
    if [[ "$line" =~ "Knowledge References" ]]; then
      in_section=1; continue
    fi
    # Section ends at next non-blockquote line that isn't empty
    if [[ $in_section -eq 1 ]] && [[ -n "$line" ]] && [[ ! "$line" =~ ^\> ]]; then
      in_section=0
    fi
    if [[ $in_section -eq 1 ]]; then
      # Extract filename: `something.md`
      if [[ "$line" =~ \`([^\']+\.md)\` ]]; then
        ref="${BASH_REMATCH[1]}"
        target="$skill_dir/$ref"
        if [[ -f "$target" ]]; then
          ((PASS++))
        else
          ERRORS+=("MISSING: $rel_skill references '$ref' but file not found")
          ((FAIL++))
        fi
      fi
    fi
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

echo "  ✓ All knowledge file references resolved"
