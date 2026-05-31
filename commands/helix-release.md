---
description: Verify and ship Helix changes to main (CI owns the version bump)
---
1. Run `bash scripts/helix-regression-check.sh` first
2. If a check FAILS, stop and report — do not push
3. If all checks pass, ensure work is committed (conventional commit message)
4. `git pull --rebase origin main` then `git push origin main`
5. Report what was pushed

IMPORTANT: Do NOT run bump-version.sh or sync-version.sh manually.
CI (.github/workflows/version.yml) auto-bumps the patch version on push to main.
A manual bump would double-bump and race the CI commit.

Do NOT ask for confirmation at each step — run the full flow.
