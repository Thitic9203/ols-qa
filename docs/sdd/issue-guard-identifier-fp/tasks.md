# Tasks — issue-creation-guard: names are not orders

| # | Task | Rule | Test that fails first | Done when |
|---|---|---|---|---|
| T1 | Add known-answer tests: two lane lines not blocked; three real orders blocked | R1 R2 R3 | lane lines return `hit: true` today | tests written, the two lane cases red |
| T2 | `stripIdentifiers` + use in `inspectAgentPrompt`, export | R1 R2 R4 | T1 | guard suite green, run-test-suites green |
