# Tasks — login by command

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

| # | Task | Rules | Failing test first | Done when |
|---|------|-------|--------------------|-----------|
| T1 | Lint: forbid opening a login window / old one-window rule / prefilled window / driving the login; require "ready-to-run command"; scan the stubs | R11 | new `check.test.js` cases; the repo case fails on current text | red before T2 |
| T2 | Rewrite §3 *Dead session* and the lane prompt in `parallel-test-lanes.md` | R1–R8 | T1 | lint finds nothing in this file |
| T3 | Rewrite the testing-ticket login text (intake, confirm, pre-flight smoke, fresh login, MUST/NEVER, session-intake) | R1–R9 | T1 | lint finds nothing |
| T4 | Rewrite retest §4b, config list, MUST/NEVER | R1–R9 | T1 | lint finds nothing |
| T5 | Stubs: one rule line each; superseded banner on `single-login-window` | R1 R2 | T1 | `bash scripts/run-test-suites.sh` green |
| T6 | Push branch, open PR (no merge, no helix sync) | — | — | PR URL; `verify-on-origin.sh` ON-ORIGIN for the spec commit |

## Amendment 23/Oct/2026 — combined block (spec R12–R15)

| # | Task | Rules | Failing test first | Done when |
|---|------|-------|--------------------|-----------|
| T7 | Lint: forbid "one `bash` block each / per account / per command", "one block per needed account", "one block for that account alone"; require "one combined `bash` block" in the required files | R15 | new `check.test.js` must-find / must-not-find cases; the repo case fails on current text | red before T8 |
| T8 | Rewrite relink/mint steps in `parallel-test-lanes.md`, testing-ticket `WORKFLOW.md`, retest `execute-and-evidence.md` to the combined loop; MUST/NEVER rows; retest `WORKFLOW.md`; config template rows; both stubs' line 5a | R12–R14 | T7 | lint finds nothing; `bash scripts/run-test-suites.sh` green |
| T9 | Branch from origin/main, commit citing `Spec: docs/sdd/login-by-command R12–R15`, open PR (no merge) | — | — | PR URL, checks green |
| T10 | After main merges: `bash scripts/sync-skills-to-helix.sh <changed shared files>` then `bash scripts/helix-parity.sh` from fresh main | — | — | parity clean |
