# Plan — retest-guard pre-review evidence checks

## Files

| file | change |
|---|---|
| `tools/retest-guard/retest_rules.js` | add constants (`INLINE_IMAGE_MAX_WIDTH`, `CLOCK_TIME`, `TIMEZONE_TOKEN`, `VERIFIER_LINE`, …) and pure functions `widthClaims`, `widthsBackedByName`, `roleClaims`, `rolesBackedByFile`, `parseVerifierOutput`, `decisionRowNames`, `checkDecisionTimes`, `inlineWikiImages`, `pngWidth` — no fs |
| `tools/retest-guard/retest_evidence.js` (new) | reads the evidence dir, capture.json siblings, verifier `*.txt`, decisions file, PNG headers; returns findings R1–R5 |
| `tools/retest-guard/retest_guard.js` | flags `--decisions`, `--verify-dir`; call `retest_evidence.check()` in pre-review mode; exit 2 when only `unchecked` findings remain; print `UNCHK` |
| `tools/retest-guard/retest_evidence.test.js` (new) | known-answer pairs per rule (must flag 1 · must pass 1) + CLI exit codes |
| `tools/retest-guard/retest_guard.test.js` | the one test "passes once the evidence file is there" now runs pre-review mode, so it supplies a PASS verifier output and a decisions file to keep its meaning (evidence present → exit 0) |
| `tools/retest-guard/README.md` | document the flags, rules and exit 2 for `unchecked` |

## Data

- Verifier output: lines `^(PASS|FAIL)\s+<file>.mp4$` (shape printed by `verify_video.py`).
- capture.json: `viewport.width` (number).
- Decisions file: markdown; rows are `|`-lines; headings are `#`-lines.
- PNG: 8-byte signature, IHDR width = bytes 16–19 big-endian. stdlib `fs` only.

## Library

None. Node ≥ 18 stdlib only (rule 3: no cost).

## Options weighed

- Trigger the checks always vs only with `--evidence-dir`/`--decisions`: always would turn every
  existing `--manifest`-only call into exit 2. Opt-in by the flags the workflow already passes
  keeps old callers stable while the documented workflow command (`--evidence-dir`) runs them.
- Trust `capture.json` `verified.passed` vs require verifier output: rejected the boolean per #0113.
- Treat `unchecked` as warn vs exit 2: warn would let a could-not-check exit 0 — rejected.

## What may break

- The workflow command `--manifest … --evidence-dir out/` now exits 2 until `--decisions` is
  passed (R4 always needs it). The workflow text (`skills/procedures/retest-bug-workflow/
  comment-and-post.md`) must add `--decisions <ROUND_DECISIONS.md>` and `--verify-dir` — that
  file is outside this lane's scope; the main thread owns it.
- Name heuristics (R1/R2) can miss a width/role not in file names → author adds capture.json or
  names the file; a false flag is visible and cheap, a false pass is what this prevents.
