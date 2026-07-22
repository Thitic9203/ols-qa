# Verify closing checklist (unified)

Use with [session-closing.md](session-closing.md). Check all that apply.

Apply [qa-evidence-gates.md](qa-evidence-gates.md) before any pass/post/done claim.

## All workflows

- [ ] English only in user-facing messages ([user-communication.md](user-communication.md))
- [ ] No success claim without tool output **and** destination re-read where applicable ([qa-evidence-gates.md](qa-evidence-gates.md))
- [ ] Approval gates were not skipped
- [ ] Artifact index posted
- [ ] One-line next-workflow suggestion offered (or “none” stated)
- [ ] `Verdict:` block posted

## TC FE / TC API prep

- [ ] Coverage review **Ready for draft: YES** was posted
- [ ] Coverage delta table posted ([coverage-delta-template.md](coverage-delta-template.md))
- [ ] File row count matches approved table (if files written)
- [ ] Jira/destination UI matches draft (not API response alone)
- [ ] **Post-publish review passed** ([jira-comment-post-review.md](jira-comment-post-review.md)): no literal `<br>`/HTML tags, numbered items on separate lines, attachment present
- [ ] **CSV/Excel attached to Jira issue** (not just saved in workspace) — footer link verified working
- [ ] **Final TC review report posted** ([tc-final-review-report.md](../skills/deprecated/tc-fe-prep-workflow/references/tc-final-review-report.md)): four axes **PASS** (AC/EC alignment, spelling, numbering, scope)
- [ ] Agent did NOT report "commented" / "done" / "TC prep complete" before all checks passed

## Testing ticket

- [ ] Pre-flight **Ready to run: YES** was posted before run
- [ ] F1–F3 summary posted before Phase G
- [ ] Every scenario has result + evidence reference
- [ ] Phase G6 re-read completed if external update ran
- [ ] If Jira/Confluence update: no literal `<br>`/HTML tags, numbered items on separate lines

## Retest bug

- [ ] Retest plan (dev claim vs verify) posted before tests
- [ ] Comment format v2/v3 not switched mid-session
- [ ] **Step 8·0 format-completeness gate PASSED before any status transition** — FE bug: a screenshot per executed case, embedded inline (`!file.png|width=450!`) **and render-verified** on the Jira UI; API bug: full cURL/response per row. A text-only FE comment fails this gate → do NOT transition, resolve or get explicit user waiver first.
- [ ] Screenshots attached before v2 wiki embed (FE)
- [ ] Transition names match workspace guide
- [ ] Post-publish review passed: no stray HTML/markup tags, numbered items on separate lines ([jira-comment-post-review.md](jira-comment-post-review.md))
- [ ] **If the bug landed in Done (PASSED): Step 8d run** — every story this bug `blocks` re-checked on the story's own "is blocked by" list (only **Done** counts as resolved); a story moved to ready-for-QA only if it was parked in the blocked status and every blocker cleared; anything still blocked, or already further along than blocked, reported instead of transitioned.

## Create bug

- [ ] Draft shown before create
- [ ] Each created issue URL fetched and body matches draft
- [ ] `CREATED n/n` in verdict
