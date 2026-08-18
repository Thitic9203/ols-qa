# Figma comparison gate — every UI test is judged against the design, or it is not judged

Applies to **every** UI/visual verification in
[testing-ticket-workflow](../skills/deprecated/testing-ticket-workflow/WORKFLOW.md) and
[retest-bug-workflow](../skills/deprecated/retest-bug-workflow/WORKFLOW.md) — a story run, a bug
retest, a task retest, a regression case, any per-case verdict written to a comment, sheet, or notify.

```
A UI CASE IS NOT VERIFIED — AND NEVER PASSED — UNTIL ITS SCREEN HAS BEEN
COMPARED, SIDE BY SIDE, AGAINST THE DESIGN SOURCE OF RECORD.
NO DESIGN REFERENCE ⇒ ASK THE PERSON WHO ASSIGNED THE RUN. NEVER INVENT THE EXPECTED.
```

**Why this is a hard gate, not advice.** A customer-found-bug review of 25 escaped defects showed the
same shape repeatedly: cases whose expected result only asked *"the page shows A, B and C"*, so a
screen with everything present but mis-ordered, overlapping, or carrying a stale label passed. In the
frozen test set the word `figma` appeared **zero** times. Separately, a screen that had legitimately
moved (a menu relocated into a submenu) was reported as a defect because the design was never updated
in the same ticket — a full round wasted on a bug that did not exist.

---

## 1. What counts as the design source of record

In order of authority. Take the **first** one that exists and covers the screen under test:

| # | Source | Notes |
|---|--------|-------|
| 1 | **Figma node** the ticket links (or the project guide names) | The default. Pin the node, not just the file. |
| 2 | Design spec / PRD / Confluence page that states the layout, order, wording | Only when there is no Figma frame for that screen. |
| 3 | The ticket's own Expected Result / AC, when it states the visual contract in words | Weakest — it usually says "shows X", which is what this gate exists to catch. |

An **assumption**, a sibling screen, a previous build, a screenshot in a chat thread, or a
transliteration of an English feature name is **never** the design source of record.

---

## 2. Opening the design (both paths, in order)

1. **Figma Dev Mode MCP** — `get_screenshot` / `get_metadata` / `get_design_context`. Needs the Figma
   desktop app running with **Dev Mode MCP Server enabled** (Figma menu → Preferences) and the file
   open. `node-id` in a Figma URL uses `-`; the MCP `nodeId` uses `:` (`?node-id=1234-5678` →
   `1234:5678`).
2. **Browser-automation MCP fallback** — open the file URL (a logged-in browser session persists
   auth), let the canvas render, screenshot the node. Dismiss the **"Want to view this file in Dev
   Mode?"** modal with **"Not now"** — NEVER "Request access" (that sends a seat request). A
   View + Comment account is enough to read and screenshot.

Record in the run: the **node link actually opened** and how it was opened. "Compared against Figma"
with no node link is not evidence that a comparison happened.

---

## 3. What to compare — five points, every UI case

Comparing means putting the captured screen next to the design node and checking these, not glancing
at it:

| # | Point | Fails when |
|---|-------|-----------|
| 1 | **Elements present** — every element the node shows exists on screen | something in the design is missing on screen |
| 2 | **Text char-exact** — label, heading, button, empty-state, error, unit, placeholder | one character differs (never "just wording") |
| 3 | **Order and position** — reading order, grouping, which side of the row/card each element sits on | the elements are all there but in a different arrangement |
| 4 | **State coverage** — the states the node defines: default · hover/focus · selected · disabled · empty · loading · error · over-limit (e.g. more items than the design's visible slots) | only the happy state was looked at |
| 5 | **No overflow / no overlap** at the agreed widths | an element's box crosses the viewport edge or another text box (measure it — §4 of [customer-escape-prevention.md](customer-escape-prevention.md)) |

A difference found here is **not automatically a defect** — it goes through the non-pass challenge
gate ([non-pass-challenge-gate.md](non-pass-challenge-gate.md)) first, because the design may itself
be stale (§5).

---

## 4. No design reference → report back to the person who assigned the run

**This is the whole point of the gate.** When the screen under test has **no** Figma node (or the
linked node does not cover it, or the file is inaccessible), you do **not** proceed on an assumed
expected — the escaped-defect review found seven bugs whose requirement existed in no document at
all, and one bug filed against a button that was never in any spec.

Do this, in order:

1. **Say it in the run's own channel, to the person who assigned it** — the chat when a person is
   driving, the thread/channel that triggered the run when it is unattended. State:
   `Ticket {KEY} · screen {name} · no design reference found (searched: ticket links, parent story,
   project guide, design file) · I cannot judge layout/wording/order without it.`
2. **Ask for exactly one of three things:** the Figma node link · a written visual contract (PO/spec
   owner) · or an explicit "this screen has no design — verify function only, skip visual".
3. **Meanwhile, do not stall the rest of the run.** Everything that does not depend on the design
   (function, data correctness, permissions, API behaviour) continues normally and is reported.
4. **The visual points stay `BLOCKED` with the reason**, never PASSED and never FAILED — an
   unverifiable expected is a question, not a defect (PM-006). The BLOCKED remark names who was asked
   and what was asked for.
5. **Unattended / bot mode:** the same message goes to the triggering channel with the @mention the
   project guide names; the visual points are recorded BLOCKED + remark. Never halt the whole run,
   never guess, never quietly downgrade to "function only" without saying so.

---

## 5. When app and design disagree — three outcomes, never "just file it"

| What you find | Outcome |
|---|---|
| App differs from a **current** node, and the ticket did not change that screen | Candidate defect → non-pass challenge gate → record with the node link as the expected's source |
| App differs because **this ticket deliberately changed the screen** and the design was not updated | **Spec drift, not a defect.** Report it as "design out of date — node {link} still shows the old {menu/label/layout}", name the design owner, and ask for the node to be updated **in this ticket**. Filing a bug here wastes a full round (proved: a relocated menu was reported as missing when it existed in a submenu). |
| App differs and the **AC was revised during testing** to match what was built | **Accepted limitation** — see §6 |

---

## 6. Accepted limitation — an AC changed to match the build must be recorded, not absorbed

When an acceptance criterion is edited **after** the ticket reached QA so that it matches what the
build does (a dev-stated constraint, a PO saying "pass it as tested"), the verdict may legitimately be
PASSED — but a silent PASSED is how the highest-severity escaped defect in the review reached the
customer.

The verdict line must therefore say so, in the comment itself:

> `PASSED against AC {id} as revised {YYYY-MM-DD}, which differs from the design node {link} in: {the exact difference}. Recorded as an accepted limitation; decision owner: {role}.`

And the difference goes to whoever maintains the known-limitation list that ships with the release.
QA never edits the AC to match the app — QA reports the conflict and names the owner.

---

## 7. Evidence

- The design comparison leaves an artifact: the **node link** plus the captured screen for that case
  (the case's own screenshot/MP4 already required by [qa-evidence-gates.md](qa-evidence-gates.md)).
- Where the destination has a reference/remark field, the node link goes in it — so the next reader
  can re-run the same comparison without asking which design was used.

---

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST compare every UI case against the design source of record and record the **node link actually opened** | "Compared against Figma" with no node is an unverifiable claim |
| MUST check all five points (present · char-exact text · order/position · states · no overflow/overlap) — not "elements are there" | An all-present, mis-arranged screen passed a whole regression round and the customer opened five bugs on it |
| MUST report back to the person/channel that assigned the run when a screen has no design reference, and mark its visual points **BLOCKED**, never PASSED | An expected you assumed is not a spec; seven escaped bugs had no requirement anywhere (PM-006) |
| MUST NOT invent, infer, or transliterate an expected label/layout when the design is missing | That is exactly how a phantom bug and a false pass are both produced |
| MUST report a screen the ticket intentionally changed as **design out of date** (name the design owner, ask for the node update in the same ticket) — not as a defect | A relocated menu was filed as missing; it existed in a submenu |
| MUST write "PASSED against AC as revised {date}, differs from design in {…}" whenever an AC was changed during testing to match the build, and hand the difference to the known-limitation list | A silent PASSED on a revised AC shipped the review's one High-severity escape |
| MUST NOT edit the ticket's AC/expected text to match the app | The spec owner decides; QA reports the conflict |
