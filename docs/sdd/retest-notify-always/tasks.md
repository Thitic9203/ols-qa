# Retest notify is always sent by the agent: tasks

1. Write `tools/retest-guard/notify_send_rule.test.js` (R5) — runs red first. Done: red on main.
2. Add the Step 9 bullet (R1–R3). Done: Step 9 assertions green.
3. Add the guide Transport bullet (R4). Done: guide assertions green; no secret in diff.
4. Run `bash scripts/run-test-suites.sh`. Done: all green.
5. PR → merge → helix sync of `closeout-and-notify.md`.
6. (R6) Extend `notify_send_rule.test.js` to testing-ticket — red first; add Phase G8 notify step to `skills/procedures/testing-ticket-workflow/results-update.md` and the G7 close line. Done: green; helix sync.
