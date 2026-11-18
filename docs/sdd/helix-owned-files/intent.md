# Intent — helix-owned-files

Written in the originator's own words, before `spec.md`. Spec: docs/sdd/ai-native-sdlc-alignment R1.

## What is wanted

Owner decision 2026-11-18 (Helix wayfinder ticket 01/10): "Helix keeps `helix-owned-files.txt`; the ols-qa sync
script must skip and report every listed file."

## Why

`scripts/sync-skills-to-helix.sh` copies every changed shared file into Helix with `cp -f`, so an ols-qa edit can
overwrite a file Helix now owns (test-data-prep, made project-agnostic in Helix).

## Constraints

Free tools only. Existing sync behaviour for files not on the list must not change. Fail closed. No Helix edits
from this repo.

## Reviewed by owner on 2026-11-18

2026-11-18 — owner approved Helix SDD `docs/sdd/project-agnostic` (branch `docs/wayfinder-project-agnostic`) R8, R10.
