#!/bin/bash
# Inject key decisions back into context before auto-compaction
cat <<'DECISIONS'
=== Helix Session Decisions (auto-injected) ===
- Skill content language: English only
- Chat language: Thai OK
- Commit style: conventional commits (feat:, fix:, chore:, docs:)
- Version bump: automatic by CI, do NOT manual bump
- New skill: create in skills/{name}/ + matching commands/{name}.md
- References: portable content only, no hardcoded paths
- Before merge: run helix-regression-check.sh
- Rule #5 in Helix: .md edits in skills/references/commands/ are safe, do without asking
DECISIONS
