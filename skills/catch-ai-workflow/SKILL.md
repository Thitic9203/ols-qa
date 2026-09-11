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

Follow [shared-preamble.md](../../references/shared-preamble.md) and [shared-must-never.md](../../references/shared-must-never.md). The report additionally answers to [defect-report-completeness.md](../../references/defect-report-completeness.md) (the no-follow-up-question contract), [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) (challenge a finding before it is recorded), and the **Pre-delivery completeness gate** in [qa-evidence-gates.md](../../references/qa-evidence-gates.md) (the adversarial-reviewer bar) — full mechanics in [reference.md](reference.md).

## The Iron Law

```
NO FINDING WITHOUT A VERIFIED EXPECTED SIDE
```

Before reporting anything as wrong, name the source that defines what it should be, and quote it. No source, no finding — it becomes a Question instead. This is the same rule the QA workflows enforce: a screen differing from what you *think* the design says is not a defect until the design itself is read.

**A source governs only while it is current.** Before a mismatch becomes a Defect, confirm the cited source itself has not been superseded by a newer version, a linked ticket, or a later decision — the same check [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) §2 requires. A superseded source makes the finding **not a defect**; recommend updating the stale source instead, citing both.

**Every recommendation carries its source.** Open the document, quote the part that says it, record version and date. Naming a standard from memory, guessing a URL, or inventing a flag, rule, or API you did not read is fabrication — the defect this workflow exists to catch. When nothing governs the point, label the advice **Judgment** and state the trade-off.

**The count is whatever survives verification.** If the user says there are three mistakes and one survives, report one. If none survive, report `No issue found.` Matching a claimed count is fabrication, not thoroughness.

**Finished means a second reviewer needs nothing from you.** The report is not done when it feels complete — it is done when a developer, the user, or a different AI given only the report and the source material can act on every finding and every fix without asking a single follow-up question. That bar is [defect-report-completeness.md](../../references/defect-report-completeness.md)'s own definition, and it is enforced by the pre-delivery pass below, not by how thorough the work felt while doing it.

## Refusal-first (precondition gate)

MUST NOT start without a named audit target. MUST NOT file a defect whose expected side came from a
guess, a translation, or a feature name — that is the OLS-315 failure, recorded in
[agent-rationalizations.md](../../references/agent-rationalizations.md). MUST NOT open a Jira bug from
this workflow; a confirmed defect hands off to `create-bug-workflow`, and Priority comes from the
[Bug Priority & Severity Matrix](../../references/bug-priority-matrix.md), never invented.

## Procedure

1. **Fix the scope.** Name what is under audit and what is out.
2. **Enumerate** every claim, number, file, screen, endpoint, and section in scope, and give each a stable id — this is the coverage baseline step 7 reconciles against.
3. **Name the governing source for each** — spec, Figma frame, acceptance criterion, OpenAPI path, DB schema, ticket, or data file. A proxy that merely correlates (a file timestamp, a similar page, your own earlier message) governs nothing. Confirm the source is current, not superseded (Iron Law).
4. **Inspect the actual side directly** — read the file, run the command, call the endpoint, open the screen. Capture verbatim. If two of your own observations of the same item disagree, do not classify yet — re-check that item cleanly and record which observation was the artifact and why (defect-report-completeness.md §3b).
5. **Compare character-exact** and classify each item: Defect / Question / checked-clean. When the actual side is a working, deliberate change to a stale source rather than a wrong value, use the two-option resolution table ([reference.md](reference.md)) instead of a bare Defect.
6. **Map coverage** — what has no check at all, reported as a coverage gap, not a defect.
7. **Reconcile, fail-closed.** Every id enumerated in step 2 now has exactly one classification: Defect, Question, checked-clean, or coverage gap. An id with none of these is not "probably fine" — go back and classify it before continuing.
8. **Find the root cause of each defect** using [root-cause-investigation.md](../../references/root-cause-investigation.md) — the owning layer, not the place it surfaced — and label it `Confirmed` / `Suspected` / `Unknown — not investigated`.
9. **Propose the fix and the prevention**, each with a citable source, the blast radius (every other consumer of the changed code/field/route/token, and whether each was checked), and evidence the verification step was actually run.
10. **Run the pre-delivery adversarial pass** ([reference.md](reference.md)) — read the finished report as a second reviewer with no memory of doing the work. Any question you cannot answer by pointing at the report itself sends you back to the gap it exposes.
11. **Report and give the verdict.**

Audit dimensions, evidence standard, severity, verdict, prevention layers, the standard-source
registry, the pre-delivery adversarial pass, and the report template: [reference.md](reference.md).

## Quick reference

| Situation | Classification |
|---|---|
| Actual differs from a quoted, sourced expected | **Defect** — with severity and the Severity-table row it matches |
| Expected side cannot be confirmed | **Question** — never a defect |
| Actual side cannot be observed | **Question** — say what access is missing |
| Claim has no governing source, in a deliverable that declares its sources | **Defect (unsourced claim)** — cite it or remove it, never assert the true value |
| Matches its source | **Checked, no issue found** |
| Nothing covers it at any level | **Coverage gap** — reported separately from defects |
| Cited source is stale / superseded by a newer decision | **Not a defect** — recommend updating the source, cite both (old + superseding) |
| Actual is a deliberate change, expected text was never updated | **Resolution options** (reference.md) — named owner decides, QA doesn't edit either side |
| Two of your own observations of the same item disagree | **Not classifiable yet** — clean re-check first (defect-report-completeness.md §3b) |
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
| "I already re-read it once, it's fine" | One self-read is the same mind that wrote it. The pre-delivery pass requires reading it as someone with no memory of doing the work. |
| "The source says X, that's good enough to cite" | A source can be right and still stale. Confirm it wasn't superseded before the mismatch becomes a Defect. |
| "Root cause is obviously the cache/config" | That is a hedge wearing a conclusion. Label it `Suspected` and name the check that would confirm it, or run the check. |

## Red flags — start over

- Your finding count equals the number the user claimed.
- A finding whose Expected line has no source, or cites your own prior output.
- "should be", "seems", "probably", or "looks wrong" in an Expected line.
- A defect written for something you could not actually observe.
- A cited document you did not open in this session, or a URL with no version and no date.
- A recommended flag, rule, option, or API you did not read in its own documentation.
- A finding with no prevention step — nothing stops it coming back.
- The report proposes rewrites nobody asked for.
- A root-cause line with no `Confirmed` / `Suspected` / `Unknown` label.
- An enumerated item from step 2 that step 7's reconciliation cannot find a classification for.
- You have not yet read the finished report as a second reviewer with none of this session's memory.
- A "Change" line that describes a fix in prose but shows no actual diff, snippet, or exact edit.
- A severity label with no Severity-table row named behind it.

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + this workflow:

- [ ] Scope and out-of-scope stated.
- [ ] Every enumerated item reconciles to exactly one classification (step 7) — none left unclassified.
- [ ] Every defect carries Expected (with source), Actual, Reproduce (a matrix per entry point when more than one applies), Environment, Impact, and a `Severity because` line naming the Severity-table row it matches.
- [ ] Every unconfirmed item is a Question, not a defect; every source-vs-source conflict is a Question or a resolution-options table, not a guessed Defect.
- [ ] Every fix carries a source that was opened in this session, or is labelled Judgment.
- [ ] Every defect carries a prevention layer and a blast-radius check (who else consumes the changed code/field/route/token).
- [ ] Every root-cause line is labelled `Confirmed` / `Suspected` / `Unknown — not investigated`.
- [ ] Coverage gaps listed separately from defects.
- [ ] Pre-delivery adversarial pass complete — the report answers a second reviewer's questions by pointing at itself, not from memory.
- [ ] Verdict stated: PASSED / FAILED / BLOCKED / No issue found.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST verify the expected side against its governing source before reporting a defect | A guess dressed as a spec wastes a full retest cycle |
| MUST confirm the cited source has not been superseded before the mismatch becomes a Defect | A stale-but-cited source produces a real-looking defect against a rule nobody follows anymore |
| MUST report the count that survives verification, never the count claimed | Matching a claimed number is fabrication |
| MUST open every source cited in a recommendation | A remembered citation is an invented one |
| MUST reconcile every enumerated item to a classification before reporting | An item silently left off the report reads as "checked, fine" to the next reader |
| MUST label every root-cause statement `Confirmed` / `Suspected` / `Unknown — not investigated` | A `Suspected` cause read as `Confirmed` sends the fix to the wrong layer |
| MUST attach a prevention layer and a blast-radius check to every defect | A fix without prevention returns as the same finding; an unchecked consumer breaks somewhere else |
| MUST run the pre-delivery adversarial pass before showing the report | The bar is "a second AI with only this report needs nothing else" — that is verified, not assumed |
| MUST NOT file a Jira bug from this workflow | Filing belongs to `create-bug-workflow` after the defect is confirmed |
| MUST NOT rewrite the audited work beyond the reported corrections | Audit and rewrite are different jobs |
