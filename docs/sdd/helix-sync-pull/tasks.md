# Tasks: helix-sync-pull

| # | Task | Rules | Done when |
|---|------|-------|-----------|
| T1 | `apply.py` + keep-list + lock + tests | R3-R5 | each rule shown by a test |
| T2 | guard on lock-owned paths | R7 | planted change red, clean green |
| T3 | `helix-sync.yml` (dispatch first) | R2, R6, R8 | planted edit red; clean run merges; no-change run opens no PR |
| T4 | cutover: remove the old scripts and hook call; add the schedule | R1 | scripts gone; schedule on |
