---
description: Prepare and ship a Helix release
---
1. Run `bash scripts/helix-regression-check.sh` first
2. If all checks pass, run `bash scripts/bump-version.sh patch`
3. Run `bash scripts/sync-version.sh`
4. Commit with message: "chore(release): bump version X.Y.Z"
5. Push to main

Do NOT ask for confirmation at each step — run the full flow.
Stop only if a check fails. Report the new version number when done.
