# Retest notify is always sent by the agent: plan

## Files
- `skills/procedures/retest-bug-workflow/closeout-and-notify.md` — Step 9: add one bullet (R1–R3). Generic wording, no OLS values (portable-content).
- `references/ols-project-guide.md` — § Retest-bug QA notify: add a "Transport" bullet (R4) with placeholders/paths only.
- `tools/retest-guard/notify_send_rule.test.js` — new test (R5): asserts the phrases exist.

## Options weighed
- Make the helper read `.discord_webhook` itself: lives in another repo (`ols-qa-testing-bot`), out of scope here.
- Doc + test (chosen): the skill is what the agent follows; the test stops the rule being edited away.

## What could break
- `portable_content.test.js` if an OLS value lands under `skills/` — Step 9 text stays generic.
- helix parity: `skills/procedures/` is shared — run `scripts/sync-skills-to-helix.sh` after merge.
