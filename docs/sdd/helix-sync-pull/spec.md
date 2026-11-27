# Spec: helix-sync-pull — Helix → ols-qa, one way

Status: approved by the owner (ADLC gate 3, 27 Nov 2026). The source spec is
SkillLane/team-pluton-skills `docs/sdd/skill-sync-simplify/spec.md` (R1-R11). This folder carries the ols-qa part, so
that this repo's sdd-gate finds it on main.

## Rules

- R1. Skill files that exist in both Helix and ols-qa are edited in Helix only; nothing in ols-qa copies changes into
  Helix (source R1).
- R2. When the daily schedule fires (02:17 UTC) or someone runs it by hand (optional tag), `helix-sync.yml` must read
  Helix's latest `v*` release and stop with no PR when ols-qa already matches it (source R3).
- R3. The sync may write only paths under `skills/`, `references/` and `commands/` that exist in Helix at that tag,
  minus `helix-keep.txt` (`commands/test-data-prep.md` today); it never touches OLS-only files or anything outside
  those folders (source R4).
- R4. `.helix-sync.lock` records every owned path (sha256) and the tag; new Helix files are added; owned files Helix
  removed are deleted (source R5).
- R5. An owned file that no longer matches its lock hash fails the run red, naming the file, and is never
  overwritten (source R6).
- R6. The run must pass this repo's test suites, secret guard and post-mortem guard on the synced tree; it opens or
  updates one PR on `bot/helix-sync`, squash-merges it only when everything passes, and otherwise fails red with the
  PR left open (source R7).
- R7. A CI check fails a human PR that changes a lock-owned path (source R8).
- R8. `GITHUB_TOKEN` only (source R9).
- R9. Cutover (source R10): `scripts/sync-skills-to-helix.sh`, `scripts/sync-skills-pr-mode.sh`, the suites that only
  exercise them (`tools/helix-sync/owned_files.test.js`, `pr_mode.test.js`, `sync_env.test.js`) and the sync call in
  `scripts/hooks/post-commit` must not exist. The post-commit hook had no other duty, so the file goes too.
  `scripts/git-env-clean.sh` stays (pre-push, `helix-parity.sh`, `helix-link-check.sh` use it) and keeps its checks.
  `scripts/helix-parity.sh` stays as a read-only check.
- R10. `helix-sync.yml` must carry `schedule: cron '17 2 * * *'` next to `workflow_dispatch`; a scheduled run has no
  inputs, so `inputs.tag` is empty and the run must resolve Helix's latest release, the same as an empty manual tag
  (source R3).
- R11. Docs in this repo (`AGENTS.md`, `CLAUDE.md`, `scripts/setup-hooks.sh`) must say shared skills are edited in
  Helix and reach ols-qa through `.github/workflows/helix-sync.yml`; they must not tell anyone to run a sync to Helix
  (source R1, R10).

## Done when

- A manual run merges a Helix release; a no-change run opens no PR; a planted edit to an owned file fails red.
- The old ols-qa → Helix scripts and the post-commit sync call are gone (cutover, source R10).
- `node tools/helix-sync-pull/cutover.test.js` passes: removed files absent, no live reader left, schedule present,
  empty tag resolves the latest release (R9-R11).
- Merge only after the skl-vm `helix-sync.timer` is disabled (it runs the removed script).
