---
name: catch-ai-workflow
description: |-
  Audit finished work (doc, artifact): trace claims to source, split defects from questions, fix with source + prevention.
  Use when the user says CatchAI, /catch-ai, "check yourself", ตรวจงานตัวเองอีกรอบ; before reporting pass/defect/done; or a result rests on a guess (น่าจะ).
  Do NOT use for bug retest (retest-bug), TC tables (tc-fe-prep, tc-api-prep), TC review (tc-review), ticket testing (testing-ticket) or bug filing (create-bug).
---

# Catch AI

Also triggers on: review your work again; find your own mistakes; audit this deliverable.

**Session start:** before anything else, follow [session-start-context.md](../../references/session-start-context.md).

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [The Iron Law](#the-iron-law)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Procedure](#procedure)
- [Hedged conclusions — dig to the deepest layer \[low freedom\]](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom)
- [Quick reference](#quick-reference)
- [Rationalizations — STOP](#rationalizations--stop)
- [Red flags — start over](#red-flags--start-over)
- [Result quality gate (mandatory before an audited verdict is confirmed) \[low freedom\]](#result-quality-gate-mandatory-before-an-audited-verdict-is-confirmed-low-freedom)
- [QA closing (mandatory before "done") \[low freedom\]](#qa-closing-mandatory-before-done-low-freedom)
- [MUST / NEVER](#must--never)
- [Must-read files](#must-read-files)
- [Dependencies](#dependencies)

## Progress checklist

Use the host todo list when the host has one, else copy this block; tick each line as it completes. A failed gate's **Go back:**
line names the step to untick from.

```text
Catch AI progress:
- [ ] Refusal-first (precondition gate)
- [ ] Dependencies checked (last section; fail → fallback or BLOCKED per dependencies.md)
- [ ] Procedure 1 — Fix the scope
- [ ] Procedure 2 — Enumerate
- [ ] Procedure 3 — Name the governing source for each
- [ ] Procedure 4 — Inspect the actual side directly
- [ ] Procedure 5 — Compare character-exact
- [ ] Procedure 6 — Map coverage
- [ ] Procedure 7 — Find the root cause of each defect
- [ ] Procedure 8 — Propose the fix and the prevention
- [ ] Procedure 9 — Report and give the verdict
- [ ] Result quality gate — result-quality-gate.md (N/A only when no test verdict is in scope — its report line says so)
- [ ] QA closing (mandatory before "done") — qa-closing-shared.md, then session-closing.md
```

Order: Refusal-first → Dependencies → Procedure 1–9 (Hedged conclusions run inside steps 2, 4, 7) → Result quality gate → CHECKPOINT → QA closing.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md) and [shared-must-never.md](../../references/shared-must-never.md).

## The Iron Law

```
NO FINDING WITHOUT A VERIFIED EXPECTED SIDE
```

Before reporting anything as wrong, name the source that defines what it should be, and quote it. No source, no finding — it becomes a Question instead.

**Every recommendation carries its source.** Open the document, quote the part that says it,
record version and date ([reference.md § Citation rules](reference.md#citation-rules)). Naming a standard from memory,
guessing a URL, or inventing a flag, rule, or API you did not read is fabrication. When nothing governs the point, label the advice **Judgment** and state the trade-off.

**The count is whatever survives verification.** If the user says there are three mistakes and one survives, report one. If none survive, report `No issue found.` Matching a claimed count is fabrication, not thoroughness.

## Refusal-first (precondition gate)

MUST NOT start without a named audit target. **No target named** (for example the skill was triggered
by "check yourself" with nothing in scope) → 🔴 STOP: ask one question — what should be audited — and stop
until the user answers. MUST NOT file a defect whose expected side came from a
guess, a translation, or a feature name — the expected side must be quoted from its source
(see [The Iron Law](#the-iron-law) above; read [agent-rationalizations.md](../../references/agent-rationalizations.md)). Filing is not
part of this workflow (see [MUST / NEVER](#must--never)); Priority comes from the
[Bug Priority & Severity Matrix](../../references/bug-priority-matrix.md), never invented.

## Procedure

1. **Fix the scope.** Name what is under audit and what is out. Output: the `Scope:` line of the report. When the user did not name the scope, print the `Scope:` line first and continue unless the owner corrects it.
2. **Enumerate** every claim, number, file, screen, endpoint, and section in scope. Output: a numbered inventory list.
3. **Name the governing source for each** — spec, Figma frame, acceptance criterion, OpenAPI path, DB schema, ticket, or data file. A proxy that merely correlates (a file timestamp, a similar page, your own earlier message) governs nothing. Output: the source next to each inventory item.
4. **Inspect the actual side directly** — read the file, run the command, call the endpoint, open the screen. Capture verbatim. Output: the verbatim actual next to each item.
   - Read-only inspection only, in this step and in every later check (step 7, [Hedged conclusions](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom) rule 3).
   - 🔴 A command or call that writes, sends, deletes or changes state (POST/PUT/DELETE, a migration, a post, a create) needs the owner's yes first; wait for it. Without that yes the item is a Question.
5. **Compare character-exact** and classify each item.
   - a. Classes: Defect / Defect (unsourced claim) / Defect (hedged conclusion) / Question / checked-clean. Defect (hedged conclusion): see [Hedged conclusions](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom); it counts in `Defects`: its Actual is the hedged sentence and its Expected is the Confirmed answer with its artifact.
   - b. Output: a classification table (item · expected + source · actual · class), then a count line that tallies each class on its own — `Defects (actual ≠ sourced expected): N · Unsourced claims: N · Questions: N · Clean: N`.
   - c. 🔴 An unsourced claim keeps its severity and its cite-or-remove correction, but is never added to the Defect count, and no row is reclassified to reach the number the user claimed ([The Iron Law](#the-iron-law) — the count is whatever survives verification).
   - d. When any tally, or their sum, equals the claimed number, apply the first [red flag](#red-flags--start-over) before reporting — once; its exit rule says when the matching count stands.
6. **Map coverage** — what has no check at all: each requirement or AC with no check at any level is a Coverage gap, listed apart from defects and never counted as one. Output: the [coverage matrix](reference.md#coverage-matrix) table.
7. **Find the root cause of each defect** using [root-cause-investigation.md](../../references/root-cause-investigation.md) — the owning layer, not the place it surfaced. Output: one Root cause line per defect — the owning layer and a label Confirmed / Suspected / Unknown (Unknown is a Question, never a guessed fix).
   - 🔴 `Suspected` never closes a defect: dig until `Confirmed`, or hold it open as a Question, per [Hedged conclusions](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom) rules 3–4.
8. **Propose the fix and the prevention, each with a citable source.** Output: one [remediation entry](reference.md#remediation-entry-template) per defect.
9. **Report and give the verdict.** Output: the [report template](reference.md#report-template), filled.

**🔴 CHECKPOINT after step 9:** present the report and stop. Hand a confirmed defect to
`create-bug-workflow`, or apply any Correction to the audited work, only after the owner approves
that specific hand-off or edit in chat. Owner declines or does not answer → close with the report as delivered; the Corrections stay unapplied.

## Hedged conclusions — dig to the deepest layer [low freedom]

A result reached by guessing and then closed quietly is the defect this skill exists to catch. A
**hedge** is any word the rule-1 pattern matches — every term [root-cause-investigation.md § 4](../../references/root-cause-investigation.md#hedges) bans, plus a few more.
A **conclusion** is a line that settles something: a cause, a verdict, a status, "fixed", "done",
"not a bug", "no issue", a number.

1. **Hunt them.** In step 2, list every conclusion in the audited work that rests on a hedge with no
   artifact proving it (`grep -nE 'น่าจะ|อาจจะ|คงจะ|คาดว่า|เข้าใจว่า|ดูเหมือน|เป็นไปได้ว่า'` and `grep -niwE 'probably|likely|maybe|might|seems|appears|should be|must be|I think|cache issue|environment issue|flaky|intermittent|race condition|it works on my side'`
   on the audited text are the floor, not the whole hunt — read every conclusion line too). In your own Correction write the required value plainly ("becomes X"), never "should be X".
2. **Classify.** Each one is **Defect (hedged conclusion)** — the conclusion was stated without being
   checked. Never checked-clean, and never a Question that lets the audit end: the hedge is the defect,
   whether or not the guess later turns out right.
3. **Dig.** For each, invoke `superpowers:systematic-debugging` and follow
   [root-cause-investigation.md](../../references/root-cause-investigation.md): reproduce, sweep every
   boundary, and ask "why" layer by layer until the answer stops moving at the deepest layer the owner
   controls (file:line, config key, data row, document section). The Correction is the `Confirmed`
   answer with its artifact plus the fix at that layer — not a reworded guess.
4. **When the bottom cannot be reached.** Only when the next check needs access, data or permission
   this run does not have: keep the item open as a Question with the label `Suspected` or
   `Unknown — not investigated`, the exact check that would settle it, and who or what is needed. The
   verdict for that item cannot be PASSED or `No issue found`.
5. **Your own report.** No hedge in any conclusion line of the catch-ai report — Verdict, Root cause,
   Correction, Remediation, Checked-clean. Exempt: verbatim quotes of the audited work, and a term with its § 4 label + artifact (`FAILED (intermittent, 1 of 2) per run log`). A hedge you
   are about to write means the check is not done: go back to step 4 of the Procedure and run it.

**Go back:** A hedged conclusion found in the audited work, or in your own draft report, returns that
item to Procedure step 4 — Inspect the actual side directly — and then step 7.

## Quick reference

| Situation | Classification |
|---|---|
| Actual differs from a quoted, sourced expected | **Defect** — with severity |
| Expected side cannot be confirmed | **Question** — never a defect |
| Actual side cannot be observed | **Question** — say what access is missing |
| Claim has no governing source, in a deliverable that declares its sources | **Defect (unsourced claim)** — cite it or remove it, never assert the true value |
| Conclusion closed on a hedge (น่าจะ / อาจจะ / probably …) with no artifact | **Defect (hedged conclusion)** — [Hedged conclusions](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom) rules 2–4 |
| Matches its source | **Checked, no issue found** |
| Nothing covers it at any level | **Coverage gap** — reported separately from defects |
| An item a wrong aggregate claim covers ('all N PASSED') but nothing tested | The aggregate claim is **one Defect**; the untested item is a **Coverage gap** only, never a second Defect |
| Fix backed by a document you opened and quoted | **Recommendation** — with source, version, date |
| Fix you believe is right but no standard governs it | **Judgment** — labelled, with the trade-off stated |
| Result changes between identical runs | **FAILED** — flaky is a failure, not a re-run |
| Usable but misses a stated quality bar | **Defect, Major** → **FAILED** — "it works" is not a pass (product bugs: the matrix row decides, [reference.md § Verdict](reference.md#verdict)) |

## Rationalizations — STOP

| Excuse | Answer |
|---|---|
| "They said three, so three" / "one finding looks lazy" | Iron Law: the count is what survives |
| "The file timestamp proves it" | Step 3: a proxy governs nothing |
| "Nothing backs it, so it is false" | Quick reference: unsourced claim or Question |
| "I know this API" / "the URL is probably right" | Iron Law: open and quote the source |
| "Fix it where it showed up" | Step 7: the owning layer |
| "The title should also change" | MUST NOT rewrite beyond the corrections |
| "It passed the second time" | Flaky is FAILED |
| "Probably the cache" / "`Suspected` is allowed" / "the guess was right" | Hedged conclusions rules 2–4 |

## Red flags — start over

- Your finding count equals the number the user claimed.
- A finding whose Expected line has no source, or cites your own prior output.
- "should be", "seems", "probably", or "looks wrong" in an Expected line.
- Your report breaks [Hedged conclusions](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom) rule 5, or a `Suspected` cause closes a defect while its check was runnable.
- A defect written for something you could not actually observe.
- A cited document you did not open in this session, or a URL with no version and no date.
- A recommended flag, rule, option, or API you did not read in its own documentation.
- A finding with no prevention step — nothing stops it coming back.
- The report proposes rewrites nobody asked for.

**Go back:** Any red flag returns you to Procedure step 1 — Fix the scope, and the audit runs again from there.

**Exit for a count that really matches (first red flag only).** The first red flag sends you back once, not forever. After one full re-run from step 1, if every Defect still has a quoted source and no other red flag fires, the count stands:

- Defect tally equals the claim → report it as it stands and add: `Count equals the claim; re-verified once from step 1.`
- Only the sum of tallies equals the claim → write instead: `Defects: N, not the {claimed} claimed; only the sum with unsourced claims equals it; re-verified once from step 1.`
- A second match is no reason to re-run again or to reclassify a row.

## Result quality gate (mandatory before an audited verdict is confirmed) [low freedom]

**No test verdict in scope** (no PASSED / PWMI / FAILED / BLOCKED result for any case, e.g. a release note or a document) → mark this gate `N/A — no test verdict in scope` in the report, tick it, and skip the rest of this section. If even one case verdict is in scope, the gate runs in full for every case.

Run [result-quality-gate.md](../../references/result-quality-gate.md) — all 20 layers, every case, PASSED ones included — **before this audit confirms or rejects any test verdict in the audited work**.

How it runs on an audit (result lines from the audited run's log, checker arguments, checker exit 2, layers that act or are decided before the run, the flaky case, evidence missing from the audit input): [reference.md § Result quality gate in an audit](reference.md#result-quality-gate-in-an-audit).

A red layer blocks that case's verdict: report the case as BLOCKED with the reason, never drop it and never soften the layer. A lane's "gate green" is a claim — the main thread re-runs the gate itself (layer 20).

**Two answers per case, never merged.** The classification (Procedure step 5) answers "does the audited work match its source?"; the gate answers "is this verdict cleared to send now?". A gate hold never rewrites the classification, and the classification never skips the gate.

**Go back:** A red layer returns that case to Procedure step 4 — Inspect the actual side directly; if it still cannot be confirmed, the case is BLOCKED with the reason.

## QA closing (mandatory before "done") [low freedom]

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + this workflow:

- [ ] Scope and out-of-scope stated.
- [ ] Every defect carries Expected (with source), Actual, Reproduce, Environment, Impact.
- [ ] Every unconfirmed item is a Question, not a defect.
- [ ] Every fix carries a source that was opened in this session, or is labelled Judgment.
- [ ] Every defect carries a prevention layer.
- [ ] Coverage gaps listed separately from defects.
- [ ] [Hedged conclusions](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom) rules 1–5 done (both rule-1 greps on the draft — a hit rule 5 does not exempt = not done).
- [ ] Verdict stated: PASSED / PWMI / FAILED / BLOCKED / No issue found, per [reference.md § Verdict](reference.md#verdict). The session-closing § 5 block labels its line `Session verdict:`.

**Go back:** An unchecked item returns to its Procedure step — scope → 1; defect fields → 4–5; Question vs defect → 5; hedged conclusion → 4 then 7; fix source or prevention → 8; coverage gaps → 6; verdict → 9.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST verify the expected side against its governing source before reporting a defect | A guess dressed as spec wastes a retest |
| MUST report the count that survives verification, never the count claimed | Matching a claimed number is fabrication |
| MUST open every source cited in a recommendation | A remembered citation is an invented one |
| MUST attach a prevention layer to every defect | Without it the finding comes back |
| MUST apply [Hedged conclusions](#hedged-conclusions--dig-to-the-deepest-layer-low-freedom) rules 2–5 | A quiet guess ships as fact |
| MUST NOT run a command or call that writes, sends, deletes or changes state during any step (Procedure 4 and 7, Hedged conclusions rule 3) without the owner's yes | An audit must not change what it audits |
| MUST NOT file a Jira bug from this workflow | Filing belongs to `create-bug-workflow` |
| MUST NOT rewrite the audited work beyond the reported corrections, and apply those only after the owner approves them (CHECKPOINT after step 9) | An unasked edit changes delivered work |

## Must-read files

Open each file below at the step that names it, never all up front.

**Read for every audit:**

- At start: [helix-session-constraints.md](../../references/helix-session-constraints.md) once per session; [long-workflow-todos.md](../../references/long-workflow-todos.md) (the progress checklist is the todo list).
- Before any message to the user: [user-communication.md](../../references/user-communication.md); before asking or stopping on a missing input: [skill-rules-style.md](../../references/skill-rules-style.md); before invoking or switching skills: [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md); choosing which skill handles a request: [skill-routing.md](../../references/skill-routing.md).
- Step 7 and Hedged conclusions rule 3, before naming a cause for any failure: [root-cause-investigation.md](../../references/root-cause-investigation.md).
- Step 9, before the verdict or any completion claim: [qa-evidence-gates.md](../../references/qa-evidence-gates.md) (core), then the pre-delivery 7-layer gate, green for every audit, none skipped:
  - Layer 5 for any audit (it files no bug): verdict per [reference.md § Verdict](reference.md#verdict); each product-bug defect states its matrix Priority and is offered as a `create-bug-workflow` hand-off at the CHECKPOINT; an audited PWMI / FAILED case without its linked bug of that Priority is a Defect in the audited work; no remark contradicts its status.
  - Test case in scope: the [gate](../../references/qa-evidence-coverage.md#pre-delivery-completeness--7-layer-defense-gate-before-handing-results-to-the-requester) as written, layer 5 as above. Its capture tools missing → the [dependencies.md](../../references/dependencies.md) out-of-repo fallback.
  - No test case in scope (a document): 1 = recount the step-2 inventory from source now; 2 = every item has a classification row; 3 = open every audited file and cited source;
4 = each report claim names its row, no hedge (rule 5); 6 = nothing only in prose, exclusions in the `Scope:` line; 7 = re-read the report as artifacts only, as a second QA hunting the cut, and answer layers 1–6 by pointer (red → layer 1);
state any unfinished part and why; the count line is the handover.
  - At steps 4–5, read a topic part only when the audit judges that evidence: [qa-evidence-capture.md](../../references/qa-evidence-capture.md) for a recording or screenshots; [qa-evidence-rerecord.md](../../references/qa-evidence-rerecord.md) when the work re-recorded delivered evidence; [qa-evidence-coverage.md](../../references/qa-evidence-coverage.md) for a test run's AC/EC coverage.
- QA closing: [qa-closing-shared.md](../../references/qa-closing-shared.md); at session end [session-closing.md](../../references/session-closing.md).

**Read only when the audit target needs it.** Read the group(s) matching the step-1 target; a target spans several groups → read every matching group.

- A read whose trigger does not occur in this run is skipped (a document-only audit skips skill-routing, skill-invocation-discipline and every group below that does not match).
- Write steps inside these references (PUT a corrected comment, file a bug, say it in the run's channel) are not part of an audit: read them for the rule, do not run the step.

*Defect or non-pass verdict in scope:*

- Read [bug-priority-matrix.md](../../references/bug-priority-matrix.md) when a priority or PWMI / FAILED verdict is about to be written.
- Read [defect-report-completeness.md](../../references/defect-report-completeness.md) before writing up any defect or non-pass (its § 2 repro matrix and § 4 resolution options go under that defect).
- Read [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) before recording any non-PASSED result (its § 4 wait for the decision is the CHECKPOINT after step 9: report the recommendation and stop there).
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a test is flaky or a tool errors.

*UI screen or design in scope:* read [figma-design-comparison.md](../../references/figma-design-comparison.md) before judging a screen or visual result against the design.

*Test run in scope (re-executed or its results audited):*

- Read [customer-escape-prevention.md](../../references/customer-escape-prevention.md) when re-executing a run or judging whether its gates would have stopped a shipped defect.
- Read [playwright-preflight.md](../../references/playwright-preflight.md) only when re-executing a Playwright run; read [resilient-selectors.md](../../references/resilient-selectors.md) only when Playwright selectors are under review.
- Read [test-through-real-steps.md](../../references/test-through-real-steps.md) when judging whether the action was tested through its real steps.
- Read [round-time-contract.md](../../references/round-time-contract.md) when the work reports round times; read [verify-closing-checklist.md](../../references/verify-closing-checklist.md) when the target is a verify or retest close-out.

*Jira artifact in scope (already-posted comment or table):* read [jira-comment-post-review.md](../../references/jira-comment-post-review.md) when the target is a posted Jira comment · [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) when that comment has a table with multi-line cells.

*Follow-up after the report:* read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) when proposing a QA follow-up workflow.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Node.js — only when the workspace has `tools/result-gate/check.js` (else the gate is walked by hand)
- in-repo guard tools (`tools/result-gate`); QA capture and verify tools — only when a test case is in scope
- Atlassian MCP — only when the target is a posted Jira comment or ticket
- Figma (Dev Mode MCP or browser view) — only when a screen is judged against a design
- `superpowers:systematic-debugging`
