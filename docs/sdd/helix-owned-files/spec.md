# helix-owned-files — spec

Mirrors Helix `docs/sdd/project-agnostic/spec.md` R8 and R10 (owner-approved 2026-11-18) for the part that lives
in ols-qa: `scripts/sync-skills-to-helix.sh`.

## Rules

- **O1** When `$HELIX_REPO/helix-owned-files.txt` exists, the sync must read it as one repo-relative path per line;
  text from `#` to end of line and blank lines must be ignored; surrounding whitespace is trimmed. No globs.
  *Source:* Helix spec R8; header of Helix `helix-owned-files.txt`.
- **O2** When a changed file is listed, the sync must not copy, stage, commit or push it, in `main` and `pr` mode
  alike. *Source:* Helix spec R8.
- **O3** Every skipped file must be reported: one line `sync: skipped N Helix-owned file(s):` followed by one
  `  · <path>` line per file. Never a silent drop. *Source:* Helix spec R8 ("skipped and reported").
- **O4** Files not listed must sync exactly as before. *Source:* Helix spec R8 ("shared files not listed stay
  shared").
- **O5** When the list file is absent the sync must skip nothing and print one warning line starting
  `sync: ⚠️` that names the missing file. *Source:* task brief (Helix main does not carry the list yet).
- **O6** When the list file exists but cannot be read, the sync must stop with exit 1 and `NOTHING deployed`
  (fail closed, the script's existing style). *Source:* script header; Helix spec R8.
- **O7** ols-qa tests must cover: an owned file leaves Helix unchanged and is reported; a missing list syncs as
  before with the warning; comment lines are not paths; an unreadable list aborts. *Source:* Helix spec R10.

## Edge cases

- Only owned files changed → report, then the existing "no shared skill files to sync — nothing to do", exit 0.
- `HELIX_SYNC_NEW=1` does not override the list (filter runs before the new-file branch).
- `pr` mode reads the list from `$HELIX_REPO` working tree, same as the guard script it already requires there.

## Done when

- `node tools/helix-sync/owned_files.test.js` passes; it failed before the script change.
- `bash scripts/run-test-suites.sh` green.
- PR to ols-qa main open, not merged by a lane.
