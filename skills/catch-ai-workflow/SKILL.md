---
name: catch-ai-workflow
description: |
  Audit work that is already finished — the agent's own prior output, a document or report, a test artifact, or a feature under test — by tracing every claim to the source that governs it, separating confirmed defects from open questions, and closing each defect with a sourced fix and a prevention layer.
  Use when the user says CatchAI, /catch-ai, claims mistakes exist in something already delivered, asks the agent to review its own work again, says "check yourself" or "find your own mistakes", QA or audit a deliverable, or says ตรวจงานตัวเองอีกรอบ. Also use before reporting that a check passed, that a defect exists, or that work is complete.
  Do NOT use for retesting a Jira bug after a dev fix (retest-bug-workflow), for drafting new TC tables (tc-fe-prep-workflow / tc-api-prep-workflow), for running a ticket's Playwright pass (testing-ticket-workflow), or for filing the bug once a defect is confirmed (create-bug-workflow).
metadata:
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

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [The Iron Law](#the-iron-law)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Procedure \[high freedom\]](#procedure-high-freedom)
- [Quick reference](#quick-reference)
- [Rationalizations — STOP](#rationalizations--stop)
- [Red flags — start over](#red-flags--start-over)
- [Result quality gate (mandatory before an audited verdict is confirmed) \[low freedom\]](#result-quality-gate-mandatory-before-an-audited-verdict-is-confirmed-low-freedom)
- [QA closing (mandatory before "done") \[low freedom\]](#qa-closing-mandatory-before-done-low-freedom)
- [MUST / NEVER](#must--never)
- [Must-read files](#must-read-files)
- [Dependencies](#dependencies)

Audit finished work the way a senior QA engineer does: every claim traced to the source that governs it, every defect reproducible, every gap named, nothing invented.

**Core principle: a defect is "actual differs from a *confirmed* expected".** Actual differing from what you assumed, translated, or inferred is not a defect — it is a question.

Claude Code shortcut: `/catch-ai` → [commands/catch-ai.md](../../commands/catch-ai.md).

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
Catch AI progress:
- [ ] Dependencies checked (see Dependencies; fail → fallback or BLOCKED per dependencies.md)
- [ ] Refusal-first (precondition gate)
- [ ] Procedure 1 — Fix the scope
- [ ] Procedure 2 — Enumerate
- [ ] Procedure 3 — Name the governing source for each
- [ ] Procedure 4 — Inspect the actual side directly
- [ ] Procedure 5 — Compare character-exact
- [ ] Procedure 6 — Map coverage
- [ ] Procedure 7 — Find the root cause of each defect
- [ ] Procedure 8 — Propose the fix and the prevention
- [ ] Procedure 9 — Report and give the verdict
- [ ] Result quality gate (mandatory before an audited verdict is confirmed; N/A only when no test verdict is in scope — say so in the report)
- [ ] QA closing (mandatory before "done")
```

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

MUST NOT start without a named audit target. **No target named** (for example the skill was triggered
by "check yourself" with nothing in scope) → ask one question — what should be audited — and stop
until the user answers. MUST NOT file a defect whose expected side came from a
guess, a translation, or a feature name — the expected side must be quoted from its source
(see [The Iron Law](#the-iron-law) above; read [agent-rationalizations.md](../../references/agent-rationalizations.md)). Filing is not
part of this workflow (see [MUST / NEVER](#must--never)); Priority comes from the
[Bug Priority & Severity Matrix](../../references/bug-priority-matrix.md), never invented.

## Procedure [high freedom]

1. **Fix the scope.** Name what is under audit and what is out. Output: the `Scope:` line of the report.
2. **Enumerate** every claim, number, file, screen, endpoint, and section in scope. Output: a numbered inventory list.
3. **Name the governing source for each** — spec, Figma frame, acceptance criterion, OpenAPI path, DB schema, ticket, or data file. A proxy that merely correlates (a file timestamp, a similar page, your own earlier message) governs nothing. Output: the source next to each inventory item.
4. **Inspect the actual side directly** — read the file, run the command, call the endpoint, open the screen. Capture verbatim. Read-only inspection only: a command or call that writes, sends, deletes or changes state (POST/PUT/DELETE, a migration, a post, a create) → 🔴 ask the owner first and wait; without that yes the item is a Question. Output: the verbatim actual next to each item.
5. **Compare character-exact** and classify each item: Defect / Defect (unsourced claim) / Question / checked-clean. Output: a classification table (item · expected + source · actual · class), then a count line that tallies each class on its own — `Defects (actual ≠ sourced expected): N · Unsourced claims: N · Questions: N · Clean: N`. 🔴 An unsourced claim keeps its severity and its cite-or-remove correction, but is never added to the Defect count, and no row is reclassified to reach the number the user claimed ([The Iron Law](#the-iron-law) — the count is whatever survives verification). When any tally, or their sum, equals the claimed number, apply the first [red flag](#red-flags--start-over) before reporting — once; its exit rule says when the matching count stands.
6. **Map coverage** — what has no check at all. Output: the [coverage matrix](reference.md#coverage-matrix) table.
7. **Find the root cause of each defect** using [root-cause-investigation.md](../../references/root-cause-investigation.md) — the owning layer, not the place it surfaced. Output: one Root cause line per defect — the owning layer and a label Confirmed / Suspected / Unknown (Unknown is a Question, never a guessed fix).
8. **Propose the fix and the prevention, each with a citable source.** Output: one [remediation entry](reference.md#remediation-entry-template) per defect.
9. **Report and give the verdict.** Output: the [report template](reference.md#report-template), filled.

**🔴 CHECKPOINT after step 9:** present the report and stop. Hand a confirmed defect to
`create-bug-workflow`, or apply any Correction to the audited work, only after the owner approves
that specific hand-off or edit in chat.

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
| Usable but misses a stated quality bar | **Defect, Major** → **FAILED** — "it works" is not a pass (product bugs: the matrix row decides, [reference.md § Verdict](reference.md#verdict)) |

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

**Go back:** Any red flag returns you to Procedure step 1 — Fix the scope, and the audit runs again from there.

**Exit for a count that really matches (first red flag only).** The first red flag sends you back once, not forever. After one full re-run from step 1, if every Defect still has a quoted source and no other red flag fires, report the count as it stands — even when it equals the user's number — and add this line to the report: `Count equals the claim; re-verified once from step 1.` A second match after that re-run is not a reason to re-run again, and never a reason to reclassify a row.

## Result quality gate (mandatory before an audited verdict is confirmed) [low freedom]

Run [result-quality-gate.md](../../references/result-quality-gate.md) — all 20 layers, every case, PASSED
ones included — **before this audit confirms or rejects any test verdict in the audited work**. Write one final result line per case (older lines marked
`superseded`), run the mechanical layers with the workspace's checker when it has one (`test -f tools/result-gate/check.js` → run the `node tools/result-gate/check.js …` command in [result-quality-gate.md](../../references/result-quality-gate.md) step 2), walk the
judgement layers, and paste the checker's last output line (or the counted hand check) into the
round's record. No `tools/result-gate/` in the workspace → walk all 20 layers by hand, count them,
and say in the record that the check was by hand ([dependencies.md](../../references/dependencies.md),
in-repo guard tools). A red layer blocks that case's verdict: report the case as BLOCKED with the
reason, never drop it and never soften the layer. A lane's "gate green"
is a claim — the main thread re-runs the gate itself (layer 20).

**Flaky case** (the run log shows a different result between identical runs — [Quick reference](#quick-reference)): its audited verdict is FAILED, and an earlier PASSED for that case is a Defect in the audited work. The gate runs on that FAILED line like on any other; only a red layer named in the report holds it BLOCKED instead. It never becomes PASSED.

**No test verdict in scope** (the audited work contains no PASSED / PWMI / FAILED / BLOCKED result for any case — for example a release note or a document) → mark this gate `N/A — no test verdict in scope` in the report, with that reason, and tick it. If even one case verdict is in scope, the gate runs in full for every case.

**Go back:** A red layer returns that case to Procedure step 4 — Inspect the actual side directly; if it still cannot be confirmed, the case is BLOCKED with the reason.

## QA closing (mandatory before "done") [low freedom]

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + this workflow:

- [ ] Scope and out-of-scope stated.
- [ ] Every defect carries Expected (with source), Actual, Reproduce, Environment, Impact.
- [ ] Every unconfirmed item is a Question, not a defect.
- [ ] Every fix carries a source that was opened in this session, or is labelled Judgment.
- [ ] Every defect carries a prevention layer.
- [ ] Coverage gaps listed separately from defects.
- [ ] Verdict stated: PASSED / PWMI / FAILED / BLOCKED / No issue found, per [reference.md § Verdict](reference.md#verdict).

**Go back:** An unchecked item returns to its Procedure step — scope → 1; defect fields → 4–5; Question vs defect → 5; fix source or prevention → 8; coverage gaps → 6; verdict → 9.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST verify the expected side against its governing source before reporting a defect | A guess dressed as a spec wastes a full retest cycle |
| MUST report the count that survives verification, never the count claimed | Matching a claimed number is fabrication |
| MUST open every source cited in a recommendation | A remembered citation is an invented one |
| MUST attach a prevention layer to every defect | A fix without prevention returns as the same finding |
| MUST NOT run a command or call that writes, sends, deletes or changes state during inspection without the owner's yes (Procedure step 4) | An audit must not change the thing it audits |
| MUST NOT file a Jira bug from this workflow | Filing belongs to `create-bug-workflow` after the defect is confirmed |
| MUST NOT rewrite the audited work beyond the reported corrections, and apply those only after the owner approves them (CHECKPOINT after step 9) | Audit and rewrite are different jobs; an unasked edit changes delivered work behind the owner's back |

## Must-read files

Every file this skill's procedure requires, one hop from here. Read each at the point its line names.

**Read for every audit:**

- Read [bug-priority-matrix.md](../../references/bug-priority-matrix.md) before setting any priority or a PWMI / FAILED verdict.
- Read [defect-report-completeness.md](../../references/defect-report-completeness.md) before writing up any defect or non-pass.
- Read [helix-session-constraints.md](../../references/helix-session-constraints.md) once at session start.
- Read [long-workflow-todos.md](../../references/long-workflow-todos.md) at the start of every audit (this procedure has 9 steps); keep the todo list.
- Read [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) before recording any result that is not PASSED.
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a test is flaky or a tool errors.
- Read [qa-evidence-gates.md](../../references/qa-evidence-gates.md) before any completion claim.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [session-closing.md](../../references/session-closing.md) at session end.
- Read [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) before invoking or switching skills.
- Read [skill-routing.md](../../references/skill-routing.md) when choosing which skill handles a request.
- Read [skill-rules-style.md](../../references/skill-rules-style.md) before asking the user or stopping on a missing input.
- Read [user-communication.md](../../references/user-communication.md) before any message to the user.

**Read only when the audit target needs it.** This workflow never posts, files or runs anything on its own; pick the group that matches the audit target from step 1 and read only that group (several groups only when the target spans them):

*UI screen or design in scope:*

- Read [figma-design-comparison.md](../../references/figma-design-comparison.md) before judging a UI screen or visual result against the design.

*Test run in scope (the audit re-executes a run, or audits a run's results):*

- Read [customer-escape-prevention.md](../../references/customer-escape-prevention.md) when the audit re-executes a test run, or judges whether a run's gates would have stopped a shipped defect.
- Read [playwright-preflight.md](../../references/playwright-preflight.md) only when the audit re-executes a Playwright run.
- Read [resilient-selectors.md](../../references/resilient-selectors.md) only when the audited work includes Playwright selectors under review.
- Read [test-through-real-steps.md](../../references/test-through-real-steps.md) when judging whether a run tested the action through its real steps (no API shortcut for the action under test).
- Read [round-time-contract.md](../../references/round-time-contract.md) when the audited work reports round times or durations.
- Read [verify-closing-checklist.md](../../references/verify-closing-checklist.md) when the audit target is a verify or retest close-out.

*Jira artifact in scope (an already-posted comment or table is the audit target):*

- Read [jira-comment-post-review.md](../../references/jira-comment-post-review.md) when the audit target is a Jira comment someone already posted.
- Read [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) when that posted comment has a table with multi-line cells.

*Follow-up after the report:*

- Read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) when proposing a QA follow-up workflow.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Node.js
- in-repo guard tools (`tools/result-gate`)
- `superpowers:systematic-debugging`
