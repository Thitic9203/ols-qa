# helix-owned-files — plan

Spec `spec.md` O1–O7.

## Files

- `scripts/sync-skills-to-helix.sh` — after the helix guard check, read `$HELIX/helix-owned-files.txt` into an
  array (O1, O5, O6); in the file-selection loop, drop listed paths into `SKIPPED_OWNED` before the
  exists-in-helix test (O2, works for both modes and for `HELIX_SYNC_NEW=1`); report before the other skip
  reports (O3).
- `tools/helix-sync/owned_files.test.js` — new suite, same fixture style as `sync_env.test.js`: temp fake helix +
  ols-qa repos, run the script with `HELIX_SYNC_PUSH=0`, `HELIX_REPO=<temp>` (O7).

## Data

Plain text list, no new format. Bash `while read`, no new dependency (free, rule 3).

## Alternatives weighed

- Filter after the loop: works, but a `HELIX_SYNC_NEW=1` file would pass through `SKIPPED_NEW` logic first;
  filtering first is simpler and covers every branch.
- Read the list from helix `origin/main` in pr mode: more exact, but adds a git call and a second failure mode;
  the working tree is what the script already trusts for `check-no-secrets.sh`. Revisit if pr mode goes live.

## What could break

- A malformed list hides a file that should sync → reported every run (O3), so visible.
- Existing suites `sync_env`, `pr_mode`, `parity` must stay green (O4).
