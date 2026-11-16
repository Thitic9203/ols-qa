---
name: tc-review-workflow
description: |-
  Review an existing TC document (sheet/CSV/markdown) against its ticket's AC/EC and rules: traceability matrix, Good vs Need Improve with quoted sources, notify the TC-review channel.
  Use when asked to review or audit TCs or a TC sheet, check coverage/quality, /tc-review, "รีวิวเทสเคส", or when TCs come with "is this enough / OK?".
  Do NOT use for drafting TCs (tc-fe-prep / tc-api-prep), executing (testing-ticket), evidence clips (review-result), or retest.
---

# TC Review Workflow

Also triggers on: review test cases; review the test case sheet; review tc; check tc coverage; review testcase.

**Session start:** before anything else, follow [session-start-context.md](../../references/session-start-context.md).

## Contents

Steps: see the checklist below.

Judge a test case document that someone has **already written** — this workflow never designs or edits
test cases itself. It answers one question: *does this document, as written, prove the ticket's AC/EC and
business rules will be checked?*

## Progress checklist

Copy this block into your response at the start and tick each line as it completes. A failed gate
sends you back to the step its **Go back:** line names — untick from there.

```text
TC review progress:
- [ ] Dependencies
- [ ] Refusal-first (precondition gate)
- [ ] Step 1 — Load both sources verbatim
- [ ] Step 2 — Build the traceability matrix
- [ ] Step 3 — Row-quality check
- [ ] Step 3b — Source sweep before "ask the PO / reporter" (mandatory)
- [ ] Step 4 — Report Good vs Need Improve
- [ ] Step 5 — Notify the project's TC-review channel (ask only the thread)
- [ ] QA closing (mandatory before "done"), then session-closing.md
```

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md) and [shared-must-never.md](../../references/shared-must-never.md).

## The Iron Law

```
NO FINDING WITHOUT A QUOTED SOURCE ON BOTH SIDES
```

Every finding compares two things actually opened this session: the TC document's own text and
the ticket's own AC/EC/business-rules text (or a design source such as Figma/PRD, only after it was
opened). "The TC looks incomplete" from a general sense of quality, without the ticket's wording
quoted beside it, is not a finding. A design-source claim (exact copy text, exact UI state) with no
source opened this session is not a finding either — say "not verified — could not open {source}".

## Refusal-first (precondition gate)

MUST NOT start without both:

- the **TC document** — a sheet, CSV, or markdown file, reachable and readable this session;
- the **governing ticket** — a Jira issue key or URL carrying AC/EC (or an equivalent spec source the
  user names explicitly).

🔴 **STOP —** missing either, stop in one message per [skill-rules-style.md](../../references/skill-rules-style.md).

**Cross-org / cross-site ticket** (an Atlassian site the connected MCP has no access to): say so and ask the user to grant it or paste the AC/EC — never guess a cloud id, never fall back to a browser login.

---

## Step 1 — Load both sources verbatim [medium freedom]

1. **TC document** — read it as it is; do not retype, summarize, or "clean up" wording. Note the exact
   source (sheet id + tab/gid, file path, or URL) for every citation.
2. **Ticket** — fetch AC, EC, and any business-rules / recheck-list section from the ticket's own fields
   (description, custom fields — some projects keep content off `description` entirely; check both).
   Quote AC/EC labels and text exactly as written; never paraphrase from memory of a similar ticket.
   **No AC/EC found in either place** → stop per the refusal-first gate. **Spec text found but its
   items carry no AC/EC labels** → 🔴 **STOP —** show the text found and ask the user how to number it
   before Step 2; never invent labels.
   **The ticket or TC document fetch errors, times out, or returns partial content** (truncated text,
   missing fields, tabs that do not load) → tell the user the exact error or what is missing, build no
   matrix from partial text, hand the failure to `superpowers:systematic-debugging`, and resume Step 1
   once the full text loads.
3. Cross-check a design source (Figma, PRD) only when the user asks (a link alone is not a request); open it this session.
   Apply [figma-design-comparison.md](../../references/figma-design-comparison.md) §1–§2 only (its §4–§6 are test verdicts). If it cannot be opened (no session, no access, view-only with no rendered content), record that
   plainly — it becomes a "not verified" note next to any related finding, never a silent skip.

Output: TC source id, quoted AC/EC list, any `not verified` note.

---

## Step 2 — Build the traceability matrix [medium freedom]

For every AC and EC on the ticket, list which TC row(s) claim to cover it (no row carries an AC/EC tag → map by Expected Result vs AC text, mark each `inferred` in Claimed by, and report the missing tags once under Need Improve):

| AC/EC | Claimed by | Status |
|-------|-----------|--------|
| `AC_01` | `TC_003` | covered |
| `AC_05` | — | **no TC — gap** |
| `AC_02` | `TC_007` | **mis-tagged — TC_007 matches AC_04** |
| `EC_01` | `TC_010`, `TC_011` | **inconsistent tag — TC_010, TC_011, TC_012** (`TC_012` tests the same element with no tag) |

**Status is a closed list** — use exactly one of these four values per row, naming the ids as shown:
`covered` · `no TC — gap` · `mis-tagged — <TC> matches <AC/EC>` · `inconsistent tag — <TC ids>`.
A row with several problems takes the first value that applies in that order (`covered` only when none applies).
A TC row with no id → cite its sheet row or cell, and report the missing ids once under Need Improve. A hole in the
ticket's own AC list is a spec-level gap, not a matrix row — report it under Need Improve as a spec
question (see MUST / NEVER).

**Struck-through AC/EC do not count.** A row the ticket has crossed out (e.g. `-AC_07-`, often marked
as a duplicate) is out of scope: leave it out of the matrix and out of the report entirely. Do not
mention it, not even as "correctly not covered".

**Business rules and ticket comments are context, not extra AC.** Use them to understand an AC/EC and to
judge whether a TC tests the right thing. Report one **only when it conflicts with an AC/EC**, naming that
AC/EC. A rule or comment with no TC that contradicts no AC/EC is not a finding. Leave it out of Need Improve,
add no "spec notes" section, and do not name it anywhere else — no Sources/inputs line, closing or self-check line, not even as "not reported".

Name the row/AC ids. Gap = an AC/EC with zero TCs; mis-tagged = the Expected Result verifiably matches a *different* AC than the one tagged; inconsistent tag = the same theme (e.g. a shared UI element) tagged across sibling rows, some with an AC and some with none, no stated reason.

Output: the matrix (one closed-list Status per non-struck AC/EC) plus spec-level gaps → Step 4.

---

## Step 3 — Row-quality check [medium freedom]

Apply [tc-quality-standards.md](../../references/tc-quality-standards.md) to every row, reading for
these review-specific failure shapes (not authoring quality: can someone else's document be trusted):

| Signal | Why it matters |
|--------|-----------------|
| **Steps do not reach the state the title claims.** A row titled "Learner views X" whose steps stop at the main page never actually opens X. | The case cannot verify what it says it verifies. |
| **Expected Result is the AC's own sentence, copied verbatim, with no decomposition.** When the ticket lists several concrete sub-items (fields, states, button variants) under that AC, an Expected Result that just repeats the AC sentence gives the tester nothing to check row by row. | Pass/fail becomes a guess. |
| **The AC enumerates named cases/states** (e.g. "case 1–6", "loading / empty / filter" states) **and the document has one generic row for all of them.** | Most of the enumerated states go untested even though the row is marked done. |
| **Test Data has no concrete value where the AC needs one** (a boundary count, a specific date relationship, a named filter option). | The row cannot be executed as written — the tester would have to invent the missing value. |
| **The row tests a different condition from the AC's wording.** The AC says "already scrolled past" but the row uses "watched to the end". | The row can pass while the AC's own condition stays untested. |
| **The Expected Result is vaguer than the row's own Test Data allows.** The Test Data gives every input needed to compute the answer (scores, counts, a formula), but the Expected Result only says "sorted correctly". | The tester has to work out the expected value mid-run, so a wrong order can still be marked pass. |
| **The row's columns contradict each other.** The Precondition says "4 items" but the Test Data lists 3. The title says "status" but the Expected Result checks order only. | Whichever column the tester follows, the other one is wrong. |
| **Expected Result is only "correct" / "complete" / "properly" / "ถูกต้อง" / "ครบถ้วน".** | No observable value to compare, so any outcome passes. |
| **A ticket Precondition is missing from every row** (e.g. "user is signed in"). | Every row inherits an unstated setup step. |
| **The setup names a method without giving it** ("there is a way to make the request fail", "prepare enough data"). | Two testers will set it up two different ways. |

Do not flag style choices that do not affect whether the case can be trusted (naming convention,
column order, priority labels) unless the user asks for a style review. This overrides
tc-quality-standards.md here: ignore its Priority attribute and its review-gate "Priorities assigned" line.

Output: per flagged row, signal + quoted cell → Step 4 Need Improve.

---

## Step 3b — Source sweep before "ask the PO / reporter" (mandatory) [low freedom]

This workflow raises spec-level gaps and questions, never a product verdict.
Before any finding becomes "ask the PO / reporter" or "spec unclear", run steps 1–5 of layer 14 in
[result-quality-gate.md](../../references/result-quality-gate.md) (step 6 and the result-gate checker do not
apply: no verdict line, no data creation): the product code at the default branch with `path:line`, its
inline comments and `git log -L` / blame; the main ticket and every comment; surrounding tickets (the
parent / epic's children and linked issues via the Atlassian MCP, siblings on the same screen or API,
tickets the commit messages name); regression results (the sheet the project guide names); the design
node (only if Step 1 item 3 opened it). Quote what was read beside the finding. A question the sources
already answer is a finding with its source, not a question.

**Product clone missing or unreadable** (the `{MONOREPO}` check in
[dependencies.md](../../references/dependencies.md) fails): do not stop the review and do not skip the
code layer silently. Write `code not checked — no clone` next to every question the code layer would
have answered, continue the sweep with the remaining sources, and never present such a question as
sweep-complete — it goes to Step 4 carrying that note. **Any other source unreachable** (ticket search errors, no regression sheet in the guide, design not opened): write `{source} not checked — {reason}` the same way.

Output per item: the finding (or remaining question) + the quoted source with its location
(`path:line`, ticket key + comment, regression row, design node), or the `… not checked` note.

**Go back:** A question the sweep answers returns to Step 2 or 3 as a sourced finding; only a question
no source answers goes to Step 4 as "confirm with dev/PO".

---

## Step 4 — Report Good vs Need Improve [medium freedom]

The delivered review is the Step 2 matrix, then two short lists, each bullet anchored to a row id, AC id, or quoted text.

```text
**Good**
- {finding, with TC/AC id or quote}

**Need Improve**
- {finding, with TC/AC id or quote}
  → Suggest: {how to fix it}

**Document:** {Pass | Need Improve | Unverified}
```

**Document:** Unverified wins if any row is "unverified expected"; else Need Improve if that list has a bullet; else Pass. It is no test verdict; the session-closing `Verdict:` stays separate (COMPLETE after a clean Step 5 read-back, PARTIAL when the send was declined, BLOCKED when a source will not load).

**Every Need Improve bullet carries a "→ Suggest:" line** that says how to fix it. Each suggestion must come from a source, never an invented value:

- **Computed from the row's own data:** the Test Data holds the inputs → work out the value and show
  its numbers (e.g. the expected order with each computed score).
- **Taken from the AC/EC wording:** replace the wrong condition with the AC's own phrase, or add the
  missing Expected Result clause from the AC's own text.
- **No source gives the value** (a threshold, count or timing the ticket never states, including a boundary inferred from
  AC wording, e.g. "past 20" → 21): the Suggest line says to add it and who confirms ("confirm with dev/PO"). Never make up a number.

One finding per bullet, at most two lines plus its Suggest line. The Suggest line says what to change, not a rewritten row. If the user asks to
narrow scope (e.g. "drop everything about
X"), regenerate the list from Steps 2–3 with that category removed — never hand-edit prose reactively.

**Language:** match the ticket's / TC document's own language by default, judged by the AC/EC and TC cell text. Mixed =
the two differ → 🔴 **STOP —** in one message ask which language to write the review in and the Step 5 destination
question (thread, or channel + thread when config has none). That answer is not the go-ahead: send only on the
user's OK after the item-5 preview.
Helix menus, intake questions and the thread question follow the user's language per
[user-communication.md](../../references/user-communication.md); only the review content follows the
destination document's language.

Post the review in chat before the Step 5 send. Step 5 then asks the thread question with the item-5 preview in the same message; unless the language question was asked or the item-5 text differs,
that thread answer is the go-ahead; do not add a separate "send it?" question.

---

## Step 5 — Notify the project's TC-review channel [low freedom]

Once Step 4 is in chat, run [notify.md](notify.md) in full.

---

## QA closing (mandatory before "done") [low freedom]

- [ ] Every AC and EC on the ticket appears in the traceability matrix, covered or flagged as a gap.
- [ ] Struck-through AC/EC appear nowhere; business rules and comments appear only where they conflict with a named AC/EC.
- [ ] Every finding names a TC/AC id or quotes source text.
- [ ] Every Need Improve bullet has a "→ Suggest:" line; its values were computed from the row, quoted from the AC/EC, or the line says who confirms them.
- [ ] Any design-source (Figma/PRD) claim states plainly whether it was actually opened this session.
- [ ] Every "confirm with dev/PO" question carries its Step 3b sources or `code not checked — no clone`.
- [ ] If sent externally: destination and mentions verified from the read-back response, not assumed.
- [ ] If the user declined the send: `notify not sent — user declined` is written here and in the final report.

Layers of [qa-evidence-coverage.md](../../references/qa-evidence-coverage.md) for a TC review (qa-evidence-gates.md has no "core" section or TC row; these lines are the reading) — all must hold:

- Coverage 1 / pre-delivery 1: reopen the ticket now, re-extract the non-struck AC/EC labels and TC row ids, compare with the matrix (not `evidence_plan.py`).
- Coverage 2, 4, 6 / pre-delivery 4, 6: each AC/EC has a TC row or a `no TC — gap` row; every finding is a list bullet or matrix row anchored to a TC/AC id or quote, none only in prose; matrix rows == non-struck AC/EC.
- Coverage 7 / pre-delivery 7: any mismatch → nothing is sent; read the review as a skeptical reviewer, any red → back to Step 2.

**Go back:** A matrix item unchecked returns to Step 2; an unanchored finding or a missing "→ Suggest:" line returns to Step 4; a design-source claim not opened returns to Step 1 item 3; an unswept question returns to Step 3b; an unverified send returns to Step 5 item 5.

---

## Skill composition

| Situation | See |
|-----------|-----|
| A finding needs a skeptical second look | `catch-ai-workflow` |
| The ticket's spec itself looks contradictory or the expected side is unconfirmed | read [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) |
| Something breaks mid-review (source won't load, tool error, mismatch) | `superpowers:systematic-debugging` |
| The user wants these TCs actually run next | `testing-ticket-workflow` |

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST read the ticket's own AC/EC/business-rules text this session before writing any finding | Memory of a similar ticket invents findings. |
| MUST anchor every finding to a TC/AC id or a quoted source | An unanchored finding cannot be checked. |
| NEVER claim a design-source (Figma/PRD) match without having opened that source this session | An unopened source is a guess. |
| NEVER mark a row **Good**, or pass the document, when its Expected Result is interpreted or borrowed from another ticket, a similar feature or memory: each expected needs a quote from THIS ticket (AC/EC, design node, PRD section, or a PO/dev comment with author and date). List the rest under Need Improve as "unverified expected" and give the document the verdict **Unverified** | A borrowed expected passes a wrong row. |
| MUST distinguish a spec-level gap (missing from the ticket's own AC list) from a TC-authoring defect | The fix owner differs (PO, TC author). |
| NEVER count or mention a struck-through AC/EC | The ticket crossed it out. |
| NEVER report a business rule or comment that does not conflict with an AC/EC | Only a conflict changes what a TC must test. |
| MUST give every Need Improve item a sourced "→ Suggest:" fix, and NEVER invent a value for it | An unsourced fix is a guess. |
| MUST NOT post to Jira/Confluence/GitHub or send an external message before the user has seen the review in chat | The user sees it before it goes out. |
| MUST run Step 5 exactly as written — it is the single source for the notify rules | A second copy would drift. |

Red flags: "the TC looks incomplete" with no ticket quote → not a finding, quote both sides (Iron Law); "the expected is obvious from a similar ticket" → list it as unverified expected (Step 4).

## Must-read files

Open each file below at the step that names it, never all up front.

- At start: [helix-session-constraints.md](../../references/helix-session-constraints.md) once per session; the progress checklist above stands in for [long-workflow-todos.md](../../references/long-workflow-todos.md).
- Before invoking or switching skills: [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md); to choose a skill: [skill-routing.md](../../references/skill-routing.md).
- At QA closing, before saying done: [qa-closing-shared.md](../../references/qa-closing-shared.md) and [qa-evidence-gates.md](../../references/qa-evidence-gates.md) and [qa-evidence-coverage.md](../../references/qa-evidence-coverage.md) (layers as QA closing reads them; no Out-of-scope block names a struck-through AC/EC or non-conflicting rule — Step 2 wins); at session end [session-closing.md](../../references/session-closing.md).

### Only if triggered (exact condition on each line)

- Read [agent-rationalizations.md](../../references/agent-rationalizations.md) when tempted to skip a step.
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) only when a source fetch or send tool errors and `superpowers:systematic-debugging` is unavailable.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) when proposing a QA follow-up workflow.
- Only when the user also asks for the review to be posted to a Jira ticket: read [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) before building that table and [jira-comment-post-review.md](../../references/jira-comment-post-review.md) after the post, before saying done.

### Execution-only files (this workflow never triggers them)

A TC review runs no tests, rounds, bug priority, test verdict or bug; it must not load the execution-only references linked from the shared files: [round-time-contract](../../references/round-time-contract.md), [bug-priority-matrix](../../references/bug-priority-matrix.md), [customer-escape-prevention](../../references/customer-escape-prevention.md), [verify-closing-checklist](../../references/verify-closing-checklist.md), `defect-report-completeness`, `playwright-preflight`, `resilient-selectors`, `test-through-real-steps` (`.md` in references/).

## Dependencies

Checks and install hints: [dependencies.md](../../references/dependencies.md). Run each where named; a failed check stops only where marked:

- Atlassian MCP — before Step 1; fail → stop (Refusal-first)
- Figma (only when a design cross-check is asked) — fail → `not verified` note (Step 1 item 3)
- clone of the product repo (`{MONOREPO}`) — at Step 3b; fail → `code not checked — no clone`, the review continues
- `tools/result-gate` is not run here (no `results.jsonl`)
- the project's TC-review notify channel + webhook (config / local secrets) — at Step 5 item 4; fail → ask for the webhook, the review stays in chat
- `superpowers:systematic-debugging` — on the first tool error; unavailable → qa-debug-discipline.md
