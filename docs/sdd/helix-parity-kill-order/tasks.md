# Tasks — helix-parity-kill-order (ols-qa)

| Task | What                                                        | Rules  | Test that fails first                                                  | Done when                                   |
| ---- | ----------------------------------------------------------- | ------ | ---------------------------------------------------------------------- | ------------------------------------------- |
| T1   | Regression check: respawning transport + slow `pgrep` shim  | R6     | new check against current `kill_tree` → "respawned child still running" | fails on old script for the stated reason   |
| T2   | `kill_tree` stops a parent before listing, rescans, TERM+CONT | R1–R4 | T1                                                                     | T1 green; existing 8 checks green           |
| T3   | Verify under load                                           | R5     | —                                                                      | suite green; parity test 20/20 consecutive  |
| T4   | Regression check: ols-qa fetch slower than the shared bound uses `_OLS` bound; stall tests set `_HELIX` only | R7, R8 | new check against current script → ols-qa "timed out after 2s" | fails on origin/main, passes after; suite green |
