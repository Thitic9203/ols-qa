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

**Settle and strategize FIRST** — before intake or any tool call, follow
[settle-and-strategize.md](../../../references/settle-and-strategize.md): invoke
**`engineering:testing-strategy`** to plan the approach, then hold to the discipline it names —
no guessing an expected/spec, and no blind retry loops (a repeat failure = stop and diagnose).

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Gates:** MUST NOT start Playwright until Phase C confirm; MUST NOT update external results until Phase G confirm — because runs and writes are costly to undo. Credentials are session-only.

**Test through the real steps.** Drive every scenario through its own surface, following the case's
steps completely — a UI scenario through the UI (Playwright clicks, not a direct submit call); the API
is only for creating test data / preconditions, never to perform the action under test. An API
scenario is driven at the API — that is its real step. Full rule:
[test-through-real-steps.md](../../../references/test-through-real-steps.md).

**Every FAILED or BLOCKED scenario** is governed by [defect-report-completeness.md](../../../references/defect-report-completeness.md) — the write-up must answer the reader's five questions (what, **which entry points**, what it should be instead, why that is a fail, **what changes and who decides**) before it leaves this workflow. A question asked afterwards means a section was missing; the fix is the write-up, not a chat reply.

**Root cause is mandatory, never inferred.** Every FAILED or BLOCKED scenario gets a full
investigation per [root-cause-investigation.md](../../../references/root-cause-investigation.md) —
run at **E2**, during the run, before Phase F exists. That reference also governs every sentence in
this workflow that states or implies a cause, wherever it ends up (chat, Jira comment, sheet cell,
notify). Start it by invoking a real debugging skill — **`superpowers:systematic-debugging`** first,
its Phases 1–3 only (QA diagnoses; QA does not patch product code). No cause without a captured
artifact and a `Confirmed` / `Suspected` / `Unknown — not investigated` label.

**Challenge every non-PASS before you record it (the "wait, really?" gate).** A scenario that is not a
clean PASSED is a **hypothesis, not a verdict**. Before it becomes FAILED / PWMI / BLOCKED — or gets
carried into Phase F as a defect — re-verify the **expected** side against an authoritative source,
**including the AC/EC of related / linked tickets** (parent story, linked issues, sibling tickets on
the same surface, the test case's own source), read character-exact. A stale or superseded expected,
a transliteration mistaken for a label, or an unconfirmed-spec hedge makes a phantom defect out of a
correct app. Run this at **E3**, then **surface it to the user in chat** so they can decide whether to
adjust the test case, re-test, or confirm the defect. Full gate:
[non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md).

**Test every AC/EC — completeness is a hard gate, not a best-effort.** The scope of what must be
tested is the ticket's own contract: **every** Acceptance Criteria, **every** Expected Condition /
Expected Result line. The run is not done until each of those items is tested AND appears as its **own
row** in the results table with its own verdict + evidence. It is **never** acceptable to mark a case
PASSED on partial coverage and mention the untested/failing item in a remark, a note under the table,
or in chat — a point worth noticing is worth a **row**. Enforced by the **7-layer AC/EC & bug-detail
coverage completeness gate** in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md):
layers 1–2 (enumerate the AC/EC list char-exact, map each id 1:1 to a plan row) run in **Phase B**;
layers 3–5 (execute each on its real surface, row-never-a-remark, partial coverage ≠ PASS) run in
**Phase E**; layers 6–7 (reconcile `enumerated ids == rowed-and-verdicted rows`, fail-closed) run in
**Phase F** before Phase G. Fail-closed: any AC/EC id missing a row, unrun, verdict-less, or living
only in a remark ⇒ the run is **not complete**.

**Long sessions:** optional todos per [long-workflow-todos.md](../../../references/long-workflow-todos.md).

## Refusal-first (precondition gate)

MUST refuse to reach Phase B until **Ticket** and **URL** are provided — because the test plan has no target.

**Pre-flight login smoke gate (mandatory before Phase B).** Before running any scenario, verify that login **actually succeeds** for **only the role(s)/credential set(s) this run's scenarios will actually use** — not every role the project has. Read the run's scenarios to determine which roles are in scope; a single-role run logs in that one role, a multi-role run logs in each role it uses, nothing more. Drive the real login (headless where supported) per in-scope role and confirm an authenticated signal (redirect to an authed area, a session/`me` endpoint, or a logged-in UI marker). Produce a pass/fail table for the in-scope roles.
- **All in-scope roles pass →** proceed to Phase B.
- **Any in-scope role fails →** 🛑 stop, report which role failed and why (backend error, VPN, bad creds), and do **not** start testing until it is cleared or the user explicitly says to skip the failing role. Never mark scenarios PASSED when auth was never verified.

This catches an auth-backend outage (e.g. an IdP returning a 4xx on every login) up front, before opening cases that would all block later — scoped to the roles the run needs, so an unrelated role's outage never blocks a run that doesn't use it. Project-specific role list, accounts, and login steps live in the project's `references/*-guide.md` / login runbook.

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

**Environment + account are a hard intake item — always settle them, never assume.** Confirm both *which environment* and *which account/role* this run uses before any login or Playwright. If the user has **not** stated them yet, ask (one grouped message) and wait — never pick an environment yourself, even if one is more convenient. If they were **already** given (earlier this session, the one-pager, or the project guide), do **not** re-ask: state the values back in chat (`environment=<X> · account=<role/user>`) and let the user confirm with a short yes (or correct them) — they should not have to re-answer from scratch.

---

## Phase B — Load context

Use [parallel-prep.md](../../../references/parallel-prep.md) when Jira fetch and Confluence/Swagger are independent.

1. Fetch **Ticket** (Jira or user paste).
2. **Confluence** / **Swagger** if provided.
3. **Enumerate the AC/EC contract (coverage gate layers 1–2).** Before writing the plan, extract
   **every** Acceptance Criteria and Expected Condition / Expected Result line **char-exact** and give
   each a stable id (`AC1…`, `EC1…`). Then build the numbered **test plan** so **every id maps to ≥1
   scenario** — record the coverage matrix (`AC/EC id → scenario #`). A compound AC ("does A **and** B")
   splits into one scenario per clause; an id with no scenario is a coverage gap → add it, never drop it.
   (in-scope, out-of-scope, API vs UI.)
4. Fill [test-execution-plan-template.md](../../../references/test-execution-plan-template.md) in chat (environment, auth, in-scope table, pass criteria, risks). Include the **AC/EC → scenario coverage matrix** so the confirm gate shows every AC/EC is covered.

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

If results contradict expectations or tests are flaky, follow [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) before changing pass/fail wording. "Flaky" is a hypothesis, not a
conclusion — it needs the E2 investigation and an artifact like any other cause.

---

## Phase D — Pre-flight (mandatory)

Follow [playwright-preflight.md](../../../references/playwright-preflight.md) end-to-end. MUST NOT start Phase E until **Ready to run: YES**.

---

## Phase E — Execute tests (Playwright)

Run confirmed scenarios; record **PASSED** / **FAILED** / **BLOCKED** / **NOT TESTED** with evidence (screenshots, console, network).

Drive every scenario through its **real surface** — a UI scenario through the UI (Playwright clicks the
button / submits the form), following the case's steps completely. The API is for test-data /
precondition setup only, **never** to perform the action under test; an API scenario is driven at the
API. See [test-through-real-steps.md](../../../references/test-through-real-steps.md).

**Cover every enumerated AC/EC id (coverage gate layers 3–5).** Exercise each `AC*/EC*` id on its
real surface — never infer one from a sibling, never assume it covered because the happy path passed.
An id you cannot reach is an **explicit BLOCKED row** with the reason, never left off the table. Record
each id's result as its **own row** (layer 4 — row, never a remark); a case is **PASSED only when every
id it covers met its expected** (layer 5), and an id observed to differ makes that a FAILED/PWMI/BLOCKED
row for that point — never a PASS with the exception noted below the table.

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

### E2 — Root-cause investigation (mandatory for every FAILED and BLOCKED scenario, during the run)

Follow [root-cause-investigation.md](../../../references/root-cause-investigation.md) end to end,
**before moving to the next scenario** — the browser, the session and the fixture state are open now
and cannot be reconstructed in Phase F. Reconstruction is guessing.

1. **Invoke the debugging skill and announce it** — `superpowers:systematic-debugging` first
   (fallbacks in §0 of the reference). Follow its Phases 1–3; skip Phase 4 (QA does not patch product
   code; repairing our own test/selector/fixture/environment is in scope). Name the skill in the
   write-up.
2. **Complete the 8-boundary evidence sweep** (§1): surface · console · network request+response ·
   auth/session/role · server-side truth via a direct API call · **is the behaviour even in the
   deployed build** (grep the bundle for the feature's own strings/route/param; probe the endpoint) ·
   fixture state read back from the API · environment (env, build id, flag, VPN). Each boundary ends
   as an artifact or the literal words `not checked`. Do not stop at the first anomaly.
3. **Compare against something that works** (§2) — another record, role, entry point, environment, or
   a sibling feature sharing the endpoint. List every difference.
4. **One falsifiable hypothesis at a time** (§3), each killed or confirmed by the single smallest
   check; falsified ones stay in the record with their artifacts.
5. **Label the result** (§4): `Confirmed` · `Suspected` (+ the exact check that would confirm it and
   why it was not run) · `Unknown — not investigated` (+ what is needed and from whom).

**A test-side cause counts too, and is stated as such** — selector drift, stale auth, missing
fixture, VPN. Fix our side, re-run, and record it as a test defect, never as a product FAILED
([qa-debug-discipline.md](../../../references/qa-debug-discipline.md)). And never the reverse: a real
product bug is never filed away as "flaky".

**BLOCKED is not an escape.** A BLOCKED scenario still records the sweep up to the boundary that
blocked it and names the access/person needed to continue.

### E3 — Challenge the non-PASS + surface it to the user (mandatory for every non-PASSED scenario)

Follow [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md) end to end, **before
the scenario is written into Phase F as a defect.** A non-PASS is a hypothesis until it survives this:

1. **Name the discrepancy** — `Expected: {X} (source) · Observed: {Y} (evidence)`. If you cannot name
   the source of the expected value, stop — you are about to file the app against an assumption.
2. **Re-verify the expected side against an authoritative source, including related tickets' AC/EC** —
   this ticket's Expected/AC/EC **and** the parent story, every linked issue, sibling tickets on the
   same surface, and the test case's own source, all read character-exact. A related ticket may have
   **superseded** or **clarified** the expected value; a transliteration/feature-name is not the spec;
   an unconfirmed-spec hedge ("confirm with PO/Figma", "น่าจะ", "TBD") = a **question, not a defect**.
   - Expected wrong / superseded → **not a defect** → recommend adjusting the test case.
   - Expected unclear / conflicting / hedged → **BLOCKED + a remark naming who to ask**, never a defect.
   - Expected confirmed authoritative and the app still differs → it survived; carry it to Phase F.
3. **Surface to the user in chat and let them steer** — post `expected (+source) · observed · AC/EC
   finding · recommendation (A adjust the TC · B re-test · C confirm defect)`. For A/B **wait for the
   user's decision**; for a clearly-confirmed C you may continue, but never silently. Never rewrite the
   ticket's expected text to match the app on your own.

**Unattended / bot mode:** resolve the gate instead of asking — expected wrong/unclear → BLOCKED +
remark (no bug, no halt); test-side cause → fix and re-run; confirmed defect → record as normal.

---

## Phase F — Summarize in this chat (mandatory)

Always post a clear summary **in the same conversation** before anything else:

### F1 — Executive summary

2–4 sentences: overall result, pass/fail counts, blockers.

### F2 — Results table

```text
| # | Scenario | AC/EC id | Result | Notes / evidence |
|---|----------|----------|--------|------------------|
| 1 | ...      | AC1      | PASSED | —                |
| 2 | ...      | AC2 / EC1| FAILED | screenshot-02.png |
```

**Every enumerated AC/EC id has a row here (coverage gate layer 4·6).** The table — not the Notes
column, not a remark below it — is where each AC/EC result lives. If an AC/EC point matters, it is a
row with its own verdict; it is **never** parked in Notes/remark/chat while the case reads PASSED.

### F3 — Defects observed (if any)

List issues found **without filing tickets**:

```text
| # | Title | Severity | Confidence | Evidence |
|---|-------|----------|------------|----------|
| 1 | ...   | High     | Confirmed  | ...      |
```

The **Confidence** column carries the E2 label — `Confirmed` / `Suspected` / `Unknown — not
investigated` — and it describes the **cause**, not how strongly you feel about the defect.

**The `Severity` column is judged only by the [Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md)** — match the observed defect to its row, never invent a severity/priority
notion. Cheat-sheet (full matrix + hard rule at the link):

| If the defect reads like… | Priority | Verdict |
|---|---|---|
| cosmetic / typo / UI misalignment | Low | **PWMI** |
| minor calculation or display error | Low | **PWMI** |
| major feature affected **but a workaround exists** | Low | **PWMI** |
| minor glitch that does **not** block the workflow | Medium | **PWMI** |
| **optional** feature not working | Medium | **PWMI** |
| functionality problem affecting **several** users | Medium | **PWMI** |
| critical feature **partially** broken | Medium | **PWMI** |
| rarely-used feature **fully** broken | High | **FAILED** |
| feature issue affecting **some** users | High | **FAILED** |
| core functionality affected / partial outage | High | **FAILED** |
| core system failure affecting **most** users | High | **FAILED** |
| security warning in a minor feature | Highest | **FAILED** |
| system crash for some users | Highest | **FAILED** |
| complete outage / data loss / security breach | Highest | **FAILED** |

**Each defect row expands into a complete write-up** — this is what gets pasted into a bug, a Jira
comment, or a sheet cell later, so it must stand alone
([defect-report-completeness.md](../../../references/defect-report-completeness.md) §1–§4 and
[root-cause-investigation.md](../../../references/root-cause-investigation.md) §5):

| Block | Content | Answers |
|-------|---------|---------|
| **Repro matrix** | one row per entry point exercised: entry point · steps · observed · reproduces? · evidence file; untried paths `not tested` | "does this only happen from a direct URL?" |
| **Expected vs Actual** | the failing acceptance/expected line **quoted verbatim**, then *should be* vs *is now* as implementable facts (which elements render, which are disabled, which route) | "what should it look like, and which line did I break?" |
| **Root cause** | the E2 investigation block verbatim: one-sentence cause + `Confirmed`/`Suspected`/`Unknown — not investigated` label, the skill used, the 8-boundary evidence lines, hypotheses ruled out, and (Suspected) the check that would confirm it | "why does it happen, which layer do I open, and how sure are you?" |
| **Resolution options** | when the behavior deviates from the written expectation but the feature otherwise works: the two mutually exclusive outcomes with a named owner each — spec owner updates the expectation (no code change) **or** dev changes `{exact route/surface}` and leaves `{what already passes}` alone | "do I change code or does the spec change, and who decides?" |

**Never rewrite the ticket's acceptance/expected text to match observed behavior.** Report the conflict and
name the decision-maker.

**Every defect row must have passed the E3 challenge gate** — its expected side re-verified against an
authoritative source (this ticket's AC/EC **and** related/linked tickets), and the discrepancy already
surfaced to the user. A row whose expected turned out wrong / superseded / unclear does **not** belong
here — it is a test-case adjustment or a BLOCKED question, not a defect.

### F4 — Reader gate (MUST pass before Phase G)

Read F2 + F3 as the developer who will act on them. Run the six-question gate in
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §5. Any "no" → fix the
write-up. Also confirm: every scope word (`always`, `any entry point`, `only when …`) traces to a
repro-matrix row, and no observation is under an unresolved contradiction.

**AC/EC coverage reconciliation (gate layers 6–7 — hard, fail-closed).** Reconcile the Phase B
enumerated `AC*/EC*` list against F2: **`enumerated ids == rows carrying a verdict + evidence (or an
explicit BLOCKED reason)`**. Every id appears as a row; no id lives only in a remark/Notes/chat; no row
is verdict-less; no case reads PASSED while an id it covers was untested or observed to differ. Any
shortfall ⇒ the run is **NOT complete** — go back, add the row / run the id / re-verdict the partial
case, and do **not** proceed to Phase G, report "100%/complete", or close the session until the count
is green.

**Cause gate (same pass, no exceptions)** — read every sentence in F1–F3 that states or implies a
cause:

- [ ] It cites a **captured artifact** from the E2 sweep (status code, response field, console error,
      bundle probe, fixture read-back) — not a recollection, not another scenario's behaviour.
- [ ] It carries a label matching what was actually run — `Confirmed` only if the falsifying check ran.
- [ ] It contains **no hedge standing in for a cause** (`probably`, `น่าจะ`, `seems`, `flaky`,
      `cache issue`, `environment issue`, `race condition`).
- [ ] It does not restate the symptom as the cause, and `not checked` boundaries are still visible.

Any box unchecked → delete the sentence or return to E2 and earn it. Never soften it into a hedge.

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
exist and were not uploaded by you. **When the project uses a shared evidence folder, organize
uploads one subfolder per test-case id** (e.g. `<ticket>/<TC-ID>/…`) rather than dropping every
file flat in the ticket folder — follow the project guide's exact folder scheme and upload command
if one is specified. See [result-update-discipline.md](references/result-update-discipline.md).

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
  the expected line verbatim vs what actually happens, **the root cause with its `Confirmed` /
  `Suspected` / `Unknown — not investigated` label**, and — when the deviation is from the written
  expectation rather than a broken feature — who decides between updating the expectation and changing
  the code. A bare status forces the next reader back to you.
- **The cause label travels with the sentence.** If the destination is too narrow for the full E2
  block, write the one-sentence cause **with its label** and link the full block; never publish a
  `Suspected` cause with its label stripped off.

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
- [ ] **AC/EC coverage gate (7-layer) PASSED — `enumerated AC*/EC* ids == rows carrying a verdict + evidence (or explicit BLOCKED)`** ([qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *AC/EC & bug-detail coverage*): every Acceptance Criteria / Expected-Condition line was enumerated char-exact in Phase B, mapped 1:1 to a scenario, executed on its real surface, and appears as its **own row** in F2 — none parked only in a remark/Notes/chat, no case PASSED on partial coverage, a differing item is a FAILED/PWMI/BLOCKED row not a footnote. Fail closed: any id unrun/unrowed/verdict-less ⇒ story not complete.
- [ ] Every scenario has PASSED/FAILED/BLOCKED/NOT TESTED with evidence reference.
- [ ] **Story evidence-completeness gate (5-step) PASSED — the work is not done until it is green.** Per [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *Story-testing evidence-completeness gate*: every non-BLOCKED case carries a **whole-flow MP4 + one screenshot per Expected-Result item** (a retest-bug re-verify carries the MP4 per case + a screenshot only on text-verification cases, attached to Jira not Drive); every MP4 clears the **7-layer quality+correctness gate** in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) (max quality · whole flow, no skip · reaches the stated target, no early cut · ER on screen · legible · integrity+match · link-verified); every file resolves, plays/non-blank, and matches the exact case; verdict↔bug↔remark are consistent (minor-issue ⇒ a ≤Medium bug flagged, FAILED ⇒ High+, no stale BLOCKED note on a PASSED row). Fail closed: one red case = story not complete.
- [ ] Every FAILED/BLOCKED defect has its repro matrix (one row per entry point, untried paths `not tested`), expected-line-verbatim vs actual, **root cause**, and — where the deviation is from the written expectation — resolution options with a named owner.
- [ ] **E2 root-cause investigation ran for every FAILED and BLOCKED scenario** (during the run, not in Phase F): debugging skill invoked and named, 8-boundary sweep complete with `not checked` written where it applies, hypotheses ruled out recorded, cause labelled `Confirmed` / `Suspected` (+ the confirming check) / `Unknown — not investigated` (+ what is needed).
- [ ] **E3 challenge gate ran for every non-PASSED scenario** ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)): expected side re-verified char-exact against an authoritative source **including related/linked tickets' AC/EC**; a wrong/superseded expected became a TC-adjustment (not a defect), an unclear/hedged spec became BLOCKED + a who-to-ask remark (not a bug), and every surviving non-PASS was surfaced to the user in chat (recommendation A/B/C) before it was recorded.
- [ ] **F4 reader gate + cause gate passed before Phase G**; every scope word traces to a matrix row; every cause sentence cites an artifact and carries a label; no hedge word used as a cause; no unresolved contradiction between your own observations.
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
| [root-cause-investigation.md](../../../references/root-cause-investigation.md) | E2 — mandatory cause investigation, evidence-only |
| [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md) | E3 — challenge every non-PASS: re-verify expected vs related tickets' AC/EC, surface to user |
| [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) | AC/EC 7-layer coverage gate (every AC/EC is a row, not a remark) · story 5-step evidence gate · MP4 7-layer gate |
| [result-update-discipline.md](references/result-update-discipline.md) | Sheets, Jira, Confluence update rules |
| [workspace-guide-template.md](references/workspace-guide-template.md) | Optional non-secret defaults |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT open Jira/GitHub bugs in this workflow | Use create-bug-workflow |
| MUST enumerate **every** AC/EC line char-exact in Phase B, map each id 1:1 to a scenario, and reconcile `enumerated ids == rowed-and-verdicted rows` before Phase F ends (7-layer coverage gate in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md)) | The run's scope is the ticket's AC/EC contract; an unenumerated or unmapped AC is silently untested |
| MUST record **every** AC/EC result as its own row in F2 — NEVER park an untested/failing AC/EC point in a remark, Notes cell, note under the table, or chat while the case reads PASSED | A card was passed on partial AC/EC coverage with the gap footnoted in a remark; coverage is proven by rows, not prose beside them |
| MUST NOT mark a case PASSED on partial coverage — an AC/EC id unrun or observed to differ makes that a FAILED/PWMI/BLOCKED row (severity per the matrix), and an unreachable id is an explicit BLOCKED row, never dropped | "Works except one point" hidden as a caveat reads as a clean pass to everyone downstream |
| MUST NOT report "100%/complete", proceed to Phase G, or close the session while any AC/EC id lacks a rowed verdict (coverage gate fail-closed) | Partial AC/EC coverage is a stop condition; a green summary over an incomplete table looks finished but is not |
| MUST NOT run Playwright before Phase C confirm | Wrong scope/credentials |
| MUST drive each scenario through its real surface (UI scenario → Playwright through the UI, every step); API only for test-data/precondition prep; an API scenario is driven at the API | [test-through-real-steps.md](../../../references/test-through-real-steps.md) — an API shortcut for a UI action tests the wrong layer and can pass while the screen is broken |
| MUST attach complete evidence to every case before the story is "done" — a **whole-flow MP4 + one screenshot per Expected-Result item** for each non-BLOCKED story case (retest-bug re-verify = MP4 per case + screenshot on text-verification cases, attached to Jira) — and pass the 5-step gate in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) | A story reported "100% passed" while cases have no MP4 (or a minor-issue verdict with no bug) looks finished but is unverified; the pass-rate counts minor-issue as passed and hides the gap |
| MUST judge defect Priority/Severity ONLY from the [Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md) — never invent a severity notion; PASSED WITH MINOR ISSUE needs a Lowest/Low/Medium bug, FAILED needs High/Highest | Guessing severity produces inconsistent verdicts across testers and tickets |
| MUST re-read destination after Phase G writes | Silent partial failure |
| MUST exercise every entry point to a failing surface separately (direct route **and** the in-app path a user takes), one repro-matrix row + screenshot each; untried paths written `not tested` | A path with no evidence row is a guess published as a finding (learned OLS-108) |
| MUST NOT write a scope word (`always`, `any entry point`, `both ways`, `only when …`) that no repro-matrix row supports | The scope claim is the first thing a dev builds on |
| MUST hard-reload every surface after a state-changing fixture step before observing it; a stale-data window is a separate timing note with a measured delay, never a repro row | An already-open view holds pre-change data — recording it publishes your test timing as product behavior |
| MUST resolve any disagreement between your own observations with one clean re-run before writing F2/F3; unresolvable → BLOCKED, not FAILED | Resolving it in favour of the result you already wrote is how a wrong repro path ships |
| MUST give every FAILED/BLOCKED defect the F3 blocks — repro matrix, expected line quoted verbatim vs actual, **root cause**, resolution options with a named owner | These are the questions the reader asks next; answering them in chat leaves the record incomplete |
| MUST run the E2 root-cause investigation for EVERY FAILED and BLOCKED scenario, during the run, starting by invoking `superpowers:systematic-debugging` (Phases 1–3) and naming it in the write-up | The session state is open only during the run; improvised reasoning afterwards is where guessing enters |
| MUST run the E3 challenge gate for EVERY non-PASSED scenario — re-verify the expected side char-exact against an authoritative source **including related/linked tickets' AC/EC**, then surface expected-vs-observed + the AC/EC finding + a recommendation (adjust TC / re-test / confirm defect) to the user in chat before recording the verdict or listing it as a defect ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)) | A non-PASS against a stale, superseded, or misread expected is a phantom defect; the expected side is the one that must be earned, and adjusting a spec or re-testing is the user's call (PM-006) |
| MUST NOT file / list a defect whose expected turned out wrong, superseded, or unclear — that is a test-case adjustment or a BLOCKED question, never a defect; unattended bots resolve it as BLOCKED + remark, never a phantom bug and never a halt | Filing the app against an unverified expected is exactly how a phantom bug ships (PM-006) |
| MUST complete the 8-boundary sweep and write `not checked` where a boundary was not reached | A boundary not captured during the run cannot be reconstructed later — reconstruction is fabrication |
| MUST attach a captured artifact to every cause statement and label it `Confirmed` / `Suspected` / `Unknown — not investigated`, carrying the label into every destination the sentence is copied to | A `Suspected` cause read as `Confirmed` sends a developer to the wrong layer |
| MUST NOT use a hedge (`probably`, `น่าจะ`, `seems`, `flaky`, `cache issue`, `environment issue`) as a cause, restate the symptom as the cause, or infer a cause from another scenario/role/record | Hedged guessing is still guessing, and it ships as QA's finding |
| MUST classify a test-side cause (selector drift, stale auth, missing fixture, VPN) as a test defect — fix our side and re-run — and MUST NOT file a real product bug as "flaky" | Both directions of the mix-up destroy the run's credibility |
| MUST NOT patch product code while investigating — QA hands off the isolated boundary + evidence | Fixing the product is the dev's call, not QA's |
| MUST NOT rewrite a ticket's acceptance/expected text to match observed behavior | The spec owner decides; QA reports the conflict and names them |
| MUST pass the F4 reader gate before Phase G | The gate exists so answers land in the write-up, not in a round-trip that ends in an edited record |
| MUST re-verify before answering any question that arrives after publishing, then fold the answer into the published record in place (Phase H) | Answering from memory publishes wrong claims |
