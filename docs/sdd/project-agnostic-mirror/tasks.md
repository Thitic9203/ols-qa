# project-agnostic-mirror — tasks

| # | Task | Rules | Fails first | Done when |
|---|---|---|---|---|
| M-T1 | Copy the 11 shared files from Helix 60a426a | M1 | — | `cmp` clean |
| M-T2 | OLS guide states workspace name `ols-qa` | M2 | — | marker rule + guide line present |
| M-T3 | Parsers read `(workspace only)` | M3 | after M-T1: `skill-structure` and `routing` A5 tests red (content-takedown / smoke-test lose their exemption) | both green |
| M-T4 | Re-pin the two tests to the new text | M4 | after M-T1: a17 R7 portability and retest-guard `src` tests red | both green, same strictness |

Order: this folder merges to main first (sdd-gate), then the mirror PR citing `Spec: docs/sdd/project-agnostic-mirror M1–M4`.
