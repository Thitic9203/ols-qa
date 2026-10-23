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

The templates are placeholders only. Real names come from the project guide or intake.

**Amended 23/Oct/2026 (spec R12–R15):** each step is one combined block that loops over its accounts, isolates each one and prints OK / FAILED with a log path. The old one-block-per-account templates are superseded.

```bash
cd <project-dir> && for a in <account-1> <account-2>; do echo "=== $a"; <relink-command> --env <env> --account "$a" >/tmp/relink-$a.log 2>&1 && echo "$a OK" || echo "$a FAILED (log: /tmp/relink-$a.log)"; done
```
```bash
cd <project-dir> && for a in <failed-account-1> <failed-account-2>; do echo "=== $a"; <mint-command> --env <env> --account "$a" >/tmp/mint-$a.log 2>&1 && echo "$a OK" || echo "$a FAILED (log: /tmp/mint-$a.log)"; done
```

Risk (mint step): the owner-approved shape sends stdout/stderr to the log. A mint command that prints its own secret prompt to stdout/stderr shows that prompt only in the log, so the block looks paused. Prompts read from the terminal device are not affected. The skill text says so in one generic line ("if the block pauses, the mint command is waiting for your input in this terminal"). The real command name stays in the project guide.

### Amendment 23/Oct — files (R12–R15)

| File | Change | Rules |
|------|--------|-------|
| `references/parallel-test-lanes.md` | §3 *Dead session* steps 1–2: one combined block each; MUST/NEVER row | R12–R14 |
| `skills/procedures/testing-ticket-workflow/WORKFLOW.md` | *Fresh login* steps 1–2; MUST/NEVER row | R12–R14 |
| `skills/procedures/retest-bug-workflow/execute-and-evidence.md` | §4b steps 1–2 | R12–R14 |
| `skills/procedures/retest-bug-workflow/WORKFLOW.md` | MUST/NEVER row | R12 |
| `skills/procedures/retest-bug-workflow/references/project-config-template.md` | Relink / mint template rows → combined loop | R12 R14 |
| `skills/testing-ticket-workflow/SKILL.md`, `skills/retest-bug-workflow/SKILL.md` | Rule line 5a | R12 |
| `tools/login-window-rule/check.js` + `check.test.js` | FORBIDDEN `PER_ACCOUNT_BLOCK` (one `bash` block each / per account / per command; one block per needed account; one block for that account alone); REQUIRED `NO_COMBINED_BLOCK` ("one combined `bash` block") | R15 |

## Options weighed

- **New lint vs. extend `login-window-rule`.** Extending it is better: the same files, the same runner entry and the known-answer tests already exist. A second tool would scan the same text twice.
- **Negation handling.** "Never opens a login window" must pass, and "opens a login window" must fail. A small look-behind window (`never|not|no|n't` within the preceding 40 characters on the same line) is enough for these files. Known-answer tests cover both cases.

## Cost / other repos

New cost: NO. Touches other repos: NO (the testing-bot login tool is untouched).

## What could break

- The lint's REQUIRED marker changes, so any required file not rewritten fails. That is intended (red first).
- Helix copies stay on the old rule until main runs the sync after merge.
