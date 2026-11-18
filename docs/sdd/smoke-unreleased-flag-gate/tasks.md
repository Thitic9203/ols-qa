# Tasks — smoke-unreleased-flag-gate

- **T1 — wording test first** (R11). Write `tools/smoke-guard/unreleased_flag_rule.test.js` checking
  R1–R10 wording in the workflow and the command. Fails before T2. Done: it fails on current main.
- **T2 — Stage 3.5 in the workflow** (R1–R9). Add the stage, Contents line, checklist line, MUST line,
  Stage 8 note. Done: T1 passes for R1–R9.
- **T3 — training NEVER line** (R10). Done: T1 passes for R10.
- **T4 — command doc** (R1, R8). Done: T1 passes for the command check.
- **T5 — full suite.** `bash scripts/run-test-suites.sh` green; known-answer: removing one rule line
  makes T1 fail.
