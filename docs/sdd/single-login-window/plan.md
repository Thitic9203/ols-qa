# Plan — one login window at a time

Spec: [spec.md](spec.md)

## Files touched

### ols-qa (PR)
| File | Change | Rule |
|------|--------|------|
| `references/parallel-test-lanes.md` §3 table row "Saved login file exists", §5 lane prompt, MUST/NEVER | Lane no longer "logs in fresh": returns `SESSION-DEAD <tag>`; parent recovers (relink → one window) | R1 R2 R3 R4 |
| `skills/procedures/testing-ticket-workflow/WORKFLOW.md` Login reuse (~287) + MUST/NEVER | Same wording; main thread only; one window at a time, email prefilled; prefer live accounts | R1–R5 |
| `skills/procedures/testing-ticket-workflow/execute-and-summarize.md` lane dispatch | Point to the rule | R1 R2 |
| `skills/procedures/retest-bug-workflow/execute-and-evidence.md` 4b Login + Login reuse | Same | R1–R5 |
| `skills/procedures/retest-bug-workflow/WORKFLOW.md` MUST/NEVER | Add row | R1 R4 |
| `references/ols-project-guide.md` login section | Name the tool invocation: `login_from_sheet.py --env <env> --rows <a:b> --tag <tag>` | R4 R7 (OLS placeholder only) |
| `docs/ENVIRONMENT.md:7` | Same invocation | R4 |
| `tools/login-window-rule/check.js` + `check.test.js` (new) | Lint: the three skill files + lanes reference must contain the main-thread rule and must not contain a lane "log in fresh" instruction | Done-when guard |

### ols-qa-testing-bot (separate PR)
| File | Change | Rule |
|------|--------|------|
| `capture/login_from_sheet.py` main() | `--force` opt-in (default skips healthy); `--skip-healthy` kept as accepted no-op; `--tag` (repeatable) narrows the mapped list, refusing a tag not in the selection; >1 tag without `--tag`/`--all-selected` → refuse, list tags | R6 R7 R8 |
| `capture/session_capture.js:459` hint text | Suggest `--tag` instead of `--skip-healthy` | R7 |
| `tests/test_login_from_sheet.py` | New failing-first tests | Done-when |

`capture_argv(tags, skip_healthy, env)` keeps its signature; existing tests on it stay valid. Only `main()` defaults change.

## Libraries
None new (stdlib argparse; Node built-ins). No cost (rule 3).

## Alternatives weighed
- Cap windows inside `session_capture.js` (open first only) — rejected: silently drops accounts the caller asked for; refusing with a list is explicit.
- Let lanes log in but serialise with a lock — rejected: still pops windows from lanes the owner cannot see, and a lane waiting on a human stalls the round.

## What may break
- Callers relying on default `--force` re-capture of healthy accounts → must now pass `--force` (only used manually; no scripted caller found: `git grep login_from_sheet` in both repos, 21/Oct).
- Callers passing a wide row range expecting all windows → refused unless `--all-selected`. Intended.
