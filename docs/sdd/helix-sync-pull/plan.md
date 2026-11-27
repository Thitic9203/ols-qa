# Plan: helix-sync-pull

Spec: [spec.md](spec.md). Full plan: SkillLane/team-pluton-skills `docs/sdd/skill-sync-simplify/plan.md`.

| File | Change | Rules |
|------|--------|-------|
| `scripts/helix-sync/apply.py` (new) + its tests | Select, keep-list, lock, refuse edited owned files, add/delete | R3-R5 |
| `helix-keep.txt`, `.helix-sync.lock` (new) | Keep-list; lock of owned paths | R3, R4 |
| `.github/workflows/helix-sync.yml` (new) | dispatch (+ schedule at cutover); clone the Helix tag; apply; suites + secret guard + post-mortem guard; one PR; merge if green, red if not | R2, R6, R8 |
| `tools/helix-sync-guard/*.test.js` (new) | Fail a PR that changes a lock-owned path | R7 |
| `scripts/sync-skills-to-helix.sh`, `scripts/sync-skills-pr-mode.sh`, `tools/helix-sync/*`, the sync call in `scripts/hooks/post-commit` | Remove at cutover | R1 |

## Cutover (R9-R11, T4)

| File | Change | Rules |
|------|--------|-------|
| `scripts/sync-skills-to-helix.sh`, `scripts/sync-skills-pr-mode.sh`, `scripts/hooks/post-commit` | Delete | R9 |
| `tools/helix-sync/owned_files.test.js`, `tools/helix-sync/pr_mode.test.js`, `tools/helix-sync/sync_env.test.js` | Delete; the two `git-env-clean.sh` checks move to `tools/helix-sync/git_env_clean.test.js` | R9 |
| `tools/helix-sync-pull/cutover.test.js` (new) | Files absent, no live reader, schedule present, empty tag = latest | R9-R11 |
| `.github/workflows/helix-sync.yml` | Add `schedule: cron '17 2 * * *'` | R10 |
| `AGENTS.md`, `CLAUDE.md`, `scripts/setup-hooks.sh`, `tools/skill-text-guard/check.js` and `references/ols-data-prep.md` (comments) | Edit in Helix; ols-qa receives via helix-sync.yml | R11 |

Kept: `scripts/helix-parity.sh` + `tools/helix-sync/parity.test.js` (read-only check), `tools/portability/synced_links.test.js`
(does not read the removed scripts). Not editable here: `skills/test-data-prep-workflow/SKILL.md` names Helix's
`helix-owned-files.txt`, but it is lock-owned (R7), so a fix lands in Helix. Historical docs (post-mortems, older SDD
folders) stay as history.

Risk: the skl-vm `helix-sync.timer` calls the removed script; merge only after it is disabled.
