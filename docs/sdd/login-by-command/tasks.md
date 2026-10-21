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
