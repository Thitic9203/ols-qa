# Plan — login by command

Spec: [spec.md](spec.md)

## Files

| File | Change | Rules |
|------|--------|-------|
| `references/parallel-test-lanes.md` | §3 *Dead session*: replace the window steps with relink → mint (FAILED only) → probe. Update the lane prompt and the MUST/NEVER row | R1–R8 |
| `skills/procedures/testing-ticket-workflow/WORKFLOW.md` | Intake *User* row, confirm template *Login* line, pre-flight login smoke, *Fresh login* paragraph, MUST/NEVER row | R1–R9 |
| `skills/procedures/testing-ticket-workflow/references/session-intake.md` | *User* section: record accounts and command templates, no password | R6 R9 |
| `skills/procedures/retest-bug-workflow/execute-and-evidence.md` | §4b Login | R1–R8 |
| `skills/procedures/retest-bug-workflow/WORKFLOW.md` | Config list (account line + command templates), MUST/NEVER row | R6 R9 |
| `skills/testing-ticket-workflow/SKILL.md`, `skills/retest-bug-workflow/SKILL.md` | One rule line in each stub | R1 R2 |
| `docs/sdd/single-login-window/spec.md` | Superseded banner pointing here | — |
| `tools/login-window-rule/check.js` + `check.test.js` | New FORBIDDEN shapes (affirmative "open … login window", "one login window at a time", prefilled-email window, "drive the real login"). Replace the REQUIRED one-window marker with "ready-to-run command". Scan the stubs and `commands/retest-bug.md` | R11 |

## Command templates (in skill text)

The templates are placeholders only. Real names come from the project guide or intake:

```bash
cd <project-dir> && <relink-command> --env <env> --account <account>
```
```bash
cd <project-dir> && <mint-command> --env <env> --account <account>
```

## Options weighed

- **New lint vs. extend `login-window-rule`.** Extending it is better: the same files, the same runner entry and the known-answer tests already exist. A second tool would scan the same text twice.
- **Negation handling.** "Never opens a login window" must pass, and "opens a login window" must fail. A small look-behind window (`never|not|no|n't` within the preceding 40 characters on the same line) is enough for these files. Known-answer tests cover both cases.

## Cost / other repos

New cost: NO. Touches other repos: NO (the testing-bot login tool is untouched).

## What could break

- The lint's REQUIRED marker changes, so any required file not rewritten fails. That is intended (red first).
- Helix copies stay on the old rule until main runs the sync after merge.
