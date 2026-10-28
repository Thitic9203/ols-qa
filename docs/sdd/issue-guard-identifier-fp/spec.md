# Spec — issue-creation-guard: names are not orders

## Problem (verified 2026-10-28)
`tools/issue-creation-guard/check.js` `inspectAgentPrompt` blocks an Agent prompt when a verb (create/open/file…) and an object (bug/ticket/issue…) sit within 25 characters on one line. It reads skill names, branch names and file paths as words, so lane prompts for the Helix skill-quality round were blocked although they order no issue:
- `create-bug-workflow` → matched `create-bug` (verb and object inside one skill name).
- `fix/r5-testing-ticket, PR #74 open` → matched `ticket, PR #74 open` (object at the end of a branch name, then the PR's status word).
Proof: `node -e` run of `inspectAgentPrompt` on both lines → `hit: true`; on `Do not open any GitHub issue` → `hit: false`; on `Open a GitHub issue for the failing case.` → `hit: true`.

## Rules
**R1.** When an Agent prompt line names something by an identifier — a path or branch (a token with `/` that also has `-` or `.`), a file name (a token with a `.ext`), or a kebab-case name of three or more parts (`create-bug-workflow`) — the guard must judge the line without that identifier.
**R2.** A kebab-case token of two parts whose parts are one guard verb and one guard object (`create-bug`, `open-issue`) is also a name and must be ignored.
**R3.** The guard must still block every order it blocks today: all existing known-answer "must catch" cases keep passing, plus `open a bug-report for this` and `create a ticket/bug in Jira`.
**R4.** No change to the Bash patterns, the confirm/unlock flow, the stop audit, or the negation words.

## Done when
- New known-answer tests: the two lane lines above → not blocked; `Open a GitHub issue for the failing case.`, `open a bug-report for this`, `create a ticket/bug in Jira` → blocked.
- `node tools/issue-creation-guard/issue_creation_guard.test.js` and `bash scripts/run-test-suites.sh` green.
- Owner decision 2026-10-28: "แก้ guard + เทสต์" (fix the guard, add tests) rather than a one-off unlock.
