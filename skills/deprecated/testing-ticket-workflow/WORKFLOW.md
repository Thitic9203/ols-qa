---
name: testing-ticket-workflow
description: |
  Test one Jira ticket with Playwright after intake and confirmation — summarize results in chat, then optionally update an external results destination.
  Use for Testing ticket from Helix, /testing-ticket, or when the user wants automated UI/API checks for a single ticket.
  Do NOT use for opening bug tickets (create-bug-workflow), retest-after-fix on a bug (retest-bug-workflow), or drafting manual TC tables (tc-fe-prep / tc-api-prep). Does not run full-app regression.
---

# Testing ticket workflow

Run **Playwright-based** testing for a **single ticket** after intake and confirmation. **Self-contained in Helix** — do not invoke `full-test-plugin`.

**This workflow does not open bug reports.** If the user wants bugs filed → route to **`create-bug-workflow`** (`/helix` → Create bug).

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Gates:** MUST NOT start Playwright until Phase C confirm; MUST NOT update external results until Phase G confirm — because runs and writes are costly to undo. Credentials are session-only.

**Every FAILED or BLOCKED scenario** is governed by [defect-report-completeness.md](../../../references/defect-report-completeness.md) — the write-up must answer the reader's five questions (what, **which entry points**, what it should be instead, why that is a fail, **what changes and who decides**) before it leaves this workflow. A question asked afterwards means a section was missing; the fix is the write-up, not a chat reply.

**Long sessions:** optional todos per [long-workflow-todos.md](../../../references/long-workflow-todos.md).

## Refusal-first (precondition gate)

MUST refuse to reach Phase B until **Ticket** and **URL** are provided — because the test plan has no target.

**Pre-flight login smoke gate (mandatory before Phase B).** Before running any scenario, verify that login **actually succeeds** for **every role/credential set** the run may use — not only the one role the first case needs. Drive the real login (headless where supported) per role and confirm an authenticated signal (redirect to an authed area, a session/`me` endpoint, or a logged-in UI marker). Produce a per-role pass/fail table.
- **All roles pass →** proceed to Phase B.
- **Any role fails →** 🛑 stop, report which role failed and why (backend error, VPN, bad creds), and do **not** start testing until it is cleared or the user explicitly says to skip the failing role. Never mark scenarios PASSED when auth was never verified.

This catches an auth-backend outage (e.g. an IdP returning a 4xx on every login) up front, before opening cases that would all block later. Project-specific role list, accounts, and login steps live in the project's `references/*-guide.md` / login runbook.

If **VPN** is required per user and environment is unreachable in Phase D, stop and report — do not mark scenarios PASSED without evidence.

---

## Core constraints

Recite once at the start of Phase A (first response only) from [helix-session-constraints.md](../../../references/helix-session-constraints.md) — **All Helix workflows** block, then the **Testing ticket** block.

Then follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Testing ticket** and show [intake-one-pager.md](../../../references/intake-one-pager.md) (Testing ticket section).

---

## Phase A — Session intake (mandatory)

Collect these **seven** items (one grouped message when possible; skip fields already on the one-pager as done):

| Field | Required | What to collect |
|-------|----------|-----------------|
| **Ticket** | Yes | Jira key or browse URL |
| **URL** | Yes | Application under test |
| **User** | Yes* | Login (*`guest` if no login) |
| **Password** | Yes* | (*`—` if no login) |
| **VPN** | Yes | `Required` / `Not required` + note |
| **Confluence** | No | Page URL or `none` |
| **Swagger** | No | OpenAPI URL or `none` |

**Wait** until required fields are answered before Phase B.

---

## Phase B — Load context

Use [parallel-prep.md](../../../references/parallel-prep.md) when Jira fetch and Confluence/Swagger are independent.

1. Fetch **Ticket** (Jira or user paste).
2. **Confluence** / **Swagger** if provided.
3. Build numbered **test plan** (in-scope, out-of-scope, API vs UI).
4. Fill [test-execution-plan-template.md](../../../references/test-execution-plan-template.md) in chat (environment, auth, in-scope table, pass criteria, risks).

**Design reference (Figma) — view when a ticket links one:** for expected-UI context, prefer the **Figma Dev Mode MCP** (`get_screenshot` / `get_metadata` / `get_design_context`) — needs the Figma desktop app with **Dev Mode MCP Server enabled** (Figma menu → Preferences) and the file open; `node-id` in a Figma URL uses `-`, the MCP `nodeId` uses `:` (`?node-id=1234-5678` → `1234:5678`). If that server is off, **fall back to the browser-automation MCP**: open the file URL (a logged-in browser session persists auth), let the canvas render, then screenshot the node. Dismiss the **"Want to view this file in Dev Mode?"** modal with **"Not now"** — NEVER "Request access" (it sends a seat request). A View+Comment account is enough to read and screenshot the design.

---

## Phase C — Confirm before Playwright (hard gate)

```text
━━━ Testing ticket — confirm before run ━━━
Ticket:      {KEY} — {one-line summary}
URL:         {url}
Login:       {user} / password provided (not shown)
VPN:         {required|not required} — {note}
Confluence:  {url or none}
Swagger:     {url or none}

Test plan ({N} scenarios):
  1. ...
Out of scope: ...

Execution plan: see filled template (preflight, evidence, pass criteria).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to start Playwright, or tell me what to change.
```

**Do not start Phase D until confirmed.**

If results contradict expectations or tests are flaky, follow [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) before changing pass/fail wording.

---

## Phase D — Pre-flight (mandatory)

Follow [playwright-preflight.md](../../../references/playwright-preflight.md) end-to-end. MUST NOT start Phase E until **Ready to run: YES**.

---

## Phase E — Execute tests (Playwright)

Run confirmed scenarios; record **PASSED** / **FAILED** / **BLOCKED** / **NOT TESTED** with evidence (screenshots, console, network).

Internal failures: note for chat summary only — **do not create Jira/GitHub issues in this workflow.**

### E1 — For every FAILED scenario, capture the repro shape *during the run*

These three cannot be reconstructed while writing Phase F — do them before moving to the next scenario
([defect-report-completeness.md](../../../references/defect-report-completeness.md) §2–§3):

1. **Every entry point, one at a time.** Reach the failing surface by the direct route **and** by the
   in-app path a real user takes (list card, menu, CTA, deep link). One screenshot per path, one
   **repro-matrix row** per path. A path you did not exercise is recorded `not tested` — never inferred
   from another path, never silently dropped.
2. **Settle after every state change.** After a fixture step that changes server state (publish /
   unpublish / approve / delete / role change), hard-reload each surface before observing it. An
   already-open view holds pre-change data; recording it reports your test timing as the product's
   behavior. A stale window worth reporting is a **separate timing note** with the measured delay.
3. **Resolve contradictions before writing anything down.** If two of your observations of the same
   surface disagree, name it, re-run that surface cleanly, record which was the artifact and why. Never
   resolve it in favour of the result you already wrote. Unresolvable after a clean re-run → **BLOCKED**,
   not FAILED.

---

## Phase F — Summarize in this chat (mandatory)

Always post a clear summary **in the same conversation** before anything else:

### F1 — Executive summary

2–4 sentences: overall result, pass/fail counts, blockers.

### F2 — Results table

```text
| # | Scenario | Result | Notes / evidence |
|---|----------|--------|------------------|
| 1 | ...      | PASSED | —                |
| 2 | ...      | FAILED | screenshot-02.png |
```

### F3 — Defects observed (if any)

List issues found **without filing tickets**:

```text
| # | Title | Severity | Confidence | Evidence |
|---|-------|----------|------------|----------|
| 1 | ...   | High     | Confirmed  | ...      |
```

**Each defect row expands into a complete write-up** — this is what gets pasted into a bug, a Jira
comment, or a sheet cell later, so it must stand alone
([defect-report-completeness.md](../../../references/defect-report-completeness.md) §1–§4):

| Block | Content | Answers |
|-------|---------|---------|
| **Repro matrix** | one row per entry point exercised: entry point · steps · observed · reproduces? · evidence file; untried paths `not tested` | "does this only happen from a direct URL?" |
| **Expected vs Actual** | the failing acceptance/expected line **quoted verbatim**, then *should be* vs *is now* as implementable facts (which elements render, which are disabled, which route) | "what should it look like, and which line did I break?" |
| **Resolution options** | when the behavior deviates from the written expectation but the feature otherwise works: the two mutually exclusive outcomes with a named owner each — spec owner updates the expectation (no code change) **or** dev changes `{exact route/surface}` and leaves `{what already passes}` alone | "do I change code or does the spec change, and who decides?" |

**Never rewrite the ticket's acceptance/expected text to match observed behavior.** Report the conflict and
name the decision-maker.

### F4 — Reader gate (MUST pass before Phase G)

Read F2 + F3 as the developer who will act on them. Run the six-question gate in
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §5. Any "no" → fix the
write-up. Also confirm: every scope word (`always`, `any entry point`, `only when …`) traces to a
repro-matrix row, and no observation is under an unresolved contradiction.

If the user wants these logged as bugs:

> Say **Create bug** from `/helix`, or ask me to switch to the **create-bug-workflow**.

**Do not proceed to Phase G until F1–F4 are posted.**

---

## Phase G — Optional: update results elsewhere

### G1 — Ask (single question)

> **Do you want me to update the test results somewhere else** (Jira comment, Google Sheet, Confluence table, CSV file, etc.)?

- **No** / **skip** / **done** → Reply: *Testing ticket session complete.* **Stop here.**
- **Yes** → Go to G2.

### G2 — Collect destination details

Ask the user to provide:

1. **Link** — full URL to the destination (Jira issue, Sheet, Confluence page, file path in repo if applicable).
2. **Columns** — which columns or fields to update (names or letters, e.g. `Result`, `Tester`, `Date`, `Notes`).
3. **Formats** — per-column rules if specific (e.g. `Result` = `PASSED`/`FAILED` only; `Date` = `YYYY-MM-DD`; language; no bare ticket keys in Jira wiki).

If anything is unclear, ask follow-ups **before** accessing the destination.

### G3 — Confirm update plan (hard gate)

```text
━━━ Confirm result update ━━━
Destination: {link}
Columns:
  - {Column A}: {format rule}
  - {Column B}: {format rule}
Rows to update: {count} — mapped from scenarios 1..N
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to apply updates, or correct the mapping.
```

**Wait for explicit confirm.**

### G4 — Access and read first

- Open or fetch the destination (browser, API, MCP, or file read).
- **Match existing layout** — headers, row order, language, status vocabulary already in use.
- For Google Sheets: read headers and sample rows before writing. **Detect the result columns from the header row — never assume fixed column letters**, and confirm the tab name and tab id refer to the same tab.
- For Jira comments: draft in chat; use v2 wiki vs v3 ADF per project guide if present. **The chat draft's markdown is not the posted body** — on the v2 path rewrite it as wiki markup and run both gates in [jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md); markdown posts with HTTP 200 and renders wrong.
- If access fails (auth, 403, VPN) → report exactly what failed; **do not claim success.**

**Claim the scope (layer 1 — hard gate).** Snapshot the destination, then classify every target
row: untested (empty / `NOT STARTED`, no result text, no links) or written by an earlier run of
yours = **yours to write**; anything a person filled in = **not yours**. Drop the not-yours rows
here and list them for the user. Same for a shared evidence folder: note which files already
exist and were not uploaded by you. See [result-update-discipline.md](references/result-update-discipline.md).

### G5 — Apply updates

- Write **every** planned row/cell/comment field **that this run owns** — and nothing else.
- Map each test scenario to the correct row (by TC id, row number, or user mapping), and **anchor
  on the row's own identifier**: if the id in that row is not the case you are recording, skip it.
- **Re-read each row immediately before writing** (layer 2) — if it changed since G4, someone is
  editing it; skip that row rather than overwrite.
- Never overwrite, rename, delete, reorder, or reformat anything a person put there — and never
  reuse an existing file's link as this run's evidence. Refusing is a correct outcome: record
  "not written — owned by someone else" and carry on.
- **Do not damage what you do write:** never put a literal over a cell holding a formula; send
  text so the sheet cannot re-read it as a formula/date/number (`=`, `+`, `-`, `@`, `1/2`,
  `2026-07-23`, `007`); and make every row exactly as wide as the range so nothing shifts into
  the wrong column.
- Include evidence references where the format allows (screenshot names, bug keys as `{{KEY}}` in Jira wiki).
- **A FAILED/BLOCKED row carries its F3 write-up, not just the word "FAILED".** Whatever the destination
  allows (actual-result cell, Jira comment, remark column) must state which entry points reproduce it,
  the expected line verbatim vs what actually happens, and — when the deviation is from the written
  expectation rather than a broken feature — who decides between updating the expectation and changing
  the code. A bare status forces the next reader back to you.

### G6 — Review before “complete” (mandatory)

Before telling the user updates are done:

1. **Re-open or re-fetch** the destination.
2. **Checklist:**
   - [ ] Every scenario from Phase F2 has a corresponding update (or documented skip reason).
   - [ ] Column values match agreed formats.
   - [ ] No partial rows, empty required cells, or wrong ticket/sheet tab.
   - [ ] Jira/Confluence: comment or table visible as intended (not draft-only unless user asked draft).
   - [ ] **No literal `<br>`, HTML tags, or stray markup** visible as text in any cell.
   - [ ] **Numbered items** each on a separate line — not running together on one line.
   - [ ] **Nothing outside this run's own cells/files changed** (layer 3): diff the destination
         against the G4 snapshot. Anything else changed → restore it from the snapshot, stop, and
         tell the user. Existing files in a shared folder still present and unmodified.
   - [ ] Every **refused / skipped** row is listed in the report with the reason.
   - [ ] **Nothing was damaged**: written cells read back exactly what was sent, every formula
         that was there is still a formula, no new `#REF!/#NAME?/#VALUE!/#N/A` anywhere, and the
         header row is unchanged.
3. If any mismatch → fix and re-check. **Maximum 3 fix rounds** — then report specific failures with best available workaround (see [jira-comment-post-review.md](../../../references/jira-comment-post-review.md)).

### G7 — Close

Only after G6 passes:

```text
━━━ Result update complete ━━━
Updated: {link}
Rows/fields written: {summary}
Verified: {what you re-read}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If verification failed partially, state what succeeded and what did not — NEVER say “complete” for unverified work — because partial writes look finished to stakeholders.

---

## Phase H — A question arrives after results were published

A follow-up question is a **defect in the write-up**, not a normal step
([defect-report-completeness.md](../../../references/defect-report-completeness.md) §6).

1. **Re-verify before answering.** If the answer is not already backed by a labelled evidence file from
   this run, re-run that surface. Never answer from memory of an earlier run, and never answer from the
   write-up being questioned.
2. **Check your own evidence set for a contradiction first** — if two captures disagree, that is the real
   subject of the question; resolve it per E1·3 before replying.
3. **Answer in the shape asked** (§7): direct answer first, at most one line of why. If the user says it
   is too long, shorten the same answer — never re-emit it at the same length.
4. **Fold the answer back into the published result** (edit in place — same comment id, same row) and
   re-run the Phase G6 verification, so the next reader never needs the chat thread.
5. **If an earlier statement was wrong**, correct it **visibly in both places**: the in-place edit names
   the corrected claim, **and** a follow-up goes into the thread where the wrong answer was given.
6. Record which F3 block would have prevented the question.

---

## QA closing (mandatory before session end)

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] F1–F4 posted before any external update.
- [ ] Every scenario has PASSED/FAILED/BLOCKED/NOT TESTED with evidence reference.
- [ ] Every FAILED/BLOCKED defect has its repro matrix (one row per entry point, untried paths `not tested`), expected-line-verbatim vs actual, and — where the deviation is from the written expectation — resolution options with a named owner.
- [ ] **F4 reader gate passed before Phase G**; every scope word traces to a matrix row; no unresolved contradiction between your own observations.
- [ ] If Phase G ran: destination re-read matches agreed column formats.
- [ ] Close-out includes `Verified:` (or partial-failure honesty per Phase F).
- [ ] Phase G6 fix-verify completed when Phase G ran.
- [ ] **Fresh-eyes:** re-read F2 before Phase G when **> 15 scenarios**.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (Testing ticket section).
- [ ] Suggest **create-bug** if F3 has defects; handoff if long run.

---

## Out of scope

- Filing bugs, retest, TC prep, full-app regression — see [skill-routing.md](../../../references/skill-routing.md)

---

## Next workflows

See [skill-routing.md](../../../references/skill-routing.md) — **Handoffs** after this workflow.

---

## References

| File | Use |
|------|-----|
| [session-intake.md](references/session-intake.md) | Intake fields |
| [playwright-discipline.md](references/playwright-discipline.md) | Playwright rules |
| [result-update-discipline.md](references/result-update-discipline.md) | Sheets, Jira, Confluence update rules |
| [workspace-guide-template.md](references/workspace-guide-template.md) | Optional non-secret defaults |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT open Jira/GitHub bugs in this workflow | Use create-bug-workflow |
| MUST NOT run Playwright before Phase C confirm | Wrong scope/credentials |
| MUST re-read destination after Phase G writes | Silent partial failure |
| MUST exercise every entry point to a failing surface separately (direct route **and** the in-app path a user takes), one repro-matrix row + screenshot each; untried paths written `not tested` | A path with no evidence row is a guess published as a finding (learned OLS-108) |
| MUST NOT write a scope word (`always`, `any entry point`, `both ways`, `only when …`) that no repro-matrix row supports | The scope claim is the first thing a dev builds on |
| MUST hard-reload every surface after a state-changing fixture step before observing it; a stale-data window is a separate timing note with a measured delay, never a repro row | An already-open view holds pre-change data — recording it publishes your test timing as product behavior |
| MUST resolve any disagreement between your own observations with one clean re-run before writing F2/F3; unresolvable → BLOCKED, not FAILED | Resolving it in favour of the result you already wrote is how a wrong repro path ships |
| MUST give every FAILED/BLOCKED defect the F3 blocks — repro matrix, expected line quoted verbatim vs actual, resolution options with a named owner | These are the questions the reader asks next; answering them in chat leaves the record incomplete |
| MUST NOT rewrite a ticket's acceptance/expected text to match observed behavior | The spec owner decides; QA reports the conflict and names them |
| MUST pass the F4 reader gate before Phase G | The gate exists so answers land in the write-up, not in a round-trip that ends in an edited record |
| MUST re-verify before answering any question that arrives after publishing, then fold the answer into the published record in place (Phase H) | Answering from memory publishes wrong claims |
