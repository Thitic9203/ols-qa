# Tasks — smoke-unreleased-flag-gate

| ID | Task | Rule | Check first | Done when | Status |
|---|---|---|---|---|---|
| T1 | Wording test first — `tools/smoke-guard/unreleased_flag_rule.test.js` checks R1–R10 wording in the workflow and the command | R11 | fails on main before T2 | measured 0/21 before T2 | ✅ |
| T2 | Stage 3.5 in the workflow: stage, Contents line, checklist line, MUST line, Stage 8 note | R1–R9 | T1 red for R1–R9 | T1 green for R1–R9 | ✅ |
| T3 | Training NEVER line narrowed to owner-named rounds | R10 | T1 red for R10 | T1 green for R10 | ✅ |
| T4 | Command doc points at Stage 3.5 | R1, R8 | T1 red for the command check | T1 green for the command check | ✅ |
| T5 | Full suite + known answer | R11 | — | `bash scripts/run-test-suites.sh` → 100 suites green; one rule line removed → T1 exits 1; 21/21 after | ✅ |

Landed: spec on main via PR 291 (`112f358b`), code via PR 293 (`a0b9bd34`, CI `node-tests` + `sdd-gate` green).
