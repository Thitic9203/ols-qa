---
name: catch-ai-workflow
description: |
  Audit work that is already finished — your own prior output, a document or report, a test artifact, or a feature under test — by tracing every claim to the source that governs it, separating confirmed defects from open questions, and closing each defect with a sourced fix and a prevention layer.
  Use when the user says CatchAI, /catch-ai, claims mistakes exist in something already delivered, asks you to review your own work again, check yourself, find your own mistakes, QA or audit a deliverable, or says ตรวจงานตัวเองอีกรอบ. Also use before reporting that a check passed, that a defect exists, or that work is complete.
  Do NOT use for retesting a Jira bug after a dev fix (retest-bug-workflow), for drafting new TC tables (tc-fe-prep-workflow / tc-api-prep-workflow), for running a ticket's Playwright pass (testing-ticket-workflow), or for filing the bug once a defect is confirmed (create-bug-workflow).
proactive_triggers:
  - /catch-ai
  - CatchAI
  - review your work again
  - find your own mistakes
  - check yourself
  - audit this deliverable
  - ตรวจงานตัวเองอีกรอบ
---

# Catch AI

Audit finished work the way a senior QA engineer does: every claim traced to the source that governs it, every defect reproducible, every gap named, nothing invented.

**Core principle: a defect is "actual differs from a *confirmed* expected".** Actual differing from what you assumed, translated, or inferred is not a defect — it is a question.

Claude Code shortcut: `/catch-ai` → [commands/catch-ai.md](../../commands/catch-ai.md).

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md) and [shared-must-never.md](../../references/shared-must-never.md).

## The Iron Law

```
NO FINDING WITHOUT A VERIFIED EXPECTED SIDE
```

Before reporting anything as wrong, name the source that defines what it should be, and quote it. No source, no finding — it becomes a Question instead. This is the same rule the QA workflows enforce: a screen differing from what you *think* the design says is not a defect until the design itself is read.

**Every recommendation carries its source.** Open the document, quote the part that says it, record version and date. Naming a standard from memory, guessing a URL, or inventing a flag, rule, or API you did not read is fabrication — the defect this workflow exists to catch. When nothing governs the point, label the advice **Judgment** and state the trade-off.

**The count is whatever survives verification.** If the user says there are three mistakes and one survives, report one. If none survive, report `No issue found.` Matching a claimed count is fabrication, not thoroughness.

## Refusal-first (precondition gate)

MUST NOT start without a named audit target. MUST NOT file a defect whose expected side came from a
guess, a translation, or a feature name — that is the OLS-315 failure, recorded in
[agent-rationalizations.md](../../references/agent-rationalizations.md). MUST NOT open a Jira bug from
this workflow; a confirmed defect hands off to `create-bug-workflow`, and Priority comes from the
[Bug Priority & Severity Matrix](../../references/bug-priority-matrix.md), never invented.

## Procedure

1. **Fix the scope.** Name what is under audit and what is out.
2. **Enumerate** every claim, number, file, screen, endpoint, and section in scope.
3. **Name the governing source for each** — spec, Figma frame, acceptance criterion, OpenAPI path, DB schema, ticket, or data file. A proxy that merely correlates (a file timestamp, a similar page, your own earlier message) governs nothing.
4. **Inspect the actual side directly** — read the file, run the command, call the endpoint, open the screen. Capture verbatim.
5. **Compare character-exact** and classify each item: Defect / Question / checked-clean.
6. **Map coverage** — what has no check at all.
7. **Find the root cause of each defect** using [root-cause-investigation.md](../../references/root-cause-investigation.md) — the owning layer, not the place it surfaced.
8. **Propose the fix and the prevention, each with a citable source.**
9. **Report and give the verdict.**

Audit dimensions, evidence standard, severity, verdict, prevention layers, the standard-source
registry, and the report template: [reference.md](reference.md).

## Quick reference

| Situation | Classification |
|---|---|
| Actual differs from a quoted, sourced expected | **Defect** — with severity |
| Expected side cannot be confirmed | **Question** — never a defect |
| Actual side cannot be observed | **Question** — say what access is missing |
| Claim has no governing source, in a deliverable that declares its sources | **Defect (unsourced claim)** — cite it or remove it, never assert the true value |
| Matches its source | **Checked, no issue found** |
| Nothing covers it at any level | **Coverage gap** — reported separately from defects |
| Fix backed by a document you opened and quoted | **Recommendation** — with source, version, date |
| Fix you believe is right but no standard governs it | **Judgment** — labelled, with the trade-off stated |
| Result changes between identical runs | **FAILED** — flaky is a failure, not a re-run |
| Usable but misses a stated quality bar | **FAILED** — "it works" is not a pass |

## Rationalizations — STOP

| Excuse | Reality |
|---|---|
| "They said there are three, so there are three" | A claim is not evidence. Report what survives verification, even if that is zero. |
| "Coming back with one finding looks lazy" | One verified finding beats three inventions. |
| "The file timestamp proves the date is wrong" | A proxy that correlates does not govern the claim. Cite the source that defines it or file a Question. |
| "Nothing backs this line, so it is fabricated" | Unbacked ≠ false. Report it as an unsourced claim, or a Question — never assert a value you could not observe. |
| "I know this API well enough to skip the docs" | Knowing it is how wrong flags get published. Open the page and quote it. |
| "The URL is probably right" | Probably-right URLs are invented citations. Open it or drop it. |
| "Fixing where it showed up is faster" | That is a symptom patch. It returns as the same finding next audit. |
| "While I am here, the title should also change" | Out of scope. Audit, do not rewrite. |
| "It passed the second time I ran it" | Flaky is FAILED. Find the cause. |

## Red flags — start over

- Your finding count equals the number the user claimed.
- A finding whose Expected line has no source, or cites your own prior output.
- "should be", "seems", "probably", or "looks wrong" in an Expected line.
- A defect written for something you could not actually observe.
- A cited document you did not open in this session, or a URL with no version and no date.
- A recommended flag, rule, option, or API you did not read in its own documentation.
- A finding with no prevention step — nothing stops it coming back.
- The report proposes rewrites nobody asked for.

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + this workflow:

- [ ] Scope and out-of-scope stated.
- [ ] Every defect carries Expected (with source), Actual, Reproduce, Environment, Impact.
- [ ] Every unconfirmed item is a Question, not a defect.
- [ ] Every fix carries a source that was opened in this session, or is labelled Judgment.
- [ ] Every defect carries a prevention layer.
- [ ] Coverage gaps listed separately from defects.
- [ ] Verdict stated: PASSED / FAILED / BLOCKED / No issue found.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST verify the expected side against its governing source before reporting a defect | A guess dressed as a spec wastes a full retest cycle |
| MUST report the count that survives verification, never the count claimed | Matching a claimed number is fabrication |
| MUST open every source cited in a recommendation | A remembered citation is an invented one |
| MUST attach a prevention layer to every defect | A fix without prevention returns as the same finding |
| MUST NOT file a Jira bug from this workflow | Filing belongs to `create-bug-workflow` after the defect is confirmed |
| MUST NOT rewrite the audited work beyond the reported corrections | Audit and rewrite are different jobs |
