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

## Done when

- A manual run merges a Helix release; a no-change run opens no PR; a planted edit to an owned file fails red.
- The old ols-qa → Helix scripts and the post-commit sync call are gone (cutover, source R10).
