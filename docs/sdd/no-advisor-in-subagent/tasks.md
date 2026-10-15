# Tasks — no advisor calls inside subagents

**Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

| # | Task | Serves | Failing test first | Done when |
|---|------|--------|--------------------|-----------|
| T1 | Add test cases: no prohibition → BLOCK; `NO-ADVISOR` → clean; Thai prohibition → clean; "call the advisor" + token → BLOCK; finding text names the 9.3 min stall | R1 R2 R3 | yes — run the suite, the new cases fail | the 4 new cases fail on unchanged code |
| T2 | Add check 14 `ADVISOR_ALLOWED_IN_SUBAGENT` + exported `NO_ADVISOR_MARKER` | R1 R2 R3 R4 | T1 | T1 cases pass; `checks` count went up by 1 |
| T3 | Add the marker to existing `ok: true` fixtures only | R6 | the existing cases that turned red after T2 | the whole agent-dispatch suite is green, with no assertion changed |
| T4 | Make `--explain` list the code and add a README row | R5 | the `--explain` test asserts the new code | the test passes |
| T5 | `bash scripts/run-test-suites.sh` | all | — | green |
