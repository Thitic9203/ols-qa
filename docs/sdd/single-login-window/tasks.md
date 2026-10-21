# Tasks — one login window at a time

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

| # | Task | Rules | Failing test first | Done when |
|---|------|-------|--------------------|-----------|
| T1 | Bot: default run passes no `--force`; `--force` adds it | R6 | `t_main_default_no_force`, `t_main_force_opt_in` | tests green |
| T2 | Bot: `--tag` narrows; unknown tag refused; 2+ tags without `--tag`/`--all-selected` refused | R7 R8 | `t_main_refuses_many_without_tag`, `t_main_tag_narrows`, `t_main_tag_not_selected_refused`, `t_main_all_selected_ok` | tests green, offline suite green |
| T3 | Bot: hint text in `session_capture.js` | R7 | `session_capture_loop.test.js` still green | suite green |
| T4 | ols-qa: lint `tools/login-window-rule` | R1 R2 | `check.test.js` fails on current skill text | test green after T5 |
| T5 | ols-qa: rewrite login text in lanes reference + both skills + MUST/NEVER | R1–R5 R9 | T4 | `bash scripts/run-test-suites.sh` green |
| T6 | ols-qa: OLS guide + ENVIRONMENT.md invocation with `--tag` | R4 R7 | — | grep shows new invocation |
| T7 | Merge both PRs, helix sync + parity | R9 | — | `verify-on-origin.sh` ON-ORIGIN, parity pass |
| T8 | Lint: forbid password intake / fill / Password column across both skills (failing first) | R11 | `check.test.js` new cases | red then green |
| T9 | Rewrite intake, Playwright discipline, retest config template, retest WORKFLOW credential lines | R10 | T8 | suites green, helix synced |
