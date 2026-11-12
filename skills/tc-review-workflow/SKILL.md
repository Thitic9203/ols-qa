---
name: tc-review-workflow
description: |-
  Review an existing TC document (sheet/CSV/markdown) against its ticket's AC/EC and rules: traceability matrix, Good vs Need Improve with quoted sources, notify the TC-review channel.
  Use when asked to review TCs or a TC sheet, check coverage/quality, audit someone's TCs, /tc-review, "รีวิวเทสเคส", or a pasted sheet + "is this OK?".
  Do NOT use for drafting TCs (tc-fe-prep / tc-api-prep), executing (testing-ticket), evidence clips (review-result), or retest.
metadata:
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

**Session start:** before anything else, follow [session-start-context.md](../../references/session-start-context.md).

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [The Iron Law](#the-iron-law)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Step 1 — Load both sources verbatim \[medium freedom\]](#step-1--load-both-sources-verbatim-medium-freedom)
- [Step 2 — Build the traceability matrix \[medium freedom\]](#step-2--build-the-traceability-matrix-medium-freedom)
- [Step 3 — Row-quality check \[medium freedom\]](#step-3--row-quality-check-medium-freedom)
- [Step 3b — Source sweep before "ask the PO / reporter" (mandatory) \[low freedom\]](#step-3b--source-sweep-before-ask-the-po--reporter-mandatory-low-freedom)
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

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
TC review progress:
- [ ] Refusal-first (precondition gate)
- [ ] Step 1 — Load both sources verbatim
- [ ] Step 2 — Build the traceability matrix
- [ ] Step 3 — Row-quality check (open tc-quality-standards.md)
- [ ] Step 3b — Source sweep before "ask the PO / reporter" (mandatory; result-quality-gate.md layer 14)
- [ ] Step 4 — Report Good vs Need Improve
- [ ] Step 5 — Notify the project's TC-review channel (ask only the thread)
- [ ] QA closing (mandatory before "done") — qa-closing-shared.md + qa-evidence-gates.md core + qa-evidence-coverage.md, then session-closing.md
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

## Refusal-first (precondition gate)

MUST NOT start without both:

- the **TC document** — a sheet, CSV, or markdown file, reachable and readable this session;
- the **governing ticket** — a Jira issue key or URL carrying AC/EC (or an equivalent spec source the
  user names explicitly).

🔴 **STOP —** missing either, stop in one message per [skill-rules-style.md](../../references/skill-rules-style.md).

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
   **No AC/EC found in either place** → stop per the refusal-first gate. **Spec text found but its
   items carry no AC/EC labels** → 🔴 **STOP —** show the text found and ask the user how to number it
   before Step 2; never invent labels.
   **The ticket or TC document fetch errors, times out, or returns partial content** (truncated text,
   missing fields, tabs that do not load) → tell the user the exact error or what is missing, do not build
   the matrix from partial AC/EC or a partial TC document, hand the failure to
   `superpowers:systematic-debugging`, and resume Step 1 only once the full text loads.
3. Cross-check a design source (Figma, PRD) only when the user asks (a link alone is not a request); open it this session.
   If it cannot be opened (no session, no access, view-only with no rendered content), record that
   plainly — it becomes a "not verified" note next to any related finding, never a silent skip.

Output: TC source id, quoted AC/EC list, any `not verified` note.

---

## Step 2 — Build the traceability matrix [medium freedom]

For every AC and EC on the ticket, list which TC row(s) claim to cover it (no row carries an AC/EC tag → map by Expected Result vs AC text, mark each `inferred` in Claimed by, and report the missing tags once under Need Improve):

| AC/EC | Claimed by | Status |
|-------|-----------|--------|
| `AC_01` | `TC_003` | covered |
| `AC_05` | — | **no TC — gap** |
| `AC_02` | `TC_007` | **mis-tagged** — `TC_007` Expected Result matches `AC_04` |
| `EC_01` | `TC_010`, `TC_011` | **inconsistent tag** — sibling `TC_012` tests the same element with no tag |

**Status is a closed list** — use exactly one of these four values per row, naming the ids as shown:
`covered` · `no TC — gap` · `mis-tagged — <TC> matches <AC/EC>` · `inconsistent tag — <TC ids>`.
A row with several problems takes the first that applies in that order after `covered`. A hole in the
ticket's own AC list is a spec-level gap, not a matrix row — report it under Need Improve as a spec
question (see MUST / NEVER).

**Struck-through AC/EC do not count.** A row the ticket has crossed out (e.g. `-AC_07-`, often marked
as a duplicate) is out of scope: leave it out of the matrix and out of the report entirely. Do not
mention it, not even as "correctly not covered".

**Business rules and ticket comments are context, not extra AC.** Read them to understand what an AC/EC
means, and use them to judge whether a TC tests the right thing. Report a business-rule or comment item
**only when it conflicts with an AC/EC**, and name the AC/EC it contradicts. A rule or comment that has
no TC but does not contradict any AC/EC is not a finding. Leave it out of Need Improve, add no "spec notes"
section, and do not name it anywhere else — no Sources/inputs line, closing or self-check line, not even as "not reported".

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
convention, column order, priority labels) unless the user asks for a style review specifically. This
overrides tc-quality-standards.md here: ignore its Priority attribute and its review-gate
"Priorities assigned" line unless the user asks for a style review.

Output: per flagged row, signal + quoted cell → Step 4 Need Improve.

---

## Step 3b — Source sweep before "ask the PO / reporter" (mandatory) [low freedom]

This workflow never decides a product verdict, but it does raise spec-level gaps and questions.
Before any finding becomes "ask the PO / reporter" or "spec unclear", run the source sweep in
layer 14 of [result-quality-gate.md](../../references/result-quality-gate.md): the product code at
the default branch with `path:line`, its inline comments and `git log -L` / blame; the main ticket
and every comment; the surrounding tickets (parent / epic, linked, siblings on the same screen or
API, and tickets the commit messages name); regression results; and the design node. Quote what
was read beside the finding. A question the sources already answer is a finding with its source,
not a question.

**Product clone missing or unreadable** (the `{MONOREPO}` check in
[dependencies.md](../../references/dependencies.md) fails): do not stop the review and do not skip the
code layer silently. Write `code not checked — no clone` next to every question the code layer would
have answered, continue the sweep with the remaining sources, and never present such a question as
sweep-complete — it goes to Step 4 carrying that note.

Output per item: the finding (or the remaining question) + the quoted source with its location
(`path:line`, ticket key + comment, regression row, design node), or the `code not checked — no clone`
note when the code layer could not run.

**Go back:** A question the sweep answers returns to Step 2 or 3 as a sourced finding; only a question
no source answers goes to Step 4 as "confirm with dev/PO".

---

## Step 4 — Report Good vs Need Improve [medium freedom]

The delivered review is the Step 2 matrix, then two short lists, each bullet anchored to a row id, AC id, or quoted text — never an unanchored opinion.

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
- **No source gives the value** (a threshold, count or timing the ticket never states, including a boundary inferred from
  AC wording, e.g. "past 20" → 21): the Suggest line says to add it and who confirms ("confirm with dev/PO"). Never make up a number.

One finding per bullet, at most two lines plus its Suggest line. The Suggest line says what to change, not a rewritten row. If the user asks to
narrow scope (e.g. "drop everything about
X"), regenerate the list from Steps 2–3 with that category removed — do not hand-edit prose reactively,
since the same category will resurface differently worded next time otherwise.

**Language:** match the ticket's / TC document's own language by default. Mixed = the ticket's AC/EC and the TC
document are written in different languages → 🔴 **STOP —** ask the user once which language to write the review in.
Helix menus, intake questions and the thread question follow the user's language per
[user-communication.md](../../references/user-communication.md); only the review content itself follows the
destination document's language.

Post the review in chat before the Step 5 send — an external message cannot be unsent the way a chat
message can. The Step 5 thread question is the go-ahead; do not add a separate "send it?" question.

---

## Step 5 — Notify the project's TC-review channel [low freedom]

Every run sends the finished review to the TC-review notify channel **of the ticket's project** —
whoever invoked the skill, and whether or not they asked for a share. Each project has its own channel;
never post one project's review in another project's channel. The channel comes from that project's
config: the workspace project guide `references/{PROJECT}-guide.md` § *TC review notify* (channel
placeholder, thread rule, mention rule). The real ids and the webhook live in the local secrets folder
named there (one webhook file per thread, e.g. `discord_webhook_tc_review_<thread>`), never in the repo.

- **Project has a channel in config → NEVER ask which server, group, or channel** — the answer is already
  in config, so asking again is a repeat question (#0059). 🔴 **CHECKPOINT —** Ask exactly one question: which thread of that channel to post in (the only exception is the missing mention id, item 1, when config has none). Offer the threads already used for this ticket or
  recorded in the config as options. The answer is the go-ahead to send. Where the workspace carries
  `tools/ask-guard` (workspace-optional, see [dependencies.md](../../references/dependencies.md)), it
  blocks the channel question for such projects (state `fixed-destination`); without it, apply the same
  rule by hand.
- **Project has no channel in config →** search conversation history and memory for that project's
  destination first. Found → use it and record it in that project's config. Not found → ask once for that
  project's channel and thread, then record the answer so it is never asked again.
- **User declines the send, or will not name a thread →** do not send — nothing goes out without the
  thread answer and the item-5 preview. Tell the user plainly that the send is part of this workflow
  (every run notifies the project's channel — an owner decision) and that the review is therefore not
  complete. Record `notify not sent — user declined` in the QA closing checklist and in the final report,
  then stop. Never skip the step silently, and never report the run as done-and-notified.

Then, in this order (items 1–6 every send; items 7 and 8 only when correcting a sent message):

1. **Identity for a mention:** take the exact id (Discord user id, Jira account id, etc.) from the project
   config § *TC review notify* — never ask the user for it. Only when the config has none for the person to
   mention, ask for the exact id rather than guessing one from a display name — a wrong id either pings nobody or pings the wrong person. The same
   holds for a channel or thread id: never invent one; it comes from config or from the user's answer.
2. Use the wording conventions in the project guide § *TC review notify* (above), e.g. a fixed term for
   "ticket". None there → keep the wording of the review shown in chat; never invent new terms.
3. **Fit the platform's message limit before sending** (Discord: 2,000 characters). Count the characters.
   If too long, tighten the wording. Do not drop findings the user saw in chat, and do not split unless the user asks.
   Still over after tightening → 🔴 **STOP —** show the character count, ask: split into numbered posts, or which findings to cut. Send nothing before the answer.
4. A thread is reached through a webhook plus `thread_id`. Without `thread_id` the message lands in the
   parent channel. Use the webhook the user gave for that thread, and keep it in local secrets, never in
   the repo. **Webhook file for the chosen thread missing** from the secrets folder → ask the user for it
   once, save it to that secrets folder under the per-thread file name above, and never write it into the
   repo or repeat it in chat; then continue from item 5.
5. 🔴 **GATE — before the external send:** show in chat the destination (channel + thread), the final text
   exactly as it will be sent (after any item-3 tightening) and its character count. The thread answer
   counts as the go-ahead only once that preview is visible; if the text changed after the user saw the
   review, this preview is what they approve.
6. **Send, then read the response back** before telling the user it is done: confirm the destination
   (channel/thread id) matches what they asked for, and that a requested mention actually resolved.
   **Send returns non-2xx or times out** → do not retry blindly: report the status code and response
   body, keep the review in chat, and ask the user how to proceed (a 429 states the `retry_after` value
   it returned).
7. **Wrong destination → delete and resend** — a message cannot be moved between channels/threads by
   editing it. **Wrong content, correct destination → edit in place** — never delete and repost just to
   fix wording.
8. **Revising a review that is already posted** (new suggestions, a scope cut): edit the existing
   message in place, e.g. a Discord webhook `PATCH …/messages/{id}`, adding `thread_id` when the message is
   in a thread. The edited text must still fit the item 3 limit. Do not post a second copy. Read back the edited message and check the id, the destination,
   the mentions and the content.
   **Edit or delete returns non-2xx or times out** → do not retry blindly and do not post a second copy
   silently: report the status code and response body to the user and keep the review in chat. A `404`
   (message already deleted) → ask the user before posting a fresh copy; a `401`/`403` (webhook rotated
   or revoked) → ask for the current webhook for that thread (item 4), then retry the same edit.

**Go back:** If the item-6 read-back shows the wrong destination, delete and resend (item 7); wrong content or an unresolved mention → edit in place (item 7 second rule; method and its failure branch in item 8) and read back again. The send is not done before a clean read-back.

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
- [ ] If the user declined the send: `notify not sent — user declined` is written here and in the final report.

**Go back:** A matrix item unchecked returns to Step 2; an unanchored finding or a missing "→ Suggest:" line returns to Step 4; a design-source claim not opened returns to Step 1 item 3; an unverified send returns to Step 5 item 5.

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

- Deciding the product's pass/fail verdict — this workflow judges whether the *document* would prove
  that verdict, not whether the product itself is correct.

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Skill-specific:

| Rule |
|------|
| MUST read the ticket's own AC/EC/business-rules text this session before writing any finding |
| MUST anchor every finding to a TC/AC id or a quoted source |
| NEVER claim a design-source (Figma/PRD) match without having opened that source this session |
| MUST distinguish a spec-level gap (missing from the ticket's own AC list) from a TC-authoring defect |
| NEVER count or mention a struck-through AC/EC |
| NEVER report a business rule or comment that does not conflict with an AC/EC |
| MUST give every Need Improve item a sourced "→ Suggest:" fix, and NEVER invent a value for it |
| MUST run Step 5 exactly as written — it is the single source for the notify rules |
| MUST NOT post to Jira/Confluence/GitHub or send an external message before the user has seen the review in chat |

## Must-read files

Open each file below at the step that names it, never all up front.

- At start: [helix-session-constraints.md](../../references/helix-session-constraints.md) once per session; [long-workflow-todos.md](../../references/long-workflow-todos.md) when the run has many steps (keep the todo list).
- Before invoking or switching skills: [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md); choosing which skill handles a request: [skill-routing.md](../../references/skill-routing.md).
- At QA closing, before saying done: [qa-closing-shared.md](../../references/qa-closing-shared.md) and [qa-evidence-gates.md](../../references/qa-evidence-gates.md) (core) and [qa-evidence-coverage.md](../../references/qa-evidence-coverage.md) (to the matrix: only coverage layers 1, 2, 4, 6, 7 and pre-delivery 1, 4, 6, 7 apply — no test run, evidence or verdict here; no Out-of-scope block names a struck-through AC/EC or non-conflicting rule — Step 2 wins); at session end [session-closing.md](../../references/session-closing.md).

### Only if triggered (exact condition on each line)

This workflow never posts to Jira or records a verdict on its own. Load these only when the condition holds.

- Read [agent-rationalizations.md](../../references/agent-rationalizations.md) when tempted to skip a step; each excuse has its correct action.
- Read [figma-design-comparison.md](../../references/figma-design-comparison.md) before judging any UI or visual result against the design (Step 1 item 3).
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a test is flaky or a tool errors.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [round-time-contract.md](../../references/round-time-contract.md) when a round starts and before reporting times.
- Read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) when proposing a QA follow-up workflow.
- Read [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) only when the ticket's own spec looks contradictory or its expected side is unconfirmed (§ Skill composition).
- Read [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) only when the user asks for the review to be posted to a Jira ticket as well, before building that table.
- Read [jira-comment-post-review.md](../../references/jira-comment-post-review.md) only after such a user-requested Jira post, before saying done.

### Execution-only files (this workflow never triggers them)

This workflow reviews a document; it never runs tests, sets a bug priority, records a verdict or opens a bug (§ Out of scope). The shared files above link onward to execution-only references — [bug-priority-matrix.md](../../references/bug-priority-matrix.md), [customer-escape-prevention.md](../../references/customer-escape-prevention.md), [defect-report-completeness.md](../../references/defect-report-completeness.md), [playwright-preflight.md](../../references/playwright-preflight.md), [resilient-selectors.md](../../references/resilient-selectors.md), [test-through-real-steps.md](../../references/test-through-real-steps.md), [verify-closing-checklist.md](../../references/verify-closing-checklist.md) — which a TC review must not load.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Atlassian MCP
- Figma (only when a design cross-check is asked)
- clone of the product repo (`{MONOREPO}`) for the source sweep
- `tools/result-gate` is not run here: it checks result lines (`results.jsonl`), and this workflow
  writes none — Step 3b applies layer 14 of result-quality-gate.md by hand
- the ticket project's TC-review notify channel + its webhook (project config / local secrets)
- `superpowers:systematic-debugging`
