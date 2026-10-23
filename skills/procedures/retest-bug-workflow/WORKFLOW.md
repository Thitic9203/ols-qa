---
name: retest-bug-workflow
description: |
  Retest a Jira bug or task after a dev fix — read ticket, build the retest case list, compare every screen against the design (Figma), test API or UI, compare Swagger, draft evidence, post the comment with its case list (with approval), transition and assign back to dev.
  Use when the user says retest bug, retest task, verify fix, check if an issue is fixed, /retest-bug, or Retest bug from Helix.
  Do NOT use for writing new FE/API test case tables (tc-fe-prep / tc-api-prep), full ticket Playwright runs (testing-ticket-workflow), or opening new bugs (create-bug-workflow).
---

# Retest bug workflow

End-to-end retest from a Jira **bug or task** ticket: fetch ticket → build the retest case list → design (Figma) reference gate → test → compare Swagger → draft comment (case list + verdict table) → post (after approval) → transition → assign back to dev.

**Bug or Task — same workflow, different contract.** A **Bug** is retested against its own Expected
Result field. A **Task / Story** whose fix is being re-verified has no such field: its contract is the
ticket's Acceptance Criteria plus the existing cases of the surface it touched (Step 2c). Both produce
the same artifact — a **case list in the posted comment**, one row per case, so the next reader sees
exactly what was covered without reading the chat.

**Project-agnostic:** Load URLs, credentials, and transitions from `references/*-retest-guide.md` in the user's workspace.

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Step 0 — Get the ticket \[high freedom\]](#step-0--get-the-ticket-high-freedom)
- [Step 1 — Project config \[medium freedom\]](#step-1--project-config-medium-freedom)
- [Step 2 — Fetch Jira ticket \[high freedom\]](#step-2--fetch-jira-ticket-high-freedom)
- [Step 2b — Fix claim vs verification plan (mandatory) \[medium freedom\]](#step-2b--fix-claim-vs-verification-plan-mandatory-medium-freedom)
- [Step 2c — Build the retest case list (mandatory — bug and task alike) \[medium freedom\]](#step-2c--build-the-retest-case-list-mandatory--bug-and-task-alike-medium-freedom)
- [Step 2d — Design reference gate (mandatory before any UI verdict) \[low freedom\]](#step-2d--design-reference-gate-mandatory-before-any-ui-verdict-low-freedom)
- [Step 3 — Bug type and comment format (decide once) \[medium freedom\]](#step-3--bug-type-and-comment-format-decide-once-medium-freedom)
- [Step 4 — Login and test \[low freedom\]](execute-and-evidence.md#step-4--login-and-test-low-freedom)
- [Step 5 — Evidence \[medium freedom\]](execute-and-evidence.md#step-5--evidence-medium-freedom)
- [Result quality gate (mandatory before the comment is drafted) \[low freedom\]](execute-and-evidence.md#result-quality-gate-mandatory-before-the-comment-is-drafted-low-freedom)
- [Step 6 — Draft Jira comment \[medium freedom\]](comment-and-post.md#step-6--draft-jira-comment-medium-freedom)
- [Step 7 — Post comment \[low freedom\]](comment-and-post.md#step-7--post-comment-low-freedom)
- [QA closing (mandatory before "done") \[low freedom\]](#qa-closing-mandatory-before-done-low-freedom)
- [Step 8 — Close out (after successful post; no second approval unless user asked) \[low freedom\]](closeout-and-notify.md#step-8--close-out-after-successful-post-no-second-approval-unless-user-asked-low-freedom)
- [Step 9 — QA result notify (if the project configures a channel) \[low freedom\]](closeout-and-notify.md#step-9--qa-result-notify-if-the-project-configures-a-channel-low-freedom)
- [Step 10 — A question arrives after the comment was posted \[low freedom\]](closeout-and-notify.md#step-10--a-question-arrives-after-the-comment-was-posted-low-freedom)
- [Skill composition](#skill-composition)
- [Out of scope](#out-of-scope)
- [MUST / NEVER](#must--never)

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
Retest bug progress:
- [ ] Refusal-first (precondition gate)
- [ ] Step 0 — Get the ticket
- [ ] Step 1 — Project config
- [ ] Step 2 — Fetch Jira ticket
- [ ] Step 2b — Fix claim vs verification plan (mandatory)
- [ ] Step 2c — Build the retest case list (mandatory — bug and task alike)
- [ ] Step 2d — Design reference gate (mandatory before any UI verdict)
- [ ] Step 3 — Bug type and comment format (decide once)
- [ ] Step 4 — Login and test
- [ ] Step 5 — Evidence
- [ ] Result quality gate (mandatory before the comment is drafted)
- [ ] Step 6 — Draft Jira comment
- [ ] Step 7 — Post comment
- [ ] Step 8 — Close out (after successful post; no second approval unless user asked)
- [ ] Step 9 — QA result notify (if the project configures a channel)
- [ ] QA closing (mandatory before "done")
- [ ] Step 10 — A question arrives after the comment was posted
```

## Discipline

**Settle and strategize FIRST** — before Step 0 or any tool call, follow
[settle-and-strategize.md](../../../references/settle-and-strategize.md): invoke
**`engineering:testing-strategy`** to plan the retest approach, then hold to the discipline it names —
no guessing an expected/spec, and no blind retry loops (a repeat failure = stop and diagnose).

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Jira bodies** (after approval): neutral English — no "Retested by:", no honorifics. If reproduction is unclear or results conflict with dev claims, follow [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) before posting PASSED/FAILED.

**Root cause is mandatory, never inferred.** Every item that is not a clean PASSED gets a full
investigation per [root-cause-investigation.md](../../../references/root-cause-investigation.md) —
run at **Step 4h**, before the draft exists. That reference also governs every sentence in this
workflow that states or implies a cause, wherever it is written (chat, comment, notify). Start it by
invoking a real debugging skill — **`superpowers:systematic-debugging`** first, its Phases 1–3 only
(QA diagnoses; QA does not patch product code). No cause without a captured artifact and a
`Confirmed` / `Suspected` / `Unknown — not investigated` label.

**Any verdict that is not a clean PASSED** is governed by [defect-report-completeness.md](../../../references/defect-report-completeness.md) — the comment must answer the reader's five questions (what, **which entry points**, what it should be instead, why that is a fail, **what changes and who decides**) before it is posted. A question asked after posting means a section was missing; the fix is the comment, not a chat reply.

**Challenge every non-PASS before you record it (the "wait, really?" gate).** A retest result that is
not a clean PASSED is a **hypothesis, not a verdict**. Before it becomes FAILED / BLOCKED — or a posted
comment — re-verify the **expected** side against an authoritative source, **including the AC/EC of
related / linked tickets** (the parent story, linked issues, sibling tickets on the same surface),
read character-exact. The bug's own Expected Result is the primary contract (Step 2), but a related
ticket may have **superseded** or **clarified** it, and a transliteration or an unconfirmed-spec hedge
turns a correct app into a phantom FAILED. Run this at **Step 4i**, then **surface it to the user in
chat** so they can decide whether to adjust the expected/TC, re-test, or confirm the defect. Full gate:
[non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md).

**Retest every expected-result item + bug-detail — completeness is a hard gate.** The scope of the
retest is the bug's own contract: **every** item of its Expected Result **and** each bullet of its
detail/steps, plus any AC/EC the bug's parent story pins. The retest is not done until each of those
items is verified AND appears as its **own row** in the verdict table with its own status + evidence.
It is **never** acceptable to post PASSED on partial coverage and mention the untested/failing item in
a remark, a note under the table, or in chat — a point worth noticing is worth a **row**. Enforced by
the **7-layer AC/EC & bug-detail coverage completeness gate** in
[qa-evidence-gates.md](../../../references/qa-evidence-gates.md): layers 1–2 (enumerate every
expected-result/detail item char-exact, map each id 1:1 to a table row) run at **Step 2**; layers 3–5
(verify each on its real surface, row-never-a-remark, partial coverage ≠ PASSED) run at **Step 4**;
layers 6–7 (reconcile `enumerated ids == rowed-and-statused rows`, fail-closed) run at **Step 6 / 8·0**
before any post or transition. Fail-closed: any item missing a row, unverified, status-less, or living
only in a remark ⇒ the retest is **not complete**.

**Test through the real steps.** Drive the behaviour under verification through its own surface,
following the ticket's Test Steps completely — a UI bug through the UI (click, fill, submit), never a
direct API call to perform the tested action. The API is allowed **only** to prepare the case's test
data / precondition (Step 4c). For an **API-layer** bug the API call in Step 4e *is* the real step,
not a shortcut. Full rule: [test-through-real-steps.md](../../../references/test-through-real-steps.md).

**Compare against the design (Figma) on every UI retest — no design, no verdict.** Every screen this
retest judges is compared side by side with its design node: elements present · text char-exact ·
order/position · states · no overflow or overlap. The node link actually opened is recorded in the
comment on the `Design ref:` line — that line is the only place it goes. **If the screen has no design reference, do not
invent the expected** — report it back to the person or channel that assigned this retest, ask for the
node (or an explicit "verify function only"), and hold those visual points at **BLOCKED** while the
rest of the retest continues. Full gate, including spec-drift and revised-AC handling:
[figma-design-comparison.md](../../../references/figma-design-comparison.md). Run it at **Step 2d**
(does a reference exist) and **Step 4d** (the comparison itself).

**Retest deeply — the gates a shipped-defect review put in writing.** Follow
[customer-escape-prevention.md](../../../references/customer-escape-prevention.md) throughout: cover
the **whole surface** the fix touched, not only the ticket's own lines (§1); write expected results
that test *right*, not *present* (§2); never record PASSED over a `caveat / not verifiable / ยืนยันไม่ได้`
actual result (§3); run every in-scope screen width and judge overflow/overlap by **measurement** (§4);
use fixtures big enough to fail (§5); note the **build id** the fix landed in (§6); attach evidence to
**passed** rows too (§7); unspecified behaviour is a question, never a verdict (§8); preflight the
session before believing any result (§9).

**Round-time contract.** Every retest round follows
[round-time-contract.md](../../../references/round-time-contract.md): a **15-minute cap on AGENT + EXEC
time** per round, human wait reported on its own line and never counted, and a **soft cap** — at about
12 minutes print one line and finish the round; never cut cases to stay under it (§1). No step waits
mid-run: decisions are queued for the end-of-round popups at Step 6d (§2–§3). The round report (Step 8e)
**ends with the `Round time:` line**, measured from session timestamps, never estimated (§1).

Use plain chat for URLs/accounts (never a password); AskUserQuestion only for choices (e.g. approve comment).

## Refusal-first (precondition gate)

MUST refuse to start Step 2 until the user provides a **Jira issue key or browse URL** — a **Bug**, or a **Task / Story** whose fix is being re-verified. Retest scope is one issue.

MUST refuse to run tests without **reachable environment config** (workspace `*-retest-guide.md` or answers from [project-config-template.md](references/project-config-template.md)) — because URLs and credentials must not be hardcoded in the skill.

On first response after constraints, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Retest bug**, then show [intake-one-pager.md](../../../references/intake-one-pager.md) (Retest section).

---

## Step 0 — Get the ticket [high freedom]

If no key or URL was provided:

> Which Jira ticket should I retest (bug or task)? Share the issue key or browse URL.

**Wait for an answer.** Extract `{ISSUE_KEY}` and `{JIRA_DOMAIN}` from the link.

---

## Step 1 — Project config [medium freedom]

### 1a. Find existing config

In the **workspace** `references/` folder, find `*-retest-guide.md`. If present → read → go to 1c.

### 1b. Interactive setup (first time)

Ask **one question at a time** using `references/project-config-template.md` sections:

- Jira domain, ticket prefix
- Environments + base URLs + Swagger paths
- Portals, login URLs, login method
- Test accounts (username/email only — a password is never collected, stored, or filled; a dead session is restored by ready-to-run relink/mint commands the user runs; record their templates (`<project-dir>`, `<env>`, `<account>`) when the guide names none)
- Optional error docs, transitions, gotchas

Write `references/{project}-retest-guide.md` in the user's repo and tell them where it was saved.
Each answered value is saved to the guide **immediately** — no second "save this?" question; a value
missing later in a run is asked once and saved the same way. Never store production passwords in a
committed guide ([round-time-contract.md](../../../references/round-time-contract.md) §2).

### 1c. Use config only

All URLs, credentials, transition names, and Swagger URLs come from config — **no hardcoded project values in this skill**.

---

## Step 2 — Fetch Jira ticket [high freedom]

**Round N (a ticket retested before) — fingerprint check first.** Read
`references/helix-handoff-{KEY}.md` and fetch each source's fingerprint fresh: ticket `updated` +
comment count · Figma `lastModified` · Swagger spec hash · build version where exposed. A matching
fingerprint skips the full re-read of that source; a changed or missing one re-reads that source only
([round-time-contract.md](../../../references/round-time-contract.md) §10). The bug's contract is
still re-counted fresh at Step 2c.

Use Atlassian integration (`getJiraIssue` or equivalent):

- `issueIdOrKey`: `{ISSUE_KEY}`
- Prefer markdown or rendered fields

Capture: environment, test steps, expected/actual results, API endpoint, bug type hints (`[API]`, `[FE]`, admin vs user portal).

**The bug's own details are the PRIMARY verdict source.** Read the bug's description in full and extract its **Expected Result verbatim** — every item, every exact wording. The verdict criterion is:

- **PASSED** only if the retest satisfies **ALL** expected results stated in the bug — every item, character-exact where the bug specifies wording. Partial match = **FAILED**.
- Parent-story AC / Figma are **supplements** for context or when the bug is title-only — they never override or dilute the bug's own expected results. If the bug's expected result and the parent AC conflict, test against the bug's text and flag the conflict to the user.
- **Enumerate the full contract now (coverage gate layers 1–2).** Extract **every** Expected-Result item **and** each bullet of the bug's detail/steps char-exact, give each a stable id (`ER1…`), and map each id 1:1 to a row you will fill in the Step 6 verdict table — so the ALL-items check is a **visible row per id**, not implied. A compound expected ("shows A **and** B") splits into one row per clause; an item with no row is a coverage gap → add it, never drop it. Nothing verified-or-reported may live outside this list, and nothing in it may be silently omitted.

**Task / Story retest — the contract is the AC, and the case list is built rather than inherited.** A
Task has no Expected Result field, so read the ticket **type** first and branch:

| Ticket type | Primary contract | Supplements |
|---|---|---|
| **Bug** | its own Expected Result field, char-exact | parent AC, design node |
| **Task / Story** | its **Acceptance Criteria** (usually in the description — read it there, not from a summary field), char-exact, plus the ticket's stated change | design node, the surface's existing cases, linked bugs |

For a Task, enumerate the AC lines as `AC1…` exactly the way a Bug's `ER1…` items are enumerated
above — same 1:1 mapping to rows, same fail-closed reconciliation. If the Task states no AC and no
verifiable change, it is **BLOCKED with a question to the ticket owner**, never a PASSED (a ticket with
nothing to verify has not been verified — [customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §8).

**Capture the design reference now.** Collect the Figma node link(s) the ticket, its parent, or the
project guide names, and the **build/commit id** the fix landed in. Both go into the Step 6 comment
header (`Design ref:` / `Build:`). Missing design reference → Step 2d.

**If Priority/Severity context is needed** (citing the original bug's Priority, or scoping a newly
observed, distinct defect found during retest) — judge it only by the
[Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md), never invent a
severity/priority notion. Cheat-sheet (full matrix + hard rule at the link):

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

**Viewing a Figma supplement:** when the bug/parent references a Figma design, prefer the **Figma Dev Mode MCP** (`get_screenshot` / `get_metadata`) — needs the Figma desktop app with **Dev Mode MCP Server enabled** (Figma menu → Preferences) and the file open; `node-id` in the URL uses `-`, the MCP `nodeId` uses `:` (`1234-5678` → `1234:5678`). If that server is off, **fall back to the browser-automation MCP**: open the file URL (a logged-in browser session persists auth), let the canvas render, screenshot the node. Dismiss the **"view this file in Dev Mode?"** modal with **"Not now"** — NEVER "Request access". View+Comment access is enough. (Figma stays a **supplement** — it never overrides the bug's own expected results.)

---

## Step 2b — Fix claim vs verification plan (mandatory) [medium freedom]

Follow [retest-fix-intake.md](../../../references/retest-fix-intake.md). Post the retest plan block before executing tests.
**Show the plan, then run** — print it and start execution without waiting for an approval; the plan
rides again in the Step 6d decisions popup, where a correction starts a new round
([round-time-contract.md](../../../references/round-time-contract.md) §2).

---

## Step 2c — Build the retest case list (mandatory — bug and task alike) [medium freedom]

The comment posted at Step 6 must carry a **case list**: the cases this retest actually ran, one row
each. Build it here, before testing, so the run has a defined scope instead of a stopping point.

1. **Start from the contract** — every enumerated `ER*` (bug) / `AC*` (task) id from Step 2. Each id is
   covered by at least one case; a compound id splits into one case per clause.
2. **Add the surface's existing cases.** Identify the surface the fix touched (route · page ·
   component) and pull in the cases the project already has for it. A fix is verified across the
   **whole surface**, not only the line that was reported — a component tested on one screen while the
   defect sat on another screen reusing it is exactly how a defect reached a customer
   ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §1). When the
   project keeps no case catalogue for that surface, derive the cases from the screen itself and say so.
3. **Add the states and widths the design defines** — empty · loading · error · over-limit · disabled,
   and each in-scope screen width (§4 of the same reference). Out-of-scope widths are written
   out-of-scope in the plan, never silently skipped.
4. **Give every case a stable id** (`TC_01`, `TC_02`, …) plus: title · which `ER*`/`AC*` it covers ·
   its design node link (UI cases) · the fixture it needs. A case whose fixture does not exist yet is
   created (Step 4c) or recorded BLOCKED with the missing fixture named — never dropped.
5. **Build the lane plan** ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §2–§4).
   Read the account pool from the project config, group the cases into units (shared record ·
   multi-role · one screen's widths/states · chained precondition · barrier for anything every lane
   sees), and lease **one account per lane**. Parallel is the default — serial needs a named §4
   predicate (e.g. ≤ 2 cases, or one account in total).
6. **Show the case list and the lane plan to the user with the Step 2b plan block, then run** — no
   approval wait. The plan is re-shown in the Step 6d decisions popup, where the user can correct it;
   a correction there starts a new round ([round-time-contract.md](../../../references/round-time-contract.md) §2).

**Round N — scoped round** ([round-time-contract.md](../../../references/round-time-contract.md) §11).
When the ticket was retested before, the agent **proposes** the scope from the fix description: re-run
the cases the fix touches plus every case that failed before, and list every other case under
`Out of scope this round`. The user confirms or corrects that scope in the Step 6d decisions popup.
The case list is still **re-counted against the bug fresh** (Step 2 enumeration), and PASSED evidence
from an earlier round is **never carried forward** — every in-scope case is run and captured again.

The same list, with each case's outcome, goes into the `Case (Role)` cell of every row it covers in the Step 6 comment's single table.

**Go back:** If the Step 6d decisions popup corrects this case list or the round-N scope, return to Step 2c — the correction starts a new round.

---

## Step 2d — Design reference gate (mandatory before any UI verdict) [low freedom]

Follow [figma-design-comparison.md](../../../references/figma-design-comparison.md) §1–§2 and §4.

- **A design node exists and covers the screen** → record the link on the header's `Design ref:` line,
  and compare at Step 4d.
- **Before declaring no design node**, try every route in [no-wait-decision-gate.md](../../../references/no-wait-decision-gate.md) layer 7 (design-tool API with the configured token, browser view, exported image).
- **No design node** (none linked, the link does not cover this screen, or the file is unreachable) →
  **report it back to the person or channel that assigned this retest** — state the ticket, the screen,
  where you looked, and ask for one of: the node link · a written visual contract · an explicit
  "function only, skip visual". Continue every non-visual part of the retest meanwhile; hold the visual
  points at **BLOCKED** with the remark naming who was asked. Never assume a label, an order, or a
  layout, and never let a missing design turn into a PASSED.
- **Unattended / bot mode:** send the same request to the triggering channel with the project's
  @mention, mark the visual points BLOCKED + remark, and carry on — never halt the whole retest, never
  guess.
- **Attended runs apply the same default** — mark the visual points BLOCKED + remark and carry on, and
  **queue the design question** for the Step 6d decisions popup instead of waiting for a reply mid-run
  ([round-time-contract.md](../../../references/round-time-contract.md) §2).

**Go back:** When the node link or visual contract arrives (Step 6d popup), return to Step 4d for the visual points held BLOCKED.

---

## Step 3 — Bug type and comment format (decide once) [medium freedom]

| Bug type | Screenshots | Comment format | API |
|----------|-------------|----------------|-----|
| **API** | No | v3 ADF | `/rest/api/3/.../comment` |
| **FE / UI** | **Required** | **v2 wiki markup** | `/rest/api/2/.../comment` |

Set flag `COMMENT_FORMAT=v2` or `v3` here. **Do not change later** — rewriting between formats wastes time.

### Extra skills

| Need | Use |
|------|-----|
| **Any non-PASSED item — mandatory** | [root-cause-investigation.md](../../../references/root-cause-investigation.md) + the debugging skill it names (`superpowers:systematic-debugging`, Phases 1–3) |
| Retest-specific FAILED vs BLOCKED triage | `references/debug-discipline.md` |
| Real browser UI | Browser automation / DevTools available in the environment |
| Complex multi-case proof | Verification discipline before claiming done |

---

## Steps 4–5 and the result quality gate

Read and follow [execute-and-evidence.md](execute-and-evidence.md) before Step 4 — Step 4 (login and test), Step 5 (evidence) and the result quality gate, end to end.

---

## Steps 6–7 — comment and post

Read and follow [comment-and-post.md](comment-and-post.md) before drafting the comment — Step 6 (draft, guard, approval) and Step 7 (post and syntax gate), end to end.

---

## QA closing (mandatory before "done") [low freedom]

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific. **Run its [cross-ticket conflict check](../../../references/qa-closing-shared.md#cross-ticket-conflict-check) before the Step 6d approval popup** — a conflict found there can change the verdict, so its table is reported in chat and its *Investigate further* / *Close out now* question is **queued into the Step 6d decisions popup** rather than asked after posting ([round-time-contract.md](../../../references/round-time-contract.md) §2–§3); apply its unattended default (step 5) meanwhile. No post, Step 8 transition, or Step 9 notify goes out until that answer is in:

- [ ] Summary line is exactly one of **PASSED ✅** / **FAILED ❌** / **BLOCKED ⛔** / **PWMI ⚠️** (not ambiguous text).
- [ ] **`node tools/retest-guard/retest_guard.js` exited 0** for this round — on the manifest before drafting (Step 6·0) and on the posted body before the transition (Step 8·0; skipped only when a fresh hash compare shows the posted body byte-identical to the guarded draft). Exit 2 (could not run) is not a pass, and the guard's clean result covers the mechanical rules only.
- [ ] **Step 6c independent reviewer round returned CLEAN**, every round was reported to the user as it finished, and the reviewer's findings were verified rather than taken on trust.
- [ ] **Scope is stated only when partial** — a full round prints no Scope line; a partial one prints `CASES: <ids>` with the verdict reading `PASSED (scoped: …)` and an `Out of scope this round:` line naming every item this round did not verify.
- [ ] **AC/EC & bug-detail coverage gate (7-layer) PASSED — `enumerated Step 2 ER* ids == rows carrying a status + evidence (or explicit BLOCKED)`** ([qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *AC/EC & bug-detail coverage*): every Expected-Result item + bug-detail bullet was enumerated char-exact at Step 2, mapped 1:1 to a verdict-table row, verified on its real surface, and appears as its **own row** — none parked only in a remark/note/chat, no PASSED over partial coverage, a differing item is a FAILED/BLOCKED row not a footnote. Fail closed: any item unverified/unrowed/status-less ⇒ retest not complete.
- [ ] **Case list in the posted comment (bug and task alike)** — every Step 2c case appears in the `Case (Role)` cell of each row it covers, in the one table (no separate case table); `Case coverage: {n}/{total}` reconciles; the surface's existing cases were pulled in, not just the ticket's own lines ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §1).
- [ ] **Design (Figma) comparison ran for every UI case** ([figma-design-comparison.md](../../../references/figma-design-comparison.md)): node link recorded per case, five points compared (present · char-exact text · order/position · states · no overflow/overlap measured); a screen with **no** design reference was reported back to the assigning person/channel and its visual points left **BLOCKED**, never PASSED; a screen this ticket intentionally changed was reported as **design out of date** (owner named) rather than filed as a defect; a mid-test AC revision is spelled out in the verdict line as an accepted limitation.
- [ ] **Depth gates green** ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md)): values checked against their source (not just present) · every in-scope width run with overflow/overlap **measured** · fixture large enough to overflow/scroll · build id recorded · no `caveat/not verifiable/assumed` row carrying a passing status · anything wrong that was seen is reported even where no expected asked for it.
- [ ] `Verdict: PASSED` or `Verdict: FAILED` with issue link.
- [ ] **Non-PASSED verdict:** Step 6a's two blocks present — **root cause** (Confirmed/Suspected/Unknown + backing artifacts) and **resolution options** (two options, each a named **role** owner, ending `Decided by: <role>`) — plus the one-line statement of whether the originally reported symptom is gone. (No separate repro-matrix / why-failed block — that content lives in the `Fixture` line and the verdict-table row + its `Evidence` MP4 / screenshot.)
- [ ] **Step 4h root-cause investigation ran for every non-PASSED item** (including BLOCKED): the cause cites captured artifacts (status code, response field/message, console error, bundle probe, fixture read-back) and is labelled `Confirmed` / `Suspected` (+ the confirming check) / `Unknown — not investigated` (+ what is needed).
- [ ] **Step 4i challenge gate ran for every non-PASSED item** ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)): the expected side re-verified char-exact against an authoritative source **including related/linked tickets' AC/EC**; a wrong/superseded expected became an expected/TC adjustment (not a FAILED), an unclear/hedged spec became BLOCKED + a who-to-ask remark (not a bug), and every surviving non-PASS was surfaced to the user in chat (recommendation A/B/C) before the comment was drafted.
- [ ] **Step 6b dev-question gate + cause gate passed before the first post**; every scope word traces to a verdict-table row + its `Evidence`; every cause sentence cites an artifact and carries a label; no hedge word used as a cause; no unresolved contradiction between your own observations.
- [ ] v2/v3 format matches Step 3 lock; FE bugs have the per-case MP4 (and text-verification screenshots) attached before wiki embed, every MP4 green on the 7-layer quality+correctness gate.
- [ ] API cases: full cURL + response per row (no "same as above").
- [ ] Jira issue re-opened after post: comment visible, not truncated.
- [ ] Step 7d fix-verify completed.
- [ ] **Cross-ticket conflict check ran before the Step 6d approval popup** ([qa-closing-shared.md](../../../references/qa-closing-shared.md#cross-ticket-conflict-check)): the whole project searched with every layer's query + hit count recorded, candidates opened (fields + every comment), the table posted in chat with a clickable link per ticket, and the user answered *Investigate further* / *Close out now* in the Step 6d decisions popup before the post, any transition, or notify.
- [ ] **Round report ends with the `Round time:` line** (Step 8e), measured from session timestamps ([round-time-contract.md](../../../references/round-time-contract.md) §1), and `references/helix-handoff-{KEY}.md` written for this round (§10).
- [ ] **Step 8·0 format-completeness gate passed BEFORE any transition** — FE bug: screenshots embedded inline + render-verified; API bug: full cURL/response per row.
- [ ] Bug landed in Done → **Step 8d** run: stories it blocked either moved to ready-for-QA or left with their remaining blockers reported.
- [ ] Step 9 QA notify sent if the project configures a channel (retest verdict + Jira comment link + @mention) — **sent regardless of who invoked the retest** (owner, another QA, slash command, bot/trigger) and regardless of whether they asked for one.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (Retest section).

**Go back:** If any item above is unchecked, return to the step it names and redo from there; do not report done.

---

## Steps 8–10 — close out, notify, follow-up questions

Read and follow [closeout-and-notify.md](closeout-and-notify.md) after the post — Step 8 (close out), Step 9 (QA result notify) and Step 10 (a question after the post), end to end.

---

## Skill composition

| Situation | See |
|-----------|-----|
| Design comparison / no Figma for a screen | [figma-design-comparison.md](../../../references/figma-design-comparison.md) |
| Depth gates from the shipped-defect review | [customer-escape-prevention.md](../../../references/customer-escape-prevention.md) |
| Default parallel execution — lanes, one account per lane, merge | [parallel-test-lanes.md](../../../references/parallel-test-lanes.md) |
| Still failing | `references/debug-discipline.md` |
| Encoding / v2 issues | `references/gotchas.md` |
| Session handoff | `references/handoff-template.md` |
| Lessons learned | `references/post-mortem-template.md` |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## Out of scope

- TC prep, full ticket Playwright, filing new bugs — see [skill-routing.md](../../../references/skill-routing.md)

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST read project config before testing | No hardcoded env URLs |
| MUST run the case list in parallel lanes, one leased account per lane, unless a [parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §4 predicate is named | Shortest retest time with no shared login — a shared account ends sessions and shares state, producing false defects |
| NEVER open a browser or login window for a test account (main thread or lane) — a lane returns `SESSION-DEAD`; the main thread gives ready-to-run commands, one combined `bash` block per step (relink every needed account → setup/mint only the FAILED ones; each account isolated, prints OK / FAILED with a log path), then probes ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §3) | Login windows popped a chain of windows at the person; owner order 2026-10-21: login by command, as in the e2e suite |
| MUST include full cURL/response per API case | Evidence must stand alone |
| MUST treat Swagger (+ error docs) over stale ticket text | Ticket may be wrong |
| MUST use exactly one of **PASSED ✅** / **FAILED ❌** / **BLOCKED ⛔** / **PWMI ⚠️** in the summary line — the round's real verdict; a round nobody could reach reads BLOCKED, never FAILED | Scanability for dev/QA; a coverage gap is not a defect (`SUMMARY_VERDICTS` in `retest_rules.js`) |
| MUST keep a PASSED comment inside the Step 6 template fields only — no narrative padding, one-line evidence captions | A tight comment is scannable in seconds; prose bloat buries the verdict (locked from OLS-251 accepted format 2026-07-23) |
| MUST give every table column an explicit English header; row-number column = `No.` | bare `#` renders as a blank header cell in Jira |
| MUST head the single FE table exactly `No.` · `ER` (Task: `AC`) · `Case (Role)` · `Expected Result` · `Actual Result` · `Evidence` · `Status` (API bug: drop `Evidence`) — never `Expected result item`, never a bare `Actual` | the middle columns carry the ticket's own field names so a reader lines the comment up with no translation, and `Evidence` holds each row's screenshot in-cell (user correction 2026-07-24 OLS-250/249; Evidence column added 2026-07-27, OLS-289; one table with `ER` and `Case (Role)` ordered by the owner 2026-09-24) |
| MUST bold every table header cell (`\| **No.** \| **Test Case** \| …`) | Jira doesn't auto-bold markdown headers; non-bold looks unprofessional |
| MUST compare actual text against expected (customfield_12116) character-by-character when expected specifies exact wording | Any text difference = FAIL — no "minor wording" or "cosmetic" exceptions |
| MUST lock v2/v3 at Step 3; FE → v2 + screenshots | Rewrites waste time |
| MUST verify Jira UI after post (Step 7d) before Step 8 | Truncation / wrong endpoint |
| MUST pass the Step 8·0 format-completeness gate before ANY status transition — FE bug requires a screenshot in each row's `Evidence` cell (`!file.png!`, pre-resized, no `\|width`) **and** render-verified; a text-only FE comment fails the gate | Transitioning on an evidence-incomplete comment silently hides the gap (learned OLS-181: FE bug moved to Done with a text-only comment) |
| MUST NOT offer the user a "skip screenshots / text-only" option for an FE bug — screenshots are mandatory, not optional; if upload is blocked, STOP and resolve, don't bypass | Offering to skip a mandatory step is how the gate got bypassed (OLS-181) |
| MUST run Step 8 after successful post unless user stopped you | Workflow closure |
| MUST run Step 8d as soon as the bug lands in Done — Done = fixed = the stories it blocked may be releasable | Otherwise blocked stories sit in the backlog after their blocker is already closed |
| MUST check EVERY "is blocked by" link on a story before moving it in Step 8d, treat only **Done** as resolved, and move only stories parked in the blocked status | This bug is often not the story's only blocker; moving a still-blocked story sends untestable work back to QA, and touching a story already in QA/dev moves it backwards |
| MUST create test data when possible | "No data" is not an excuse |
| MUST perform the action under test through its real surface (UI bug → through the UI, every Test Step); API only for test-data/precondition prep, and for an API-layer bug the API call is the real step | [test-through-real-steps.md](../../../references/test-through-real-steps.md) — an API shortcut for a UI action verifies the wrong layer and can pass while the screen is broken |
| MUST NOT change COMMENT_FORMAT after Step 3 | v2/v3 rewrite cost |
| MUST take transition names/ids, notify-helper flags, app URL shapes and UI-automation quirks from the workspace's project guide — never from a value written in this skill | Workflows, tooling and UI differ per project; a value hardcoded here transitions the wrong ticket somewhere else (portable-content.md) |
| MUST NOT include local file paths in Jira comments (`docs/result/`, absolute home/machine paths, etc.) | Meaningless to Jira readers; user enforced "เน้นๆๆ ห้ามผิดอีก" |
| MUST scan Jira comment for local paths before posting | Catches leaks: `docs/`, `~/`, absolute paths |
| MUST `--dry-run` Discord notify before real send | Catches format errors before they go live |
| MUST fetch the notify recipient from the ticket's QA Owner field (per project guide) per ticket, and verify the @mention person = that field's value — NEVER the Reporter, never a name carried over from another ticket | Label said "QA Owner" but pinged the Reporter → 3 wrong pings, user correction 2026-07-15 |
| MUST verdict from the bug's OWN expected results — PASSED only when ALL items are met (character-exact where wording is specified); parent AC is supplement, never substitute | Bug details are the contract; partial match = FAILED (user rule 2026-07-15) |
| MUST enumerate **every** Expected-Result item + bug-detail bullet char-exact at Step 2, map each `ER*` id 1:1 to a verdict-table row, and reconcile `enumerated ids == rowed-and-statused rows` (`{n}/{total}` coverage, `{n}=={total}`) before Step 6 / 8·0 (7-layer coverage gate in [qa-evidence-gates.md](../../../references/qa-evidence-gates.md)) | The retest scope is the bug's own contract; an unenumerated or unmapped item is silently unverified |
| MUST record **every** expected-result/detail result as its own verdict-table row — NEVER park an untested/failing item in a remark, a note under the table, or chat while the verdict reads PASSED | Coverage is proven by rows, not prose beside them; a footnoted gap reads as a clean pass downstream |
| MUST NOT post PASSED on partial coverage — an item **observed to differ** is a FAILED row (severity per the matrix); an **unverified/unreachable** item is a BLOCKED row (a coverage gap, never a product FAILED); neither is a PASS and neither is dropped | "Fixed except one point" hidden as a caveat is misread as a full pass; and calling a merely-unverified item FAILED contradicts "a coverage gap is not a defect" |
| MUST NOT transition, notify, or report "done" while any enumerated item lacks a rowed status (coverage gate fail-closed) | Partial coverage is a stop condition; a green verdict over an incomplete table looks finished but is not |
| MUST judge any Priority/Severity referenced in a retest comment ONLY from the [Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md) — never invent a severity notion | Keeps bug-priority language consistent across QA workflows; no ad hoc severity claims in Jira comments |
| MUST exercise **every** entry point to a failing surface separately (direct route **and** the in-app path a user takes) and capture each with its own screenshot in the `Evidence` cell; name the entry point(s) actually exercised in the `Fixture` line, and never claim a path you did not run | A path with no captured screenshot is a guess. OLS-108: "happens via both entry points" was published from one run, the dev acted on it, and it had to be retracted in-ticket |
| MUST NOT write a scope word (`always`, `any entry point`, `both ways`, `only when …`) that no exercised-and-captured `Evidence` row supports | The scope claim is the first thing a dev builds on |
| MUST hard-reload every surface after a state-changing fixture step before observing or capturing it; report a stale-data window only as a separate timing note with the measured delay | An already-open view holds pre-change data — recording it publishes your test timing as product behavior (OLS-108: card looked clickable ~5s after unpublish) |
| MUST resolve any disagreement between your own observations with one clean re-run before drafting, and record which was the artifact; unresolvable → BLOCKED, not FAILED | Resolving it in favour of the verdict you already reached is how the wrong repro path shipped |
| MUST include the Step 6a blocks on every non-PASSED comment — **root cause** and **resolution options** (two options, each a named **role** owner, ending `Decided by: <role>`); NO separate repro-matrix / why-failed block (that content is the `Fixture` line + the verdict-table row and its `Evidence` screenshot) | These answer the dev's next questions without bloating the comment; the failing behaviour + evidence already sit in the table row |
| MUST run the Step 4h root-cause investigation for EVERY non-PASSED item (FAILED and BLOCKED alike), starting by invoking `superpowers:systematic-debugging` (Phases 1–3) and naming it in the comment | Improvised reasoning is where guessing enters; the process is also faster than guess-and-check |
| MUST run the Step 4i challenge gate for EVERY non-PASSED item — re-verify the expected side char-exact against an authoritative source **including related/linked tickets' AC/EC**, then surface expected-vs-observed + the AC/EC finding + a recommendation (adjust expected/TC / re-test / confirm defect — the last only while the bug's ER is not superseded) to the user in chat before drafting the comment ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)) | A non-PASS against a stale, superseded, or misread expected is a phantom FAILED; the expected side must be earned, and adjusting a spec or re-testing is the user's call (PM-006) |
| MUST NOT post a FAILED whose expected turned out wrong, superseded, or unclear — that is an expected/TC adjustment or a BLOCKED question, never a FAILED; unattended bots resolve it as BLOCKED + remark, never a phantom bug and never a halt | Filing the app against an unverified expected is exactly how a phantom bug ships (PM-006, OLS-315) |
| MUST complete the 8-boundary sweep while the environment is still open, writing `not checked` where a boundary was not reached | A boundary not captured during the run cannot be reconstructed later — reconstruction is fabrication |
| MUST attach a captured artifact to every cause statement and label it `Confirmed` / `Suspected` / `Unknown — not investigated`, carrying the label wherever the sentence is copied (comment, sheet, notify) | A `Suspected` cause read as `Confirmed` sends a developer to the wrong layer |
| MUST NOT use a hedge (`probably`, `น่าจะ`, `seems`, `flaky`, `cache issue`, `environment issue`) as a cause, restate the symptom as the cause, or infer a cause from a different record/role/run/entry point | Hedged guessing is still guessing, and it ships as QA's finding |
| MUST NOT patch product code while investigating — QA hands off the isolated boundary + evidence | Fixing the product is the dev's call, not QA's |
| MUST state in one line whether the originally reported symptom is gone, even when the verdict is FAILED on a different deviation | "FAILED" alone reads as "the fix did not work" |
| MUST NOT edit the ticket's expected-result field to match observed behavior — name the decision owner instead | The spec owner decides; QA reports the conflict |
| MUST pass the Step 6b dev-question gate before the FIRST post — never "post now, explain in chat" | The gate exists so the answers land in the comment, not in a round-trip that ends in an edited comment (OLS-108) |
| MUST re-verify (re-run the surface) before answering any question that arrives after posting, then fold the answer into the original comment in place and re-run Step 7d | Answering from memory published a wrong claim once already |
| MUST correct a wrong published statement **visibly in both places** — in-place comment edit naming the corrected claim **and** a follow-up in the thread where the wrong answer was given | People already replied to the wrong version; a silent edit makes the thread unreadable |
| MUST send the Step 9 notify on every retest a configured channel covers — whoever invoked the skill (owner, another QA, slash command, unattended bot), asked for it or not | The notify is how the QA owner learns the verdict; tying it to who started the run means retests run by anyone else close silently |
| MUST run the Step 9 pre-notify review gate (5 checks on dry-run output) before EVERY send, including resends | Catches wrong recipient/link/counts before they go live (user rule 2026-07-15) |
| MUST embed each FE screenshot in its verdict-table `Evidence` cell as `!file.png!` — pre-resized (~600–640 px), **no `\|width=…`** (the pipe splits the table row) — never leave as filename-only text | Screenshots must render as pictures inside the cell; a `\|width` param breaks the row, and filename text is unreadable evidence (OLS-289, 2026-07-27) |
| MUST retest a **Task / Story** against its Acceptance Criteria (read where the AC actually lives, usually the description) with the same enumerate→row→reconcile discipline a Bug's Expected Result gets; a ticket stating no verifiable AC is BLOCKED + a question to the owner, never PASSED | A task retest with no written contract is an unverified pass; "nothing to check" is not a check |
| MUST post the **case list** inside the retest comment's one table: No. · ER · Case (Role) · Expected Result · Actual Result · Evidence · Status — **never a separate case table, never a design-node column**; the design reference lives on the header's `Design ref:` line — for **both** bug and task retests, reconciled against the Step 2c list and the `ER*`/`AC*` ids | A result that never becomes a case row is never re-run; three customer escapes came through results that lived only as comment prose |
| MUST scope the retest to the **whole surface** the fix touched (its existing cases + the states and in-scope widths the design defines), not only the reported line | A component was retested on one screen while the defect sat on another screen reusing it — the customer found it |
| MUST compare every UI case against its **design node** on all five points and record the node link on the header's `Design ref:` line — never as a per-row column | An all-present, mis-ordered screen passes a "shows A, B, C" expected; `figma` appeared zero times in the set that shipped the escapes |
| MUST report a missing design reference back to the person/channel that assigned the retest and hold those visual points **BLOCKED** — never assume a label, order, or layout, never PASSED | An assumed expected is not a spec; it produces both phantom bugs and false passes (PM-006) |
| MUST report a screen this ticket intentionally changed as **design out of date** (name the design owner, ask for the node update in this ticket) instead of filing it as a defect | A relocated menu was reported missing when it existed in a submenu — a full round lost |
| MUST spell out a mid-test AC revision in the verdict line (`PASSED against AC as revised {date}, differs from design in {…}`) and hand the difference to the known-limitation list | A silent PASSED on a revised AC shipped the review's only High-severity escape |
| MUST NOT record a passing status on a row whose actual result contains `caveat` / `not verifiable` / `assumed` / `ยืนยันไม่ได้` / `ตรวจไม่ได้` — it is BLOCKED, or PWMI with a bug raised | We shipped a PASSED whose own text said it could not be verified, and that was exactly the customer's bug |
| MUST measure overflow (`rect.right > innerWidth`, `scrollWidth > innerWidth`) and overlap (>3 px intersection) at every in-scope width rather than judging by eye | Seven escapes were on widths nobody ran; the measurements caught them the moment they were run |
| MUST verify each displayed value against its source and report anything wrong that is seen, even when no expected asked for it | "Elements render correctly" was written while the defect was on screen and unremarked |
| MUST retest on a fixture able to fail (long titles, lists past their visible slots, populated accounts) and record the **build id** the fix landed in | One course with one media item can never overflow, wrap, or scroll; and a pass against a build nobody ships is not a pass |
| MUST run the cross-ticket conflict check ([qa-closing-shared.md](../../../references/qa-closing-shared.md#cross-ticket-conflict-check)) before the Step 6d approval popup — whole project, every type and status (Done included), a chat table with a clickable link per ticket, then queue *Investigate further* / *Close out now* into the Step 6d decisions popup; no post, transition, or notify before the answer | Another ticket in the same project can contradict, supersede, or duplicate what was just verified; a check limited to the tested ticket never sees it |
| MUST NOT wait mid-run — the scope plan is shown then run, and every non-PASS (A/B/C), missing design, and cross-ticket conflict gets its documented default and is **queued** for the Step 6d decisions popup ([round-time-contract.md](../../../references/round-time-contract.md) §2) | Each mid-run wait stalls the whole round on a human; the defaults keep evidence honest while the question waits |
| MUST ask for every outward action through **one** Step 6d approval popup that lists each by name — comment, each transition, each assign, each linked story to unblock, each notify, each external result update — then execute with no second approval (§3) | One human touch per round; an action not named in the bundle was never approved |
| MUST end every round report with `Round time: AGENT+EXEC {n} min · human wait {h} min · overrun {max(0, n-15)} min`, measured from session timestamps, never estimated (§1) | The 15-minute cap is only real if each round is measured against it |
