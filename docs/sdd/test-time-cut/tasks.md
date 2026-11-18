# Tasks — test-time-cut

| ID | Task | Rule | Check first | Status |
|---|---|---|---|---|
| T1 | Retest Step 2 parallel intake + background session check | R1, R2 | `git grep parallel-prep skills/procedures/retest-bug-workflow` = 0 hits | ✅ |
| T2 | Work while waiting at Phase C / 6d | R3 | no "while waiting" text at either gate | ✅ |
| T3 | parallel-prep retest pairs | R4 | table names only story/TC pairs | ✅ |
| T4 | Recorder = screen-record skill | R5 | `git grep qa_recorder skills references` = 4 hits | ✅ |
| T5 | Full suites green, then helix sync + parity after merge | Done when | — | ⏳ |
