# Spec — retest-guard pre-review evidence checks

**Owner decision:** 18/Nov/2026 — the retest-bug workflow's independent reviewer (step 6c) needed
7 rounds on a recent round. The defect classes it caught move into a machine check that runs
BEFORE the reviewer, so 6c converges in fewer rounds. The reviewer stays independent and must still
reach CLEAN. No existing guard rule is removed or loosened.

**Source of the five classes:** the 6c review files of that round (kept in the private evidence
repo, `runs/<round>/comment/review-6c*.md`), and the round's `ROUND_DECISIONS.md` and
`out/sources/verify-video-*.txt` verifier outputs, read 18/Nov/2026.

## Scope

- Tool: `tools/retest-guard/` only. CLI `retest_guard.js`.
- The checks run in **pre-review mode**: when `--evidence-dir` and/or `--decisions` is passed.
  Without either flag the guard behaves exactly as before (no new findings, same exit codes).
- Severity `unchecked` = the check could not be decided from what was given. It is never a pass:
  a run whose only non-warn findings are `unchecked` exits **2** (could not run); any `error`
  exits 1.
- Roles: the person running the retest (author), the 6c reviewer (unchanged, independent).

## Rules

- **R1 — width claim needs width evidence.** When a result row's `actual` names viewport widths
  in px (`1440 / 820 / 390 px`, `390 px`, `1440px`), the guard must flag every named width that
  no evidence file **of that row** backs (`width-claim-without-evidence`). A file backs width W
  when its name carries `w<W>` or `<W>` between separators (`TC_03-390-learner.png`), or its
  sibling `<stem>.capture.json` in `--evidence-dir` has `viewport.width == W`. A trailing
  `-<n>` before the extension is the resized-copy marker (`-640.png`), not a viewport. Without
  `--evidence-dir` an unbacked claim is `width-claim-unchecked`.
- **R2 — role claim needs role evidence.** When a result row's `actual` names roles (the role
  vocabulary = every `cases[].role` part and top-level `role[]`), the guard must flag each named
  role that the row's evidence does not back (`role-claim-without-evidence`). A file backs role R
  when its name carries R (letters only, case-insensitive: `CONTENT_ADMIN`, `contentadmin`), or
  it names a case (`TC_02`, `TC_02_03` → TC_02 + TC_03) whose role is exactly R. A multi-role
  case backs a role only through a file that names the role. A shorter role inside a longer
  matched role (`Admin` in `Content Admin`) is not a separate claim.
- **R3 — every cited clip has a passing verifier or an owner decision.** For each `.mp4` cited by
  the manifest evidence or the body, the guard reads verifier outputs (`*.txt` in `--verify-dir`,
  default `--evidence-dir`; lines `PASS  <clip>.mp4` / `FAIL  <clip>.mp4`, the shape
  `verify_video.py` prints). The clip passes only with at least one PASS line and no FAIL line.
  The capture manifest's own `verified.passed` boolean is NOT accepted (post-mortem #0113: it read
  true while the stutter check had not run). A clip that does not pass must be named (file name
  or stem, whole-token) on a table row of `--decisions`; otherwise `clip-unverified-no-decision`.
  No `--decisions` file → `clip-decision-unchecked`. No verifier dir → `clip-verify-unchecked`.
- **R4 — times in the decisions file are measured.** When `--decisions` is given, every clock
  time `HH:MM` on a line must have a source on the same line — a `` `code span` `` or a file name
  with an extension (`.txt .log .json .jsonl .md .csv .png .mp4`); otherwise
  `decision-time-unsourced`. When a heading (`#` line) names a timezone (`UTC`, `ICT`,
  `GMT+7`, `+07:00`, `Asia/Bangkok`), a line with a time that names a different timezone is
  `decision-timezone-mismatch`. Without `--decisions` → `decision-times-unchecked`.
- **R5 — inline images ≤ 640 px.** Every inline wiki image `!name.png!` in the body must be a PNG
  in `--evidence-dir` whose IHDR width is ≤ 640 (`inline-image-too-wide`). Not found, or not a
  PNG → `inline-image-unchecked`.
- **R6 — no loosening.** Every existing rule, finding and exit code stays. Constants and the pure
  decision functions live in `retest_rules.js` (single source of truth); file reading lives in
  `retest_evidence.js`.

## Done when

- R1: a row claiming `1440 / 390 px` with only a `-390-` file → flagged for 1440; with a 1440
  capture.json sibling as well → clean.
- R2: a row claiming Learner and Content Admin citing only a Learner case's files → flagged for
  Content Admin; adding a file naming contentadmin → clean.
- R3: a FAIL clip with no decision row → flagged; with a decisions row naming its stem → clean;
  a PASS-only clip → clean; no decisions file → unchecked (exit 2).
- R4: `| 3 | ran at 10:57 |` → flagged; `| 3 | ran at 10:57 (`date`) |` → clean; heading `(ICT)`
  plus a `10:57 UTC` row → mismatch.
- R5: a 1280 px PNG inline → flagged; a 640 px PNG → clean.
- `node tools/retest-guard/<each>.test.js` and `bash scripts/run-test-suites.sh` are green.
