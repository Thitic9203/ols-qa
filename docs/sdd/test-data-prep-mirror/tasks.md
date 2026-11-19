# test-data-prep-mirror — tasks

| # | Task | Rules | Fails first | Done when |
|---|---|---|---|---|
| D-T1 | Copy the four Helix-owned test-data-prep files from Helix origin/main (after helix#68) | D1, D2, D4 | before the copy: `cmp` against Helix differs for all four | `cmp` clean |
| D-T2 | Re-pin any test that pinned the old OLS text | D3 | after D-T1: `npm test` red on that test (if any) | `npm test` green, same strictness |

Order: this folder merges to main first (sdd-gate), then the mirror PR citing `Spec: docs/sdd/test-data-prep-mirror D1–D4`.
