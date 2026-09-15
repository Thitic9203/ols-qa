---
name: tc-review-workflow
description: |
  Review a test case document that already exists — written by anyone, in any sheet/CSV/markdown format — against the acceptance criteria (AC), edge cases (EC) and business rules on its governing ticket. Build a traceability matrix, judge coverage and row quality, and report findings as Good vs Need Improve, each anchored to a quoted source. Optionally share the finished review to a notify channel on explicit request.
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

Judge a test case document that someone has **already written** — this workflow never designs or edits
test cases itself. It answers one question: *does this document, as written, prove the ticket's AC/EC and
business rules will be checked?*

Claude Code shortcut: `/tc-review` → [commands/tc-review.md](../../commands/tc-review.md).

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

## Step 1 — Load both sources verbatim

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

## Step 2 — Build the traceability matrix

For every AC and EC on the ticket, list which TC row(s) claim to cover it:

| AC/EC | Claimed by | Status |
|-------|-----------|--------|
| `AC_01` | `TC_003` | covered |
| `AC_05` | — | **no TC — gap** |

Also trace the ticket's **business-rules / recheck-list** sub-items when the ticket enumerates them —
these are often more granular than the AC list itself (e.g. one AC covering six named states, or a
recheck list naming loading/empty/filter states that the AC text only summarizes). A sub-item with no AC
**and** no TC is a spec-level gap, not a TC-authoring defect — name it as such rather than blaming the
document for a hole the ticket itself never asked it to fill.

Flag, with the row/AC ids named:

- an AC/EC with zero TCs;
- a TC whose Expected Result verifiably matches a *different* AC than the one it is tagged with;
- the same theme (e.g. a shared UI element) tagged inconsistently across sibling rows — some carry an AC,
  some carry none, with no stated reason.

---

## Step 3 — Row-quality check

Apply [tc-quality-standards.md](../../references/tc-quality-standards.md) to every row, reading for
these review-specific failure shapes (distinct from authoring quality — this is about a document written
by someone else, so the question is whether it can be trusted, not whether it is elegant):

| Signal | Why it matters |
|--------|-----------------|
| **Steps do not reach the state the title claims.** A row titled "Learner views X" whose steps stop at the main page never actually opens X. | The case cannot verify what it says it verifies. |
| **Expected Result is the AC's own sentence, copied verbatim, with no decomposition.** When the ticket lists several concrete sub-items (fields, states, button variants) under that AC, an Expected Result that just repeats the AC sentence gives the tester nothing to check row by row. | Pass/fail becomes a guess. |
| **The AC (or its business rule) enumerates named cases/states** (e.g. "case 1–6", "loading / empty / filter" states) **and the document has one generic row for all of them.** | Most of the enumerated states go untested even though the row is marked done. |
| **Test Data has no concrete value where the AC needs one** (a boundary count, a specific date relationship, a named filter option). | The row cannot be executed as written — the tester would have to invent the missing value. |

Do not flag test-case style choices that do not affect whether the case can be trusted (naming
convention, column order, priority labels) unless the user asks for a style review specifically.

---

## Step 4 — Report Good vs Need Improve

Two short lists, each bullet anchored to a row id, AC id, or quoted text — never an unanchored opinion.

```text
**Good**
- {finding, with TC/AC id or quote}

**Need Improve**
- {finding, with TC/AC id or quote}
```

Keep it as short as the findings allow — this is a review of someone else's work, not a rewrite; do not
propose replacement wording unless asked. If the user asks to narrow scope (e.g. "drop everything about
X"), regenerate the list from Steps 2–3 with that category removed — do not hand-edit prose reactively,
since the same category will resurface differently worded next time otherwise.

**Language:** match the ticket's / TC document's own language by default (ask once if genuinely mixed).
Helix menus and intake questions stay English per
[user-communication.md](../../references/user-communication.md); the review content itself follows the
destination document's language, the same exception that document already carries.

Post the review in chat and get the user's go-ahead before any external send (Step 5) — an external
message cannot be unsent the way a chat message can.

---

## Step 5 — Optional: share the review externally

Only on explicit request, and only to a destination and identity the user names — never invent a
channel, thread, or mention id.

1. **Identity for a mention:** ask for the exact id (Discord user id, Jira account id, etc.) rather than
   guessing one from a display name — a wrong id either pings nobody or pings the wrong person.
2. **Send, then read the response back** before telling the user it is done: confirm the destination
   (channel/thread id) matches what they asked for, and that a requested mention actually resolved.
3. **Wrong destination → delete and resend** — a message cannot be moved between channels/threads by
   editing it. **Wrong content, correct destination → edit in place** — never delete and repost just to
   fix wording.
4. Use the wording conventions already established for that surface in this workspace (e.g. a fixed term
   for "ticket" in the destination's language) — check the workspace's own rules before sending; do not
   invent new wording.

---

## QA closing (mandatory before "done")

- [ ] Every AC and EC on the ticket appears in the traceability matrix, covered or flagged as a gap.
- [ ] Every business-rules / recheck-list sub-item the ticket names was traced, not just the AC list.
- [ ] Every finding names a TC/AC id or quotes source text — none are a general impression.
- [ ] Any design-source (Figma/PRD) claim states plainly whether it was actually opened this session.
- [ ] If sent externally: destination and mentions verified from the read-back response, not assumed.

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
| NEVER invent a channel, thread, or mention id for an external send | A wrong id either reaches nobody or reaches the wrong person |
| MUST read back an external send's response and confirm destination + mentions before saying it is done | "Sent" without a read-back is an unverified claim |
| MUST fix a wrong-destination send by delete-and-resend, and a wrong-content send by edit-in-place | A channel/thread cannot be changed by editing; deleting a correctly-placed message to fix wording destroys its position in the thread for no reason |
| MUST NOT post to Jira/Confluence/GitHub or send an external message before the user has seen the review in chat | The review is the deliverable to approve first — an external send is not the review itself |
