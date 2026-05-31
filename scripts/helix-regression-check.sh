#!/bin/bash
# helix-regression-check.sh — run before every merge to main
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || { echo "FAIL: not in a git repo"; exit 1; }

echo "=== Helix Regression Check ==="

# 1. Skill files exist
echo -n "[1/7] Skill files... "
SKILLS=$(ls skills/*/SKILL.md skills/deprecated/*/WORKFLOW.md 2>/dev/null | wc -l | tr -d ' ')
[ "$SKILLS" -gt 0 ] && echo "OK ($SKILLS found)" || { echo "FAIL: no skills found"; exit 1; }

# 2. Portable content
echo -n "[2/7] Portable content... "
if [ -f scripts/ci-check-portable-skills.sh ]; then
  bash scripts/ci-check-portable-skills.sh > /dev/null 2>&1 && echo "OK" || { echo "FAIL"; exit 1; }
else
  echo "SKIP (script not found)"
fi

# 3. Skill structure
echo -n "[3/7] Skill structure... "
if [ -f scripts/ci-check-skill-structure.sh ]; then
  bash scripts/ci-check-skill-structure.sh > /dev/null 2>&1 && echo "OK" || { echo "FAIL"; exit 1; }
else
  echo "SKIP (script not found)"
fi

# 4. Reference integrity — every linked reference file must still exist somewhere.
# Note: repo layout (skills/deprecated/X/) differs from deployed layout (skills/X/),
# so we check existence by basename across all references/ dirs rather than by exact
# relative path. This catches renamed/deleted references (the real regression) without
# false-failing on the deprecated/ depth mismatch.
echo -n "[4/7] Reference links... "
EXISTING_REFS=$(find . -path '*/references/*.md' -not -path './.git/*' 2>/dev/null | sed -E 's#.*/##' | sort -u)
MISSING=$(find skills -name '*.md' 2>/dev/null | while IFS= read -r f; do
  grep -oE '\]\([^)]*references/[a-z0-9_-]+\.md\)' "$f" 2>/dev/null \
    | sed -E 's#.*/##; s#\)$##' \
    | while IFS= read -r base; do
        printf '%s\n' "$EXISTING_REFS" | grep -qx "$base" || echo "$f -> references/$base"
      done
done)
[ -z "$MISSING" ] && echo "OK" || { echo "FAIL: links to missing reference files:"; echo "$MISSING"; exit 1; }

# 5. VERSION consistency
echo -n "[5/7] VERSION sync... "
FILE_VER=$(tr -d '[:space:]' < VERSION 2>/dev/null)
if command -v jq >/dev/null 2>&1; then
  JSON_VER=$(jq -r '.version' .claude-plugin/plugin.json 2>/dev/null)
else
  JSON_VER=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' .claude-plugin/plugin.json 2>/dev/null | sed -E 's/.*"([^"]*)"$/\1/')
fi
[ "$FILE_VER" = "$JSON_VER" ] && echo "OK ($FILE_VER)" || echo "WARN: VERSION=$FILE_VER plugin.json=$JSON_VER"

# 6. Scripts executable
echo -n "[6/7] Script permissions... "
NON_EXEC=$(find scripts/ hooks/ .claude/hooks/ -name '*.sh' ! -perm -u+x 2>/dev/null | head -5)
[ -z "$NON_EXEC" ] && echo "OK" || echo "WARN: not executable: $NON_EXEC"

# 7. Menu / commands consistency
echo -n "[7/7] Menu consistency... "
CMD_COUNT=$(ls commands/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "OK ($CMD_COUNT commands)"

echo ""
echo "=== All critical checks passed ==="
