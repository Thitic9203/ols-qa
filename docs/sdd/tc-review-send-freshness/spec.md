# Spec — TC review: fresh sources and the right mention before an external send

**Owner request:** 16/Oct/2026 — post-mortem #0194 ("Do this task here: Post-mortem: stale OLS-914 TC review sent") and the owner's correction the same day: the mention "must follow the QA Owner".

## Why

Measured on 16/Oct/2026 (report [#0194](../../post-mortem/20261016-post-mortem-report-0194-tc-review-sent-from-stale-ticket-snapshot.md)):

- The ticket was fetched once at 14:33:31. The PO edited its BR/AC at 15:29:56. The review was sent at 15:34:22 from the 14:33:31 copy, so three findings rested on struck-through BRs and a new AC had no finding.
- The first send mentioned an id recorded from another round, not the TC document's QA Owner.
- `skills/tc-review-workflow/SKILL.md` Step 5 (lines 212–240) checks the destination and the mention *after* sending. It has no check *before* sending that the sources are unchanged (a search for `updated|fresh|re-fetch|stale` finds 0 relevant lines). Line 217 asks for "the exact id" but does not say whose.
- This is the same class as #0105 (evidence for an action must be measured at the time of the action). That rule is text only, so the repeat needs a machine layer.

## Rules

- **R1** — When Step 1 loads the ticket and the TC document, the workflow must record the measured load time of each (`loadedAt`, ISO 8601 with offset, from a real clock, never an estimate).
- **R2** — In the turn that sends or edits a review outside the chat, the workflow must re-read the ticket's `updated` time, its comments, and the TC document, right before the send.
- **R3** — When the ticket `updated` time or any comment `created` time is later than the ticket's `loadedAt`, the workflow must not send. It must go back to Step 1 and tell the user what changed (time and author of the edit or comment).
- **R4** — When the TC document's rows differ from the rows loaded in Step 1, the workflow must not send. It must go back to Step 2.
- **R5** — The person mentioned must be the TC document's QA Owner (its own QA Owner column, or the field the project config names). The platform id comes from the project config. The workflow must not reuse an id from an earlier round. When no id is mapped, it must ask the user.
- **R6** — A checker tool must decide R3 from the times alone: given `loadedAt`, the ticket `updated` time and the newest comment time, it prints BLOCK with both times when either is later, PASS with the times compared when neither is, and refuses (never PASS) when any input is missing or unparseable. A run that compared nothing is never a pass (#0006).
- **R7** — The QA closing checklist must carry one line for R2–R4 and one line for R5.
- **R8** — Skill text stays generic: no project names, ids, people or paths (portable-content rules). Project values stay in the project config.

## Edge cases

- Ticket edited but the edit does not touch AC/EC/BR (e.g. a label): R3 still blocks. Going back to Step 1 costs one re-read, and an unread edit is unknown, not harmless.
- Comment added with no description edit: R3 blocks. PO edits are often announced only in a comment.
- Editing an already-posted review (PATCH): R2–R5 apply the same as a first send.
- Times in different offsets: compare as instants, not strings.

## Done when

- `node tools/review-send-gate/check.js` returns BLOCK for `updated` later than `loadedAt`, BLOCK for a comment later than `loadedAt`, PASS when both are earlier or equal, and REFUSE for a missing or bad time — each a test that fails before the tool exists.
- `skills/tc-review-workflow/SKILL.md` Step 1 records `loadedAt`, Step 5 has the pre-send gate and the QA-Owner mention rule, and QA closing has the two new lines.
- `bash scripts/run-test-suites.sh` is green.
- After merge, the skill file is synced to helix and `bash scripts/helix-parity.sh` passes.
