# Tasks — combined-merge test that proves what it tested

| # | Task | Rule | Test that fails first | Done when |
|---|---|---|---|---|
| T1 | Known-answer suite with a throw-away repo | R2 R3 R4 | tool missing → every case fails | suite written, red |
| T2 | `scripts/test-combined-merge.sh` | R1 R2 R3 R4 | T1 | T1 green, run-test-suites green |
| T3 | CLAUDE.md §4 line + post-mortem #0198 | R1 R5 | — | postmortem-guard check passes |
