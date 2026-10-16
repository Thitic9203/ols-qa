# Plan — TC review: fresh sources and the right mention before an external send

**Spec:** [spec.md](spec.md)

## Files touched

- `tools/review-send-gate/check.js` (new) — pure comparator for R6. Inputs as flags: `--loaded-at`, `--updated`, `--latest-comment` (optional; `none` when the ticket has no comments). Output: one line `BLOCK|PASS|REFUSE` + the times compared. Exit `1` BLOCK, `0` PASS, `2` REFUSE. No network, no secrets.
- `tools/review-send-gate/check.test.js` (new) — `node:test` cases for every Done-when line, including mixed offsets.
- `tools/review-send-gate/README.md` (new) — what it decides, how the workflow calls it.
- `scripts/run-test-suites.sh` — register the new suite if it is not auto-discovered.
- `skills/tc-review-workflow/SKILL.md` — Step 1 item (R1), Step 5 pre-send gate (R2–R4, R6 call), item 1 mention source (R5), QA closing lines (R7), MUST/NEVER rows.
- helix copy of the same skill file — via `scripts/sync-skills-to-helix.sh` after merge.

No new dependency (Node ≥18 built-ins only). No cost.

## Alternatives weighed

- **Memory rule only** — already done (P1). A text rule is what failed in #0105's class; the repeat rule asks for a stronger layer.
- **A sender tool that fetches Jira and posts to Discord itself** — enforces everything in one place, but needs credentials, network and platform code in a public repo, and is hard to test. Rejected for now.
- **Pure comparator called by the workflow (chosen)** — small, testable offline, portable. It cannot force the agent to call it; the skill text and QA closing line make the call part of Step 5.

## What could break

- Helix parity fails until the skill file is synced after merge.
- An agent may pass the time it *sent* the fetch instead of the time the source was loaded in Step 1; the README states which time goes in `--loaded-at`.
- Jira returns `updated` with a `+0700` offset without a colon; the parser must accept both `+0700` and `+07:00`.
