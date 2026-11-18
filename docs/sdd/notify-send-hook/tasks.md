# Tasks

| # | Task | Rules | Check that fails first | Done when |
|---|------|-------|------------------------|-----------|
| T1 | Known-answer test `tools/notify-send-guard/notify_send_guard.test.js` | R11 | fails on `main` (check.js absent) | must-block + must-pass per rule committed |
| T2 | `tools/notify-send-guard/check.js` parser + rules + state | R1–R9 | T1 cases fail | `node tools/notify-send-guard/notify_send_guard.test.js` → exit 0 |
| T3 | Register in `.claude/settings.json`, ignore state dir, README | R10 | `grep -c notify-send-guard .claude/settings.json` = 0 | entry present, JSON parses, `.gitignore` line present |
| T4 | Gates | all | — | `bash scripts/run-test-suites.sh`, `node tools/sdd-gate/check.js --base origin/main`, `git ls-files -z \| xargs -0 bash scripts/check-no-secrets.sh` exit 0 |
