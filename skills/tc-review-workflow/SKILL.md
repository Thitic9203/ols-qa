---
name: tc-review-workflow
description: |
  Review a test case document that already exists — written by anyone, in any sheet/CSV/markdown format — against the acceptance criteria (AC), edge cases (EC) and business rules on its governing ticket. Build a traceability matrix, judge coverage and row quality, and report findings as Good vs Need Improve, each anchored to a quoted source. Always notify the finished review to the ticket project's own TC-review channel, asking only which thread.
  Use when the user asks to review test cases, review a TC sheet, check TC quality or coverage before execution, audit someone else's test case document, compare TCs against AC/EC, or wants feedback on a TC document without executing it. Also use for /tc-review.
  Do NOT use for drafting new test cases from a story (tc-fe-prep-workflow / tc-api-prep-workflow), executing a ticket's Playwright pass (testing-ticket-workflow), reviewing already-recorded execution evidence/clips (review-result-workflow), or retesting a bug after a dev fix (retest-bug-workflow).
proactive_triggers:
  - /tc-review
  - review test cases
  - review the test case sheet
  - review tc
  - check tc coverage
  - review testcase
  - รีวิวเทสเคส
---

# TC Review Workflow

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [The Iron Law](#the-iron-law)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Step 1 — Load both sources verbatim \[medium freedom\]](#step-1--load-both-sources-verbatim-medium-freedom)
- [Step 2 — Build the traceability matrix \[medium freedom\]](#step-2--build-the-traceability-matrix-medium-freedom)
- [Step 3 — Row-quality check \[medium freedom\]](#step-3--row-quality-check-medium-freedom)
- [Source sweep before "ask the PO / reporter" (mandatory) \[high freedom\]](#source-sweep-before-ask-the-po--reporter-mandatory-high-freedom)
- [Step 4 — Report Good vs Need Improve \[medium freedom\]](#step-4--report-good-vs-need-improve-medium-freedom)
- [Step 5 — Notify the project's TC-review channel \[low freedom\]](#step-5--notify-the-projects-tc-review-channel-low-freedom)
- [QA closing (mandatory before "done") \[low freedom\]](#qa-closing-mandatory-before-done-low-freedom)
- [Skill composition](#skill-composition)
- [Out of scope](#out-of-scope)
- [MUST / NEVER](#must--never)
- [Must-read files](#must-read-files)
- [Dependencies](#dependencies)

Judge a test case document that someone has **already written** — this workflow never designs or edits
test cases itself. It answers one question: *does this document, as written, prove the ticket's AC/EC and
business rules will be checked?*

Claude Code shortcut: `/tc-review` → [commands/tc-review.md](../../commands/tc-review.md).

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
TC review progress:
- [ ] Refusal-first (precondition gate)
- [ ] Step 1 — Load both sources verbatim
- [ ] Step 2 — Build the traceability matrix
- [ ] Step 3 — Row-quality check
- [ ] Source sweep before "ask the PO / reporter" (mandatory)
- [ ] Step 4 — Report Good vs Need Improve
- [ ] Step 5 — Notify the project's TC-review channel (ask only the thread)
- [ ] QA closing (mandatory before "done")
```

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md) and [shared-must-never.md](../../references/shared-must-never.md).

## The Iron Law

```
NO FINDING WITHOUT A QUOTED SOURCE ON BOTH SIDES
```

Every finding compares two things that were actually opened this session: the TC document's own text, and
the ticket's own AC/EC/business-rules text (or a design source such as Figma/PRD, only after it was
actually opened). "The TC looks incomplete" from a general sense of quality, without the ticket's own
wording quoted next to it, is not a finding — read the ticket, then judge. A design-source claim (exact
copy text, exact UI state) with no source actually opened this session is not a finding either — say
"not verified — could not open {source}" instead of guessing.

This is the same discipline `catch-ai-workflow` runs for finished work in general; this workflow is its
TC-specific instance, run **before** execution rather than after.

## Refusal-first (precondition gate)

MUST NOT start without both:

- the **TC document** — a sheet, CSV, or markdown file, reachable and readable this session;
- the **governing ticket** — a Jira issue key or URL carrying AC/EC (or an equivalent spec source the
  user names explicitly).

Missing either, stop in one message per [skill-rules-style.md](../../references/skill-rules-style.md).

**Cross-org / cross-site ticket:** if the ticket lives on an Atlassian site the connected MCP has not
been granted access to, say so and ask the user to grant it (or paste the AC/EC directly) — never guess
a cloud id, never fall back to a browser login to read it.

---

## Step 1 — Load both sources verbatim [medium freedom]

1. **TC document** — read it as it actually is; do not retype, summarize, or "clean up" wording while
   loading it. Note the exact source (sheet id + tab/gid, file path, or URL) so every later citation can
   point back to it.
2. **Ticket** — fetch AC, EC, and any business-rules / recheck-list section from the ticket's own fields
   (description, custom fields — some projects keep content off `description` entirely; check both).
   Quote AC/EC labels and text exactly as written; never paraphrase from memory of a similar ticket.
3. If a design source (Figma, PRD) is linked and the user wants it cross-checked, open it this session.
   If it cannot be opened (no session, no access, view-only with no rendered content), record that
   plainly — it becomes a "not verified" note next to any related finding, never a silent skip.

---

## Step 2 — Build the traceability matrix [medium freedom]

For every AC and EC on the ticket, list which TC row(s) claim to cover it:

| AC/EC | Claimed by | Status |
|-------|-----------|--------|
| `AC_01` | `TC_003` | covered |
| `AC_05` | — | **no TC — gap** |

**Struck-through AC/EC do not count.** A row the ticket has crossed out (e.g. `-AC_07-`, often marked
as a duplicate) is out of scope: leave it out of the matrix and out of the report entirely. Do not
mention it, not even as "correctly not covered".

**Business rules and ticket comments are context, not extra AC.** Read them to understand what an AC/EC
means, and use them to judge whether a TC tests the right thing. Report a business-rule or comment item
**only when it conflicts with an AC/EC**, and name the AC/EC it contradicts. A rule or comment that has
no TC but does not contradict any AC/EC is not a finding. Leave it out of Need Improve, and do not add a
"spec notes" section for it.

Flag, with the row/AC ids named:

- an AC/EC with zero TCs;
- a TC whose Expected Result verifiably matches a *different* AC than the one it is tagged with;
- the same theme (e.g. a shared UI element) tagged inconsistently across sibling rows — some carry an AC,
  some carry none, with no stated reason.

---

## Step 3 — Row-quality check [medium freedom]

Apply [tc-quality-standards.md](../../references/tc-quality-standards.md) to every row, reading for
these review-specific failure shapes (distinct from authoring quality — this is about a document written
by someone else, so the question is whether it can be trusted, not whether it is elegant):

| Signal | Why it matters |
|--------|-----------------|
| **Steps do not reach the state the title claims.** A row titled "Learner views X" whose steps stop at the main page never actually opens X. | The case cannot verify what it says it verifies. |
| **Expected Result is the AC's own sentence, copied verbatim, with no decomposition.** When the ticket lists several concrete sub-items (fields, states, button variants) under that AC, an Expected Result that just repeats the AC sentence gives the tester nothing to check row by row. | Pass/fail becomes a guess. |
| **The AC enumerates named cases/states** (e.g. "case 1–6", "loading / empty / filter" states) **and the document has one generic row for all of them.** | Most of the enumerated states go untested even though the row is marked done. |
| **Test Data has no concrete value where the AC needs one** (a boundary count, a specific date relationship, a named filter option). | The row cannot be executed as written — the tester would have to invent the missing value. |
| **The row tests a different condition from the AC's wording.** The AC says "already scrolled past" but the row uses "watched to the end". The AC says "only published items" but the Expected Result never checks status. | The row can pass while the AC's own condition stays untested. |
| **The Expected Result is vaguer than the row's own Test Data allows.** The Test Data gives every input needed to compute the answer (scores, counts, a formula), but the Expected Result only says "sorted correctly". | The tester has to work out the expected value mid-run, so a wrong order can still be marked pass. |
| **The row's columns contradict each other.** The Precondition says "4 items" but the Test Data lists 3. The title says "status" but the Expected Result checks order only. | Whichever column the tester follows, the other one is wrong. |
| **A ticket Precondition is missing from every row** (e.g. "user is signed in"). | Every row inherits an unstated setup step. |
| **The setup names a method without giving it** ("there is a way to make the request fail", "prepare enough data"). | Two testers will set it up two different ways. |

Do not flag test-case style choices that do not affect whether the case can be trusted (naming
convention, column order, priority labels) unless the user asks for a style review specifically.

---

## Source sweep before "ask the PO / reporter" (mandatory) [high freedom]

This workflow never decides a product verdict, but it does raise spec-level gaps and questions.
Before any finding becomes "ask the PO / reporter" or "spec unclear", run the source sweep in
layer 14 of [result-quality-gate.md](../../references/result-quality-gate.md): the product code at
the default branch with `path:line`, its inline comments and `git log -L` / blame; the main ticket
and every comment; the surrounding tickets (parent / epic, linked, siblings on the same screen or
API, and tickets the commit messages name); regression results; and the design node. Quote what
was read beside the finding. A question the sources already answer is a finding with its source,
not a question.

## Step 4 — Report Good vs Need Improve [medium freedom]

Two short lists, each bullet anchored to a row id, AC id, or quoted text — never an unanchored opinion.

```text
**Good**
- {finding, with TC/AC id or quote}

**Need Improve**
- {finding, with TC/AC id or quote}
  → Suggest: {how to fix it}
```

**Every Need Improve bullet carries a "→ Suggest:" line** that says how to fix it. A problem with no fix
leaves the TC author guessing. Each suggestion must come from a source, never an invented value:

- **Computed from the row's own data:** when the Test Data already holds the inputs, work out the value
  and give it (e.g. the expected order with each computed score). Show the numbers so the author can
  check them.
- **Taken from the AC/EC wording:** e.g. replace the wrong condition with the AC's own phrase, or add the
  missing Expected Result clause using the AC's own text.
- **No source gives the value** (a threshold, a count or a timing the ticket never states): suggest
  adding the value and say who confirms it ("confirm the count with dev/PO"). Never make up a number.

Keep each bullet tight. The suggestion says what to change, not a rewritten row. If the user asks to
narrow scope (e.g. "drop everything about
X"), regenerate the list from Steps 2–3 with that category removed — do not hand-edit prose reactively,
since the same category will resurface differently worded next time otherwise.

**Language:** match the ticket's / TC document's own language by default (ask once if genuinely mixed).
Helix menus and intake questions stay English per
[user-communication.md](../../references/user-communication.md); the review content itself follows the
destination document's language, the same exception that document already carries.

Post the review in chat before the Step 5 send — an external message cannot be unsent the way a chat
message can. The Step 5 thread question is the go-ahead; do not add a separate "send it?" question.

---

## Step 5 — Notify the project's TC-review channel [low freedom]

Every run sends the finished review to the TC-review notify channel **of the ticket's project** —
whoever invoked the skill, and whether or not they asked for a share. Each project has its own channel;
never post one project's review in another project's channel. The channel comes from that project's
config (its "TC review notify" entry; the real id and webhook live in local secrets, never in the repo).

- **Project has a channel in config → NEVER ask which server, group, or channel.** Ask exactly one
  question: which thread of that channel to post in. Offer the threads already used for this ticket or
  recorded in the config as options. The answer is the go-ahead to send. A guard blocks the channel
  question for such projects (`tools/ask-guard`, state `fixed-destination`) where one is installed.
- **Project has no channel in config →** search conversation history and memory for that project's
  destination first. Found → use it and record it in that project's config. Not found → ask once for that
  project's channel and thread, then record the answer so it is never asked again.

Then:

1. **Identity for a mention:** ask for the exact id (Discord user id, Jira account id, etc.) rather than
   guessing one from a display name — a wrong id either pings nobody or pings the wrong person.
2. **Send, then read the response back** before telling the user it is done: confirm the destination
   (channel/thread id) matches what they asked for, and that a requested mention actually resolved.
3. **Wrong destination → delete and resend** — a message cannot be moved between channels/threads by
   editing it. **Wrong content, correct destination → edit in place** — never delete and repost just to
   fix wording.
4. **Fit the platform's message limit before sending** (Discord: 2,000 characters). Count the characters.
   If the text is too long, tighten the wording. Do not drop findings the user saw in chat, and do not
   split the review into several posts unless the user asks.
5. **Revising a review that is already posted** (new suggestions, a scope cut): edit the existing
   message in place, e.g. a Discord webhook `PATCH …/messages/{id}`, adding `thread_id` when the message is
   in a thread. Do not post a second copy. Read back the edited message and check the id, the destination,
   the mentions and the content.
6. A thread is reached through a webhook plus `thread_id`. Without `thread_id` the message lands in the
   parent channel. Use the webhook the user gave for that thread, and keep it in local secrets, never in
   the repo.
7. Use the wording conventions already established for that surface in this workspace (e.g. a fixed term
   for "ticket" in the destination's language) — check the workspace's own rules before sending; do not
   invent new wording.

**Go back:** If the item-2 read-back shows the wrong destination, return to item 3 (delete and resend); wrong content or an unresolved mention → edit in place (item 5) and read back again. The send is not done before a clean read-back.

---

## QA closing (mandatory before "done") [low freedom]

- [ ] Every AC and EC on the ticket appears in the traceability matrix, covered or flagged as a gap.
- [ ] Struck-through AC/EC appear nowhere in the matrix or the report.
- [ ] Business rules and comments appear in the report only where they conflict with a named AC/EC.
- [ ] Every finding names a TC/AC id or quotes source text — none are a general impression.
- [ ] Every Need Improve bullet has a "→ Suggest:" line. Any value in it was computed from the row or
      quoted from the AC/EC, or the line says who confirms it. No suggestion contains a made-up value.
- [ ] Any design-source (Figma/PRD) claim states plainly whether it was actually opened this session.
- [ ] If sent externally: destination and mentions verified from the read-back response, not assumed.

**Go back:** A matrix item unchecked returns to Step 2; an unanchored finding or a missing "→ Suggest:" line returns to Step 4; a design-source claim not opened returns to Step 1 item 3; an unverified send returns to Step 5 item 2.

See also [qa-evidence-gates.md](../../references/qa-evidence-gates.md).

---

## Skill composition

| Situation | See |
|-----------|-----|
| A finding needs a fresh, skeptical second look | `catch-ai-workflow` |
| The ticket's spec itself looks contradictory or the expected side is unconfirmed | [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) |
| Something breaks mid-review (source won't load, tool errors, unexplained mismatch) | `superpowers:systematic-debugging` |
| The user wants these TCs actually run next | `testing-ticket-workflow` |
| The user wants a fresh TC table designed instead of a review of an existing one | `tc-fe-prep-workflow` / `tc-api-prep-workflow` |

## Out of scope

- Designing or editing test cases — this workflow only judges what is already written.
- Deciding the product's pass/fail verdict — this workflow judges whether the *document* would prove
  that verdict, not whether the product itself is correct.

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST read the ticket's own AC/EC/business-rules text this session before writing any finding | A finding built from memory of a similar ticket is a guess wearing a citation |
| MUST anchor every finding to a TC/AC id or a quoted source | An unanchored finding cannot be checked by the user and cannot be regenerated when scope changes |
| NEVER claim a design-source (Figma/PRD) match without having opened that source this session | A guessed match reads as verified and is trusted like one |
| MUST distinguish a spec-level gap (missing from the ticket's own AC list) from a TC-authoring defect | Blaming the document for a hole the ticket never asked it to fill misdirects the fix |
| NEVER count or mention a struck-through AC/EC | The ticket has already taken it out of scope, so mentioning it is noise |
| NEVER report a business rule or comment that does not conflict with an AC/EC | The AC/EC are the contract. A rule with no TC but no conflict is not a defect in the document |
| MUST give every Need Improve item a sourced "→ Suggest:" fix, and NEVER invent a value for it | A problem without a fix leaves the author guessing. An invented number gets copied into the TC as if it were spec |
| MUST edit an already-posted review in place and keep it within the platform's length limit | A second copy splits the thread. An over-limit post is rejected or cut off |
| NEVER invent a channel, thread, or mention id for an external send | A wrong id either reaches nobody or reaches the wrong person |
| MUST send every review to the ticket project's own TC-review channel, whoever invoked the skill | Each project's team reads its own channel; a review in another project's channel reaches the wrong people |
| NEVER ask which server, group, or channel when the project's config has one — ask only which thread | The answer is already in config; asking again is a repeat question (#0059) |
| MUST read back an external send's response and confirm destination + mentions before saying it is done | "Sent" without a read-back is an unverified claim |
| MUST fix a wrong-destination send by delete-and-resend, and a wrong-content send by edit-in-place | A channel/thread cannot be changed by editing; deleting a correctly-placed message to fix wording destroys its position in the thread for no reason |
| MUST NOT post to Jira/Confluence/GitHub or send an external message before the user has seen the review in chat | The review is the deliverable to approve first — an external send is not the review itself |

## Must-read files

Every file this skill's procedure requires, one hop from here. Read each at the point its line names.

- Read [agent-rationalizations.md](../../references/agent-rationalizations.md) when tempted to skip a step; each excuse has its correct action.
- Read [bug-priority-matrix.md](../../references/bug-priority-matrix.md) before setting any priority or a PWMI / FAILED verdict.
- Read [customer-escape-prevention.md](../../references/customer-escape-prevention.md) before any QA run; the gates that stop shipped defects.
- Read [defect-report-completeness.md](../../references/defect-report-completeness.md) before writing up any defect or non-pass.
- Read [figma-design-comparison.md](../../references/figma-design-comparison.md) before judging any UI or visual result against the design.
- Read [helix-session-constraints.md](../../references/helix-session-constraints.md) once at session start.
- Read [jira-comment-post-review.md](../../references/jira-comment-post-review.md) after posting a Jira comment, before saying done.
- Read [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) before posting a Jira table with multi-line cells.
- Read [long-workflow-todos.md](../../references/long-workflow-todos.md) when the workflow has many steps; keep the todo list.
- Read [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) before recording any result that is not PASSED.
- Read [playwright-preflight.md](../../references/playwright-preflight.md) before any Playwright run.
- Read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) when a QA follow-up could be suggested.
- Read [qa-closing-shared.md](../../references/qa-closing-shared.md) before saying done; shared closing checklist.
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a test is flaky or a tool errors.
- Read [qa-evidence-gates.md](../../references/qa-evidence-gates.md) before any completion claim.
- Read [resilient-selectors.md](../../references/resilient-selectors.md) when writing or fixing Playwright selectors.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [round-time-contract.md](../../references/round-time-contract.md) when a round starts and before reporting times.
- Read [session-closing.md](../../references/session-closing.md) at session end.
- Read [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) before invoking or switching skills.
- Read [skill-routing.md](../../references/skill-routing.md) when choosing which skill handles a request.
- Read [test-through-real-steps.md](../../references/test-through-real-steps.md) before testing an action; no API shortcut for the action under test.
- Read [verify-closing-checklist.md](../../references/verify-closing-checklist.md) before reporting a verify or retest done.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Atlassian MCP
- Figma (only when a design cross-check is asked)
- clone of the product repo (`{MONOREPO}`) for the source sweep
- Node.js + in-repo guard tools (`tools/result-gate`)
- the ticket project's TC-review notify channel + its webhook (project config / local secrets)
- `superpowers:systematic-debugging`
