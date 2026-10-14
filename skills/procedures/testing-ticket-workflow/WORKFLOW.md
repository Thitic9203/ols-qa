---
name: testing-ticket-workflow
description: |
  Test one Jira ticket with Playwright after intake (plan shown, then run) — compare every screen against the design (Figma), summarize results in chat, then optionally update an external results destination.
  Use for Testing ticket from Helix, /testing-ticket, or when the user wants automated UI/API checks for a single ticket.
  Do NOT use for opening bug tickets (create-bug-workflow), retest-after-fix on a bug (retest-bug-workflow), or drafting manual TC tables (tc-fe-prep / tc-api-prep). Does not run full-app regression.
---

# Testing ticket workflow

Run **Playwright-based** testing for a **single ticket** after intake (the plan is shown, then run). **Self-contained in Helix** — do not invoke `full-test-plugin`.

**This workflow does not open bug reports.** If the user wants bugs filed → route to **`create-bug-workflow`** (`/helix` → Create bug).

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Core constraints](#core-constraints)
- [Phase A — Session intake (mandatory) \[medium freedom\]](#phase-a--session-intake-mandatory-medium-freedom)
- [Phase B — Load context \[high freedom\]](#phase-b--load-context-high-freedom)
- [Phase C — Show the plan, then run \[medium freedom\]](#phase-c--show-the-plan-then-run-medium-freedom)
- [Phase D — Pre-flight (mandatory) \[low freedom\]](#phase-d--pre-flight-mandatory-low-freedom)
- [Phase E — Execute tests (Playwright) \[low freedom\]](execute-and-summarize.md#phase-e--execute-tests-playwright-low-freedom)
- [Result quality gate (mandatory before Phase F) \[low freedom\]](execute-and-summarize.md#result-quality-gate-mandatory-before-phase-f-low-freedom)
- [Phase F — Summarize in this chat (mandatory) \[high freedom\]](execute-and-summarize.md#phase-f--summarize-in-this-chat-mandatory-high-freedom)
- [Phase G — Optional: update results elsewhere \[low freedom\]](results-update.md#phase-g--optional-update-results-elsewhere-low-freedom)
- [Phase H — A question arrives after results were published \[low freedom\]](#phase-h--a-question-arrives-after-results-were-published-low-freedom)
- [QA closing (mandatory before session end) \[low freedom\]](#qa-closing-mandatory-before-session-end-low-freedom)
- [Out of scope](#out-of-scope)
- [Next workflows](#next-workflows)
- [References](#references)
- [MUST / NEVER](#must--never)

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
Testing ticket progress:
- [ ] Refusal-first (precondition gate)
- [ ] Phase A — Session intake (mandatory)
- [ ] Phase B — Load context
- [ ] Phase C — Show the plan, then run
- [ ] Phase D — Pre-flight (mandatory)
- [ ] Phase E — Execute tests (Playwright)
- [ ] Result quality gate (mandatory before Phase F)
- [ ] Phase F — Summarize in this chat (mandatory)
- [ ] Phase G — Optional: update results elsewhere
- [ ] QA closing (mandatory before session end)
- [ ] Phase H — A question arrives after results were published
```

## Discipline

**Settle and strategize FIRST** — before intake or any tool call, follow
[settle-and-strategize.md](../../../references/settle-and-strategize.md): invoke
**`engineering:testing-strategy`** to plan the approach, then hold to the discipline it names —
no guessing an expected/spec, and no blind retry loops (a repeat failure = stop and diagnose).

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Round-time contract.** A round has a cap of **15 minutes of AGENT + EXEC** time; human wait is not
counted and is reported on its own line. The cap is soft — print the ~12-minute line, finish the round,
never cut cases. The Phase F report ends with the `Round time:` line. Full rules:
[round-time-contract.md §1](../../../references/round-time-contract.md).

**Gates:** Phase C shows the plan, then runs — no mid-run waits
([round-time-contract.md §2](../../../references/round-time-contract.md)). Nothing is written outside the
run (Jira comment, results destination, notify) until the **single end-of-round approval popup**
([§3](../../../references/round-time-contract.md)) — because writes are costly to undo. Credentials are session-only.

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
correct app. Run this at **E3**, apply the documented default, and **queue the question** (adjust the
test case, re-test, or confirm the defect) for the end decisions popup — no mid-run wait
([round-time-contract.md §2](../../../references/round-time-contract.md)). Full gate:
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

**Compare against the design (Figma) on every UI scenario — no design, no verdict.** Every screen this
run judges is compared side by side with its design node: elements present · text char-exact ·
order/position · the states the node defines · no overflow or overlap. The node link actually opened
is recorded per scenario. **If a screen has no design reference, do not invent the expected** — report
it back to the person or channel that assigned this run, ask for the node (or an explicit "verify
function only"), and hold those visual points at **BLOCKED** while the rest of the run continues. Full
gate, including spec-drift and revised-AC handling:
[figma-design-comparison.md](../../../references/figma-design-comparison.md). Run it in **Phase B**
(does a reference exist) and at **E0** (the comparison itself).

**Test deeply — the gates a shipped-defect review put in writing.** Follow
[customer-escape-prevention.md](../../../references/customer-escape-prevention.md) throughout: cover
the **whole surface** the ticket touched, not only its own AC lines (§1); write expected results that
test *right*, not *present* (§2); never record PASSED over a `caveat / not verifiable / ยืนยันไม่ได้`
actual result (§3); run every in-scope screen width and judge overflow/overlap by **measurement** (§4);
use fixtures big enough to fail (§5); bind results to a **build id** and re-run a surface changed after
the run (§6); attach evidence to **passed** rows too (§7); unspecified behaviour is a question, never a
verdict (§8); preflight the session before believing any result (§9).

**Long sessions:** optional todos per [long-workflow-todos.md](../../../references/long-workflow-todos.md).

## Refusal-first (precondition gate)

MUST refuse to reach Phase B until **Ticket** and **URL** are provided — because the test plan has no target.

**Pre-flight login smoke gate (mandatory before Phase B).** Before running any scenario, verify that login **actually succeeds** for **only the role(s)/credential set(s) this run's scenarios will actually use** — not every role the project has. Read the run's scenarios to determine which roles are in scope; a single-role run logs in that one role, a multi-role run logs in each role it uses, nothing more. Reuse the saved login file per role first ([round-time-contract.md §5](../../../references/round-time-contract.md)); drive the real login (headless where supported) only when the file is missing or fails the session check, and confirm an authenticated signal (redirect to an authed area, a session/`me` endpoint, or a logged-in UI marker). Produce a pass/fail table for the in-scope roles.
- **All in-scope roles pass →** proceed to Phase B.
- **Any in-scope role fails →** 🛑 stop, report which role failed and why (backend error, VPN, bad creds), and do **not** start testing until it is cleared or the user explicitly says to skip the failing role. Never mark scenarios PASSED when auth was never verified.

This catches an auth-backend outage (e.g. an IdP returning a 4xx on every login) up front, before opening cases that would all block later — scoped to the roles the run needs, so an unrelated role's outage never blocks a run that doesn't use it. Project-specific role list, accounts, and login steps live in the project's `references/*-guide.md` / login runbook.

If **VPN** is required per user and environment is unreachable in Phase D, stop and report — do not mark scenarios PASSED without evidence.

---

## Core constraints

Recite once at the start of Phase A (first response only) from [helix-session-constraints.md](../../../references/helix-session-constraints.md) — **All Helix workflows** block, then the **Testing ticket** block.

Then follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Testing ticket** and show [intake-one-pager.md](../../../references/intake-one-pager.md) (Testing ticket section).

---

## Phase A — Session intake (mandatory) [medium freedom]

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

**Workspace-guide values are not asked again** ([round-time-contract.md §2](../../../references/round-time-contract.md)).
Environment, account pool, auth directory, Jira post format, results destination and similar per-project
values are read from the workspace guide. A value that is missing is asked **once** and **saved to the
guide immediately** — no second "save this?" question
([workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md)). Never store
production passwords in a committed guide.

**Environment + account are a hard intake item — always settle them, never assume.** Settle both *which environment* and *which account/role* this run uses before any login or Playwright. If neither the user nor the guide has stated them, ask (one grouped message) and wait — never pick an environment yourself, even if one is more convenient. If they were **already** given (earlier this session, the one-pager, or the project guide), do **not** re-ask: state the values back in chat (`environment=<X> · account=<role/user>`) and continue; a correction lands in the end decisions popup and starts a new round.

**Fingerprint check at round start** ([round-time-contract.md §10](../../../references/round-time-contract.md)).
If `references/helix-handoff-{KEY}.md` exists, fetch each fingerprint fresh (ticket `updated` + comment
count · Figma `lastModified` · Swagger spec hash · build version where exposed). A matching source is not
re-read in full; a changed or missing fingerprint re-reads that source only.

**Account pool.** Execution runs in parallel lanes by default ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md)), one account per lane. Read every test account the project guide lists for the environment (role + shared constraints: one OTP inbox, single-session app, rate limit). Lane count = min(units, accounts leasable without collision) — **no fixed lane cap** for this flow ([round-time-contract.md §4](../../../references/round-time-contract.md)). If the guide lists only the one account the user gave, the lane plan says so — ask for more accounts only when it would change the lane count.

---

## Phase B — Load context [high freedom]

Use [parallel-prep.md](../../../references/parallel-prep.md) when Jira fetch and Confluence/Swagger are independent.

1. Fetch **Ticket** (Jira or user paste).
2. **Confluence** / **Swagger** if provided.
3. **Enumerate the AC/EC contract (coverage gate layers 1–2).** Before writing the plan, extract
   **every** Acceptance Criteria and Expected Condition / Expected Result line **char-exact** and give
   each a stable id (`AC1…`, `EC1…`). Then build the numbered **test plan** so **every id maps to ≥1
   scenario** — record the coverage matrix (`AC/EC id → scenario #`). A compound AC ("does A **and** B")
   splits into one scenario per clause; an id with no scenario is a coverage gap → add it, never drop it.
   (in-scope, out-of-scope, API vs UI.)
4. **Design reference gate (mandatory — every UI scenario).** Follow
   [figma-design-comparison.md](../../../references/figma-design-comparison.md) §1–§2 and §4. Collect
   the Figma node for **every screen in scope** (from the ticket, its parent, or the project guide) and
   record the links in the plan. Opening it: prefer the **Figma Dev Mode MCP** (`get_screenshot` /
   `get_metadata` / `get_design_context`) — needs the Figma desktop app with **Dev Mode MCP Server
   enabled** (Figma menu → Preferences) and the file open; `node-id` in a Figma URL uses `-`, the MCP
   `nodeId` uses `:` (`?node-id=1234-5678` → `1234:5678`). If that server is off, **fall back to the
   browser-automation MCP**: open the file URL (a logged-in browser session persists auth), let the
   canvas render, screenshot the node. Dismiss the **"Want to view this file in Dev Mode?"** modal with
   **"Not now"** — NEVER "Request access". A View+Comment account is enough.
   Before declaring a screen has no design node, try every route in
   [no-wait-decision-gate.md](../../../references/no-wait-decision-gate.md) layer 7 (design-tool API with
   the configured token, browser view, exported image).
   **A screen with no design node → report it back to the person or channel that assigned this run**
   (ticket · screen · where you looked · what you need: the node link, a written visual contract, or an
   explicit "function only"). Keep testing everything that does not depend on the design; the visual
   points stay **BLOCKED** with a remark naming who was asked. Never assume a label, order, or layout.
   Unattended/bot mode: same request to the triggering channel with the project's @mention, visual
   points BLOCKED + remark, run continues.
5. **Scope the depth in the plan** ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md)):
   name the **surface(s)** in scope and pull in the surface's existing cases — not only this ticket's AC
   lines (§1) · list the **screen widths in scope** and state which are explicitly out of scope (§4) ·
   list the **states** each screen must be seen in (empty · loading · error · over-limit · disabled) ·
   name the **fixture** each scenario needs and confirm it is big enough to fail — long titles, lists
   past their visible slots, populated accounts (§5) · record the **build/commit id** under test (§6).
6. Fill [test-execution-plan-template.md](../../../references/test-execution-plan-template.md) in chat (environment, auth, in-scope table, pass criteria, risks). Include the **AC/EC → scenario coverage matrix** so the Phase C plan shows every AC/EC is covered, plus the design node per screen, the widths in scope, and the build id.
7. **Build the lane plan** ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §2–§4):
   group the scenarios into units (shared record · multi-role · one screen's widths/states · chained
   precondition · barrier for anything every lane sees), lease **one account per lane**, and
   write the lease table. Parallel is the default — serial needs a named §4 predicate.

---

## Phase C — Show the plan, then run [medium freedom]

Print the plan below, then start Phase D **without waiting**
([round-time-contract.md §2](../../../references/round-time-contract.md)). The plan rides again in the
end decisions popup, where the user can correct it; a correction there starts a new round.

```text
━━━ Testing ticket — plan (running now) ━━━
Ticket:      {KEY} — {one-line summary}
URL:         {url}
Login:       {user} / password provided (not shown)
VPN:         {required|not required} — {note}
Confluence:  {url or none}
Swagger:     {url or none}
Design ref:  {figma node link(s) per screen — or "none for {screen}: asked {who}"}
Build:       {build / commit id under test}
Widths:      {in scope} — out of scope: {widths not delivered this round}

Test plan ({N} scenarios):
  1. ...
Out of scope: ...

Execution:   parallel — {N} lanes   (or: serial — reason: {§4 predicate})
Lanes:       L1 · {account} ({role}) · scenarios {ids} · data prefix QA-L1
             ...
Barrier:     {scenario ids run alone after lanes — or none}

Execution plan: see filled template (preflight, evidence, pass criteria).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan printed — starting Phase D now. It appears again in the end decisions popup.
```

If results contradict expectations or tests are flaky, follow [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) before changing pass/fail wording. "Flaky" is a hypothesis, not a
conclusion — it needs the E2 investigation and an artifact like any other cause.

**Go back:** If the end decisions popup corrects this plan, return to Phase C — the correction starts a new round.

---

## Phase D — Pre-flight (mandatory) [low freedom]

Follow [playwright-preflight.md](../../../references/playwright-preflight.md) end-to-end. MUST NOT start Phase E until **Ready to run: YES**.

**Session preflight is part of Ready-to-run** ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §9):
read the app's own session endpoint and **see the user in the response** before the first scenario — a
page that merely loads proves nothing, and an expired session runs the whole set and reports "no
defects found". Log the environment, the build id, and the authenticated user id before the first
result line. Any of these missing = stop and report; results recorded after a failed preflight are not
results.

**Login reuse** ([round-time-contract.md §5](../../../references/round-time-contract.md)): load the saved
login file for the account (`{auth dir from guide}/{env}-{role}-{alias}.json`, named by account, not by
lane, gitignored), then call the session endpoint and expect the account's user id. On 401/403, a
redirect to login, or a different user → log in fresh and overwrite the file. One account belongs to
one lane and is never shared across concurrent sessions.

**In a parallel run the session preflight runs per lane**, inside each lane, and records the
authenticated user id — the parent accepts a lane's results only when that id matches the lane's
leased account ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §3).

**Go back:** If **Ready to run** is not YES — session user, build id or environment missing — fix the cause and return to the start of Phase D. A lane whose authenticated user id does not match its leased account logs in fresh (*Login reuse*) and re-runs its preflight before its results count.

---

## Phases E–F — execute and summarize

Read and follow [execute-and-summarize.md](execute-and-summarize.md) before Phase E — Phase E (execute), the result quality gate and Phase F (summarize in chat), end to end.

---

## Phase G — update results elsewhere

Read and follow [results-update.md](results-update.md) before Phase G — whenever the run updates results outside this chat (sheet, Jira comment, usage marker).

---

## Phase H — A question arrives after results were published [low freedom]

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

## QA closing (mandatory before session end) [low freedom]

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific. **Run its [cross-ticket conflict check](../../../references/qa-closing-shared.md#cross-ticket-conflict-check) first** — apply its unattended default (step 5) and queue *Investigate further* / *Close out now* into the F5 end decisions popup, before the approval popup ([round-time-contract.md §3](../../../references/round-time-contract.md)); the session is not done until the user has answered it there:

- [ ] F1–F4 posted before any external update.
- [ ] **AC/EC coverage gate (7-layer) PASSED — `enumerated AC*/EC* ids == rows carrying a verdict + evidence (or explicit BLOCKED)`** ([qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *AC/EC & bug-detail coverage*): every Acceptance Criteria / Expected-Condition line was enumerated char-exact in Phase B, mapped 1:1 to a scenario, executed on its real surface, and appears as its **own row** in F2 — none parked only in a remark/Notes/chat, no case PASSED on partial coverage; a differing item is a FAILED/PWMI row (per matrix), an unreached item a BLOCKED row (a coverage gap, not a product FAILED) — neither a footnote. Fail closed: any id unrun/unrowed/verdict-less ⇒ story not complete.
- [ ] Every scenario has PASSED/FAILED/BLOCKED/NOT TESTED with evidence reference.
- [ ] **Design (Figma) comparison ran for every UI scenario** ([figma-design-comparison.md](../../../references/figma-design-comparison.md)): design reference recorded on the report header's `Design ref:` line (never a per-row column), five points compared (present · char-exact text · order/position · states · no overflow/overlap measured); a screen with **no** design reference was reported back to the assigning person/channel in Phase B and its visual points left **BLOCKED**, never PASSED; a screen this ticket intentionally changed was reported as **design out of date** (owner named) rather than listed as a defect; a mid-test AC revision is spelled out as an accepted limitation.
- [ ] **Depth gates green** ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md)): the whole surface covered (its existing cases, not only this ticket's AC) · values checked against their source · every in-scope width run with overflow/overlap **measured**, out-of-scope widths stated · states exercised (empty/loading/error/over-limit/disabled) · fixture big enough to overflow or scroll · build id recorded · evidence on **passed** rows too · no `caveat/not verifiable/assumed` row carrying a passing verdict · anything wrong that was seen is reported even where no AC asked for it.
- [ ] **Story evidence-completeness gate (5-step) PASSED — the work is not done until it is green.** Per [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *Story-testing evidence-completeness gate*: every non-BLOCKED case carries a **whole-flow MP4 + one screenshot per Expected-Result item** (a retest-bug re-verify carries the MP4 per case + a screenshot only on text-verification cases, attached to Jira not Drive); every **role the case names** has its own capture set (5 roles named = 5 sets, canonical ids copy-pasted, an unexercised role = a BLOCKED row naming it — never "covered by another role"); every MP4 clears the **7-layer quality+correctness gate** in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) (max quality per the capture spec — 1920×1080 · dsf 2 · CRF 18 preset slow · yuv420p limited-range · **steady picture, ≤5% repeated moving frames** with declared still-holds capped at 25% · **provenance manifest** naming `cdp-screencast->x264`, never Playwright `recordVideo` — recorded with the toolkit's `capture/qa_recorder.js` and measured by `capture/verify_video.py`, not by eye · whole flow, no skip · **scrolls to and holds the stated target in frame**, no early cut · ER on screen · legible · integrity+match · link-verified); every file resolves, plays/non-blank, and matches the exact case; verdict↔bug↔remark are consistent (minor-issue ⇒ a ≤Medium bug flagged, FAILED ⇒ High+, no stale BLOCKED note on a PASSED row). Fail closed: one red case = story not complete.
- [ ] **Pre-delivery completeness gate (7-layer) PASSED before ANY external write — Phase G, the Jira post, the sheet, the notify, or telling the requester "done".** Per [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *Pre-delivery completeness*: scope re-counted from the ticket **this round** (not from the earlier plan) · role × case matrix full with no inherited cells · **every** evidence file opened this round (not sampled) and shown to contain its ER · every claim points at a row · verdict↔bug↔priority↔remark agree · nothing recorded only in prose/หมายเหตุ/chat · **the 4-question adversarial pass answered with a pointer for every question** (judge the deliverable as a second QA/another AI told to "find where this was cut short") · handover states cases run/total, roles covered/named, files verified, and every BLOCKED with its reason. Fail closed: any layer red ⇒ nothing is delivered until it is fixed and the gate re-run.
- [ ] Every FAILED/BLOCKED defect has its repro matrix (one row per entry point, untried paths `not tested`), expected-line-verbatim vs actual, **root cause**, and — where the deviation is from the written expectation — resolution options with a named owner.
- [ ] **E2 root-cause investigation ran for every FAILED and BLOCKED scenario** (during the run, not in Phase F): debugging skill invoked and named, 8-boundary sweep complete with `not checked` written where it applies, hypotheses ruled out recorded, cause labelled `Confirmed` / `Suspected` (+ the confirming check) / `Unknown — not investigated` (+ what is needed).
- [ ] **E3 challenge gate ran for every non-PASSED scenario** ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)): expected side re-verified char-exact against an authoritative source **including related/linked tickets' AC/EC**; a wrong/superseded expected became a TC-adjustment (not a defect), an unclear/hedged spec became BLOCKED + a who-to-ask remark (not a bug), and every surviving non-PASS was queued (recommendation A/B/C) for the end decisions popup — no mid-run wait.
- [ ] **F4 reader gate + cause gate passed before Phase G**; every scope word traces to a matrix row; every cause sentence cites an artifact and carries a label; no hedge word used as a cause; no unresolved contradiction between your own observations.
- [ ] If Phase G ran: destination re-read matches agreed column formats.
- [ ] Close-out includes `Verified:` (or partial-failure honesty per Phase F).
- [ ] Phase G6 fix-verify completed when Phase G ran.
- [ ] **Cross-ticket conflict check ran** ([qa-closing-shared.md](../../../references/qa-closing-shared.md#cross-ticket-conflict-check)): the whole project searched with every layer's query + hit count recorded, candidates opened (fields + every comment), the table posted in chat with a clickable link per ticket, and the user answered *Investigate further* / *Close out now* in the end decisions popup (before the approval popup) before the session was called done.
- [ ] **Round-time contract** ([round-time-contract.md](../../../references/round-time-contract.md)): no mid-run waits; one approval popup listed every concrete action; the report ended with the measured `Round time:` line; `references/helix-handoff-{KEY}.md` written with fingerprints.
- [ ] **Fresh-eyes:** re-read F2 before Phase G when **> 15 scenarios**.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (Testing ticket section).
- [ ] Suggest **create-bug** if F3 has defects; handoff file written every round (§10).

**Go back:** If any item above is unchecked, return to the phase it names (E, F or G) and redo from there; do not report done.

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
| [parallel-test-lanes.md](../../../references/parallel-test-lanes.md) | Default parallel execution — lanes, one account per lane, merge |
| [root-cause-investigation.md](../../../references/root-cause-investigation.md) | E2 — mandatory cause investigation, evidence-only |
| [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md) | E3 — challenge every non-PASS: re-verify expected vs related tickets' AC/EC, default + queue for the end decisions popup |
| [round-time-contract.md](../../../references/round-time-contract.md) | 15-min AGENT+EXEC round · no mid-run waits · end-of-round order and single approval · fan-out · login reuse · render/media check · Figma dedupe · fingerprints |
| [figma-design-comparison.md](../../../references/figma-design-comparison.md) | Phase B · E0 — compare every screen against its design node; no design ⇒ report back to the assigner, visual points BLOCKED |
| [customer-escape-prevention.md](../../../references/customer-escape-prevention.md) | Depth gates from the shipped-defect review — surface sweep, ER quality, widths measured, fixtures, build id, evidence on passed rows |
| [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) | AC/EC 7-layer coverage gate (every AC/EC is a row, not a remark) · capture scope (a set per named role · every step on screen · scroll to the target) · story 5-step evidence gate · MP4 7-layer gate · pre-delivery 7-layer gate before handing results over |
| [result-update-discipline.md](references/result-update-discipline.md) | Sheets, Jira, Confluence update rules |
| [workspace-guide-template.md](references/workspace-guide-template.md) | Optional non-secret defaults |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT open Jira/GitHub bugs in this workflow | Use create-bug-workflow |
| MUST run the plan in parallel lanes whenever it has 2+ units, one leased account per lane, lane count = min(units, leasable accounts) with no fixed cap, unless a [parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §4 predicate is named | Shortest run time with no shared login — a shared account ends sessions and shares state, producing false defects |
| MUST enumerate **every** AC/EC line char-exact in Phase B, map each id 1:1 to a scenario, and reconcile `enumerated ids == rowed-and-verdicted rows` before Phase F ends (7-layer coverage gate in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md)) | The run's scope is the ticket's AC/EC contract; an unenumerated or unmapped AC is silently untested |
| MUST record **every** AC/EC result as its own row in F2 — NEVER park an untested/failing AC/EC point in a remark, Notes cell, note under the table, or chat while the case reads PASSED | A card was passed on partial AC/EC coverage with the gap footnoted in a remark; coverage is proven by rows, not prose beside them |
| MUST NOT mark a case PASSED on partial coverage — an AC/EC id **observed to differ** is a FAILED/PWMI row (severity per the matrix); an **unrun/unreachable** id is a BLOCKED row (a coverage gap, never a product FAILED); neither is a PASS and neither is dropped | "Works except one point" hidden as a caveat reads as a clean pass to everyone downstream; and calling a merely-untested item FAILED contradicts "a coverage gap is not a defect" |
| MUST NOT report "100%/complete", proceed to Phase G, or close the session while any AC/EC id lacks a rowed verdict (coverage gate fail-closed) | Partial AC/EC coverage is a stop condition; a green summary over an incomplete table looks finished but is not |
| MUST print the Phase C plan before Playwright, then run without waiting; the plan rides in the end decisions popup ([round-time-contract.md §2](../../../references/round-time-contract.md)) | The user still sees and can correct scope/credentials, without a mid-run wait |
| NEVER wait mid-run for a user answer — apply the documented default and queue the question for the end decisions popup ([§2](../../../references/round-time-contract.md)) | Human wait blocks the round; the default keeps the run moving and the question still reaches the user |
| MUST execute every external write (comment, result update, notify) under **one** approval popup that names each concrete action, with no second approval ([§3](../../../references/round-time-contract.md)) | One human touch per round; every action is still approved by name |
| MUST end every round report with the measured `Round time: AGENT+EXEC {n} min · human wait {h} min · overrun {…} min` line — never estimated ([§1](../../../references/round-time-contract.md)) | The 15-minute cap is only real if it is measured |
| MUST drive each scenario through its real surface (UI scenario → Playwright through the UI, every step); API only for test-data/precondition prep; an API scenario is driven at the API | [test-through-real-steps.md](../../../references/test-through-real-steps.md) — an API shortcut for a UI action tests the wrong layer and can pass while the screen is broken |
| MUST attach complete evidence to every case **and every role the case names** before the story is "done" — a **whole-flow MP4 + one screenshot per Expected-Result item, per role**, for each non-BLOCKED story case (retest-bug re-verify = MP4 per case + screenshot on text-verification cases, attached to Jira) — and pass the 5-step gate in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) | A story reported "100% passed" while cases have no MP4 (or a minor-issue verdict with no bug) looks finished but is unverified; the pass-rate counts minor-issue as passed and hides the gap |
| MUST judge defect Priority/Severity ONLY from the [Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md) — never invent a severity notion; PASSED WITH MINOR ISSUE needs a Lowest/Low/Medium bug, FAILED needs High/Highest | Guessing severity produces inconsistent verdicts across testers and tickets |
| MUST re-read destination after Phase G writes | Silent partial failure |
| MUST exercise every entry point to a failing surface separately (direct route **and** the in-app path a user takes), one repro-matrix row + screenshot each; untried paths written `not tested` | A path with no evidence row is a guess published as a finding (learned OLS-108) |
| MUST NOT write a scope word (`always`, `any entry point`, `both ways`, `only when …`) that no repro-matrix row supports | The scope claim is the first thing a dev builds on |
| MUST hard-reload every surface after a state-changing fixture step before observing it; a stale-data window is a separate timing note with a measured delay, never a repro row | An already-open view holds pre-change data — recording it publishes your test timing as product behavior |
| MUST resolve any disagreement between your own observations with one clean re-run before writing F2/F3; unresolvable → BLOCKED, not FAILED | Resolving it in favour of the result you already wrote is how a wrong repro path ships |
| MUST give every FAILED/BLOCKED defect the F3 blocks — repro matrix, expected line quoted verbatim vs actual, **root cause**, resolution options with a named owner | These are the questions the reader asks next; answering them in chat leaves the record incomplete |
| MUST run the E2 root-cause investigation for EVERY FAILED and BLOCKED scenario, during the run, starting by invoking `superpowers:systematic-debugging` (Phases 1–3) and naming it in the write-up | The session state is open only during the run; improvised reasoning afterwards is where guessing enters |
| MUST run the E3 challenge gate for EVERY non-PASSED scenario — re-verify the expected side char-exact against an authoritative source **including related/linked tickets' AC/EC**, then apply the documented default and queue expected-vs-observed + the AC/EC finding + a recommendation (adjust TC / re-test / confirm defect) for the end decisions popup before listing it as a defect ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)) | A non-PASS against a stale, superseded, or misread expected is a phantom defect; the expected side is the one that must be earned, and adjusting a spec or re-testing is the user's call (PM-006) |
| MUST NOT file / list a defect whose expected turned out wrong, superseded, or unclear — that is a test-case adjustment or a BLOCKED question, never a defect; unattended bots resolve it as BLOCKED + remark, never a phantom bug and never a halt | Filing the app against an unverified expected is exactly how a phantom bug ships (PM-006) |
| MUST complete the 8-boundary sweep and write `not checked` where a boundary was not reached | A boundary not captured during the run cannot be reconstructed later — reconstruction is fabrication |
| MUST attach a captured artifact to every cause statement and label it `Confirmed` / `Suspected` / `Unknown — not investigated`, carrying the label into every destination the sentence is copied to | A `Suspected` cause read as `Confirmed` sends a developer to the wrong layer |
| MUST NOT use a hedge (`probably`, `น่าจะ`, `seems`, `flaky`, `cache issue`, `environment issue`) as a cause, restate the symptom as the cause, or infer a cause from another scenario/role/record | Hedged guessing is still guessing, and it ships as QA's finding |
| MUST classify a test-side cause (selector drift, stale auth, missing fixture, VPN) as a test defect — fix our side and re-run — and MUST NOT file a real product bug as "flaky" | Both directions of the mix-up destroy the run's credibility |
| MUST NOT patch product code while investigating — QA hands off the isolated boundary + evidence | Fixing the product is the dev's call, not QA's |
| MUST NOT rewrite a ticket's acceptance/expected text to match observed behavior | The spec owner decides; QA reports the conflict and names them |
| MUST pass the F4 reader gate before Phase G | The gate exists so answers land in the write-up, not in a round-trip that ends in an edited record |
| MUST re-verify before answering any question that arrives after publishing, then fold the answer into the published record in place (Phase H) | Answering from memory publishes wrong claims |
| MUST compare every UI scenario against its **design node** on all five points (present · char-exact text · order/position · states · no overflow/overlap measured) and record the node link on the report header's `Design ref:` line, never as a per-row column | An all-present, mis-ordered screen passes a "shows A, B, C" expected; the set that shipped 25 customer-found defects contained the word `figma` zero times |
| MUST report a screen with **no design reference** back to the person/channel that assigned the run, keep its visual points **BLOCKED**, and continue the rest of the run — never assume a label, order, or layout, never PASSED | An assumed expected is not a spec; it produces both phantom defects and false passes (PM-006) |
| MUST report a screen this ticket intentionally changed as **design out of date** (name the design owner, ask for the node update in this ticket) instead of listing it as a defect | A relocated menu was reported missing when it existed in a submenu — a full round lost |
| MUST spell out a mid-test AC revision in the verdict (`PASSED against AC as revised {date}, differs from design in {…}`) and hand the difference to the known-limitation list | A silent PASSED on a revised AC shipped the review's only High-severity escape |
| MUST cover the whole **surface** the ticket touched — its existing cases, states, and in-scope widths — not only the ticket's own AC lines | A component passed on one screen while the defect sat on another screen reusing it |
| MUST write display-surface expected results with all four dimensions (present · values correct vs source · order/position vs design node · no overflow/overlap measured) and MUST NOT accept `complete` / `correct` / `properly` / `ครบถ้วน` / `ถูกต้อง` alone as an expected | "Shows A, B, C" passes a wrecked screen — that screen produced five customer bugs |
| MUST NOT record a passing verdict on a scenario whose notes contain `caveat` / `not verifiable` / `assumed` / `ยืนยันไม่ได้` / `ตรวจไม่ได้` — it is BLOCKED, or PWMI with a bug | We shipped a PASSED whose own text said it could not be verified, and that was exactly the customer's bug |
| MUST state an expected's **verification method** (endpoint + permission) when the UI does not display the value; no method ⇒ the scenario is BLOCKED from the start | Discovering it mid-run is how the caveat-then-PASSED happened |
| MUST run every in-scope width as its own row and judge overflow (`rect.right > innerWidth`, `scrollWidth > innerWidth`) and overlap (>3 px) by **measurement**; out-of-scope widths are stated out of scope | 7 of 25 escapes were on widths nobody ran; measuring caught them the moment it was run |
| MUST confirm the standing realistic fixture exists before the run (long titles, lists past their visible slots, populated accounts, pre-first-use account) | One course with one media item can never overflow, wrap, or scroll |
| MUST bind results to a build/commit id and re-run any surface changed after the run before results are handed over | 122/122 passed against a build the customer never saw |
| MUST attach an evidence reference to **passed** rows too — `count(passed) == count(evidence)` before Phase G | 12 of 122 passed rows had evidence; nobody could re-examine the layouts that later produced bugs |
| MUST report anything wrong observed during a run even when no AC asked for it | "Badges render correctly" was written while the badge-overflow defect was on screen |
| MUST preflight the authenticated session (see the user in the session response) and confirm a toggle's starting state before pressing it | A dead session reported "no defects" for a whole set; a two-way button measured the opposite direction |
| MUST open the trace (changelog / comments / logs) before claiming an action never happened | An empty tracking field was read as "never tested" and became a wrong number-one root cause |
| MUST run the cross-ticket conflict check ([qa-closing-shared.md](../../../references/qa-closing-shared.md#cross-ticket-conflict-check)) before calling the session done — whole project, every type and status (Done included), a chat table with a clickable link per ticket, then queue *Investigate further* / *Close out now* into the end decisions popup before the approval popup | Another ticket in the same project can contradict, supersede, or duplicate what was just verified; a check limited to the tested ticket never sees it |
