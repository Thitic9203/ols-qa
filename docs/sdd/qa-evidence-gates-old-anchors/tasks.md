# Tasks: remove the qa-evidence-gates old-anchor table

| # | Task | Rules | Fails first | Done when |
|---|---|---|---|---|
| 1 | Repoint the two inbound redirect links | R1, R4 | the R1 grep finds 2 lines | grep empty; link check 0 broken |
| 2 | Delete the old-anchor section + Contents line | R2, R3 | `grep -c '<a id=' references/qa-evidence-gates.md` is 14 | 0; rule-line check passes |
| 3 | Token before/after; `regress_check.py`; Opus review | R5 | — | no rise; pass in PR body |
| 4 | Sync to helix (same three files) | R1–R5 | helix still has the table | helix PR CI green |
