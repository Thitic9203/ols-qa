# Intent — project-agnostic-mirror

Written in the originator's own words, before `spec.md`. Spec: docs/sdd/ai-native-sdlc-alignment R1.

## What is wanted

Owner decision 2026-11-18 (Helix plan `docs/sdd/project-agnostic`, ADLC gate 3 approved): every Helix QA skill
works in any project, not only OLS. Shared files that Helix edits for this must get the same edit here, so the
ols-qa → Helix sync carries the change instead of undoing it (Helix spec R8).

## Why

`scripts/sync-skills-to-helix.sh` copies changed shared files into Helix with `cp -f`. If ols-qa keeps the old
OLS-only text, the next sync puts it back into Helix.

## Constraints

Same text as Helix, byte for byte, in the shared files. OLS keeps working: its usage marker still reads
`src=ols-qa`. Free tools only. No Helix edits from this repo.

## Reviewed by owner on 2026-11-18 (Helix plan approval)
