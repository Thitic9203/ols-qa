# Tasks

Every test row is written first and must fail on `main` (`check.js` absent) before its code is added.

| # | Task | Rules | Check that fails first | Done when |
|---|------|-------|------------------------|-----------|
| T1 | Test harness `notify_send_guard.test.js`: temp state dir, per-rule counter, exit ≠ 0 when a rule has 0 cases | R11 | run on `main` → module not found | harness prints per-rule counts; fails while any rule is 0 |
| T2 | Tokenizer + invocation finder: every Scope form, cannot-prove forms, data-only mentions, unbalanced quote / heredoc | R8, Scope | cases `python3 -u -X dev …`, `/usr/bin/env python3 …`, `sudo -u x nice -n 5 …`, `eval "…"`, `xargs … `, `bash <<EOF`, `grep discord_qa_notify.py`, `bash _retest_closeout.sh`, `echo 'x` fail | all T2 cases pass |
| T3 | Record PostToolUse fixtures (exit 0 / ≠ 0 / interrupted) and `--record` writing state | R1, R9 | dry-run exit 0 → state with sha + time; exit ≠ 0, `\|\| true`, PreToolUse → no state; unwritable dir → exit 0 + warning | state cases pass |
| T4 | Flag normalisation | R2, R12 | `--tic X`, `--bod=…`, `--dry`, `--reg f` resolve; `--r x` real send blocks R12 | R12 cases pass |
| T5 | Registry rule | R3 | real send without `--registry` / `--reg` passes when it must block | R3 cases pass |
| T6 | Verdict-count bullets | R4 | `• PASSED 3/3`, `– ผ่าน 2/2`, `‣ ไม่ผ่าน 1/2`, `1. PASS: 4/4` must block; `• AC1-AC5 ผ่านทั้งหมดบน dev` must pass | R4 cases pass |
| T7 | Status lines | R5 | `• *สถานะ:* …`, `Status : …` must block; `status of AC3 …` must pass | R5 cases pass |
| T8 | Fresh matching dry-run + use-once | R6, R7 | no state / 1801 s old / other ticket / other session / changed body / same-command dry-run → block; state removed after a recorded successful send | R6, R7 cases pass |
| T9 | Run-time values | R13 | `--body "$BODY"`, `--body "$(cat f)"`, backticks, `--ticket "$KEY"` must block; `--body '$HOME'` must pass | R13 cases pass |
| T10 | On-disk `--hook` and `--record` runs (stdin → exit code / stderr / state file) | R7, R11 | spawn cases fail | both modes pass on disk |
| T11 | Register Pre + Post in `.claude/settings.json`, ignore state dir, README | R10 | `grep -c notify-send-guard .claude/settings.json` = 0 | 2 entries present, JSON parses, `.gitignore` line present |
| T12 | Gates | all | — | `bash scripts/run-test-suites.sh`, `node tools/sdd-gate/check.js --base origin/main`, `git ls-files -z \| xargs -0 bash scripts/check-no-secrets.sh` exit 0 |
