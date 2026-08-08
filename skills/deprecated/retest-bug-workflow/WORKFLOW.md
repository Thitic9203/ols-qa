---
name: retest-bug-workflow
description: |
  Retest a Jira bug after a dev fix — read ticket, test API or UI, compare Swagger, draft evidence, post comment (with approval), transition and assign back to dev.
  Use when the user says retest bug, verify fix, check if an issue is fixed, /retest-bug, or Retest bug from Helix.
  Do NOT use for writing new FE/API test case tables (tc-fe-prep / tc-api-prep), full ticket Playwright runs (testing-ticket-workflow), or opening new bugs (create-bug-workflow).
---

# Retest bug workflow

End-to-end retest from a Jira bug ticket: fetch ticket → test → compare Swagger → draft comment → post (after approval) → transition → assign back to dev.

**Project-agnostic:** Load URLs, credentials, and transitions from `references/*-retest-guide.md` in the user's workspace.

## Discipline

**Settle and strategize FIRST** — before Step 0 or any tool call, follow
[settle-and-strategize.md](../../../references/settle-and-strategize.md): invoke
**`engineering:testing-strategy`** to plan the retest approach, then hold to the discipline it names —
no guessing an expected/spec, and no blind retry loops (a repeat failure = stop and diagnose).

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Jira bodies** (after approval): neutral English — no "Retested by:", no honorifics. If reproduction is unclear or results conflict with dev claims, follow [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) before posting PASSED/FAILED.

**Root cause is mandatory, never inferred.** Every item that is not a clean PASSED gets a full
investigation per [root-cause-investigation.md](../../../references/root-cause-investigation.md) —
run at **Step 4g**, before the draft exists. That reference also governs every sentence in this
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
turns a correct app into a phantom FAILED. Run this at **Step 4h**, then **surface it to the user in
chat** so they can decide whether to adjust the expected/TC, re-test, or confirm the defect. Full gate:
[non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md).

**Test through the real steps.** Drive the behaviour under verification through its own surface,
following the ticket's Test Steps completely — a UI bug through the UI (click, fill, submit), never a
direct API call to perform the tested action. The API is allowed **only** to prepare the case's test
data / precondition (Step 4c). For an **API-layer** bug the API call in Step 4d *is* the real step,
not a shortcut. Full rule: [test-through-real-steps.md](../../../references/test-through-real-steps.md).

Use plain chat for URLs/credentials; AskUserQuestion only for choices (e.g. approve comment).

## Refusal-first (precondition gate)

MUST refuse to start Step 2 until the user provides a **Jira bug key or browse URL** — because retest scope is one issue.

MUST refuse to run tests without **reachable environment config** (workspace `*-retest-guide.md` or answers from [project-config-template.md](references/project-config-template.md)) — because URLs and credentials must not be hardcoded in the skill.

On first response after constraints, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Retest bug**, then show [intake-one-pager.md](../../../references/intake-one-pager.md) (Retest section).

---

## Step 0 — Get the ticket

If no key or URL was provided:

> Which Jira bug should I retest? Share the issue key or browse URL.

**Wait for an answer.** Extract `{ISSUE_KEY}` and `{JIRA_DOMAIN}` from the link.

---

## Step 1 — Project config

### 1a. Find existing config

In the **workspace** `references/` folder, find `*-retest-guide.md`. If present → read → go to 1c.

### 1b. Interactive setup (first time)

Ask **one question at a time** using `references/project-config-template.md` sections:

- Jira domain, ticket prefix
- Environments + base URLs + Swagger paths
- Portals, login URLs, login method
- Test credentials (never commit production secrets)
- Optional error docs, transitions, gotchas

Write `references/{project}-retest-guide.md` in the user's repo and tell them where it was saved.

### 1c. Use config only

All URLs, credentials, transition names, and Swagger URLs come from config — **no hardcoded project values in this skill**.

---

## Step 2 — Fetch Jira ticket

Use Atlassian integration (`getJiraIssue` or equivalent):

- `issueIdOrKey`: `{ISSUE_KEY}`
- Prefer markdown or rendered fields

Capture: environment, test steps, expected/actual results, API endpoint, bug type hints (`[API]`, `[FE]`, admin vs user portal).

**The bug's own details are the PRIMARY verdict source.** Read the bug's description in full and extract its **Expected Result verbatim** — every item, every exact wording. The verdict criterion is:

- **PASSED** only if the retest satisfies **ALL** expected results stated in the bug — every item, character-exact where the bug specifies wording. Partial match = **FAILED**.
- Parent-story AC / Figma are **supplements** for context or when the bug is title-only — they never override or dilute the bug's own expected results. If the bug's expected result and the parent AC conflict, test against the bug's text and flag the conflict to the user.
- List each expected-result item as its own row in the result table (Step 6) so the ALL-items check is visible, not implied.

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

## Step 2b — Fix claim vs verification plan (mandatory)

Follow [retest-fix-intake.md](../../../references/retest-fix-intake.md). Post the retest plan block before executing tests.

---

## Step 3 — Bug type and comment format (decide once)

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

## Step 4 — Login and test

### 4a. Environment

From config: base URL, portal, login URL for the env on the ticket.

### 4b. Login

Use browser automation: navigate to login URL, fill credentials from config (or env vars the user provides). OTP/SSO per config. If blocked → ask user for a bearer token.

### 4c. Test data

**Never stop with "no data to test."** Try in order:

1. Use existing records (list APIs).
2. Create data via API (POST) with clear test naming.
3. Clone and modify an existing record.
4. Ask the user only for data you cannot synthesize.

Do not modify unrelated production records; record IDs you create.

**This is setup only — the boundary is strict.** Creating data via API is allowed to reach a case's
**precondition**. The **action under test** is never performed via API: run it through the ticket's
real Test Steps (UI bug → through the UI). For an API-layer bug, the API call in Step 4d *is* the real
step. See [test-through-real-steps.md](../../../references/test-through-real-steps.md).

### 4d. API testing

Use `fetch` with **full URLs**. Patterns: baseline, bug case from ticket, edge cases if relevant.

### 4e. Swagger comparison

Load OpenAPI/Swagger from config URL.

| Check | Result |
|-------|--------|
| Code matches Swagger | Continue |
| Code mismatch | FAILED |
| Code OK, message mismatch vs error docs | FAILED |
| Swagger + docs silent | BLOCKED |

Swagger is source of truth — not stale ticket text alone.

### 4f. Entry-point coverage + settle + contradiction gate (mandatory for every non-PASSED item)

Follow [defect-report-completeness.md](../../../references/defect-report-completeness.md) §2–§3. Three things happen **during the run**, not while drafting — you cannot reconstruct them later:

1. **Exercise every entry point, one at a time.** For a UI defect that means at minimum: the direct URL/route **and** the in-app path a real user takes to the same surface (list card, menu, CTA, deep link). Capture a separate screenshot per entry point (each becomes an `Evidence`-cell image), and name the exercised paths in the `Fixture` line; a path you did not exercise is **never inferred from another path** — don't claim it.
2. **Settle after every state change.** After a fixture step that changes server state (publish / unpublish / approve / delete / role change), hard-reload each surface before observing it. A view that was already open holds pre-change data; recording it is reporting your own test timing as the product's behavior. A stale window worth reporting is a **separate timing note** with the measured delay — not a verdict row.
3. **Resolve contradictions before drafting.** If two of your observations of the same surface disagree, name the contradiction, re-run that surface cleanly, and record which observation was the artifact and why. Never resolve it in favour of the verdict you already have. Unresolvable after a clean re-run → that item is **BLOCKED**, not FAILED.

### 4g. Root-cause investigation (mandatory for every non-PASSED item — run it before Step 6)

Follow [root-cause-investigation.md](../../../references/root-cause-investigation.md) end to end.
The whole investigation happens **while the environment is still open** — a boundary you did not
capture during the run cannot be reconstructed while drafting, and reconstructing it is guessing.

1. **Invoke the debugging skill and announce it** — `superpowers:systematic-debugging` first
   (fallbacks in §0 of the reference). Follow its Phases 1–3; skip Phase 4 (QA does not patch
   product code). Record the skill name in the investigation block.
2. **Complete the 8-boundary evidence sweep** (§1): surface · console · network request+response ·
   auth/session/role · server-side truth via a direct API call · **is the behaviour even in the
   deployed build** (grep the bundle for the feature's own strings/route/param; probe the endpoint)
   · fixture state read back from the API · environment (env, build id, flag, VPN). Every boundary
   ends as an artifact or the literal words `not checked` — never blank, never a guess. Do not stop
   at the first anomaly; it is often downstream of the real one.
3. **Compare against something that works** (§2) — the same action on another record, role, entry
   point, environment, or a sibling feature that shares the endpoint. List every difference.
4. **One falsifiable hypothesis at a time** (§3), each killed or confirmed by the single smallest
   check. Keep falsified hypotheses in the record with their artifacts.
5. **Label the result** (§4): `Confirmed` · `Suspected` (+ the exact check that would confirm it and
   why it was not run) · `Unknown — not investigated` (+ what is needed and from whom). A hedge word
   (`probably`, `น่าจะ`, `flaky`, `cache issue`, `environment issue`) is never a cause.

The investigation block goes **into the comment** at Step 6a — not only into chat.

**BLOCKED is not an escape from this step.** A BLOCKED item still records the sweep up to the
boundary that blocked it, and names the access/person needed to continue.

### 4h. Challenge the non-PASS + surface it to the user (mandatory for every non-PASSED item — before Step 6)

Follow [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md) end to end, **before
the draft exists.** A non-PASS is a hypothesis until it survives this:

1. **Name the discrepancy** — `Expected: {X} (source) · Observed: {Y} (evidence)`. If you cannot name
   the source of the expected value, stop — you are about to file the app against an assumption.
2. **Re-verify the expected side against an authoritative source, including related tickets' AC/EC** —
   the bug's own Expected Result stays the primary contract (Step 2), but read it **char-exact** and
   cross-check the **parent story's AC/EC, every linked issue, and sibling tickets on the same surface**.
   A related ticket may have **superseded** or **clarified** the expected; a transliteration/feature-name
   is not the spec; an unconfirmed-spec hedge ("confirm with PO/Figma", "น่าจะ", "TBD") = a **question,
   not a defect**.
   - Expected wrong / superseded → **not a FAILED** → recommend adjusting the expected/TC, cite the ticket.
   - Expected unclear / conflicting / hedged → **BLOCKED + a remark naming who to ask**, never a FAILED.
   - Expected confirmed authoritative and the app still differs → it survived; carry it to Step 6.
3. **Surface to the user in chat and let them steer** — post `expected (+source) · observed · AC/EC
   finding · recommendation (A adjust the expected/TC · B re-test · C confirm defect)`. For A/B **wait for
   the user's decision**; for a clearly-confirmed C you may continue, but never silently. Never edit the
   ticket's expected-result field to match the app on your own — QA reports the conflict and names the owner.

**Unattended / bot mode:** resolve the gate instead of asking — expected wrong/unclear → BLOCKED +
remark (no bug, no halt); test-side cause → fix and re-run; confirmed defect → draft the comment as normal.

---

## Step 5 — Evidence

### API bugs

- Full cURL (method, URL, headers, body) per case — no "same as above"
- Full response (status, headers, body)
- Swagger link for the endpoint
- Dates in headers as YYYY-MM-DD

### FE bugs

**Whole-flow MP4 per case — same capture format as the story-testing flow — attached to the Jira issue and referenced in the comment (NOT Google Drive).**

- **Record a whole-flow MP4 for every executed case** (drive the case's real steps end-to-end, same capture the story-testing flow uses). The MP4 is the retest evidence — it replaces the former screenshot-only rule. Every clip MUST clear the **[MP4 7-layer quality + correctness gate](../../../references/qa-evidence-gates.md)** (max resolution the harness supports; the flow reaches the stated target — "scroll to menu XX" must actually arrive, never cut early; the Expected Result is visible on screen) — fail-closed: a blurry / skipped / early-cut clip = re-capture, the case is not done.
- **Text-verification case → screenshot AS WELL as the MP4.** When a case verifies exact wording / label / message / count / displayed values (anything judged char-exact against the bug's Expected Result), also embed a still screenshot inline so the exact text is legible in a frame — the row then carries **both** the MP4 link and the `!png!` image. A non-text case carries the MP4 only.
- **Destination = the Jira issue, in the comment.** Upload every file (MP4 + any screenshot) as an **issue attachment**, then reference it in the verdict table's `Evidence` cell (the column between `Actual Result` and `Status`). A retest never writes to Google Drive — that is the story/bot flow, not this one.
- **Naming (reuse the story convention):** `{KEY}_TC_{nn}.mp4` for the clip, `TC_{nn}-ER_{n}.png` for a text still.
- Max ~3 bullets per case in the comment.
- **In-cell embedding (mandatory):**
  - **MP4** → attach, then link it in the `Evidence` cell as a wiki attachment link `[▶ {KEY}_TC_{nn}.mp4|^{KEY}_TC_{nn}.mp4]` (an MP4 cannot render as an inline picture in a wiki cell — a working attachment link that plays/downloads from Jira is the requirement).
  - **screenshot** (text-verification rows) → reference as `!filename.png!` with **no `|width=…` parameter**. Inside a wiki table cell the `|` in `!img|width=N!` collides with the cell delimiter and splits the row, so resize the image **before** upload (~600–640 px wide) and embed it bare. It MUST render as a picture inside the cell — never filename-only text.

**Upload + embed flow:**
1. Save the MP4 (and any text-verification screenshot, resized to ~600–640 px wide via `sips -Z 640 in.png --out out.png`) to a scratch dir outside the repo.
2. Upload each file: `POST /rest/api/3/issue/{KEY}/attachments` with `X-Atlassian-Token: no-check` (curl `-u email:token`, or authenticated browser fetch).
3. In the `Evidence` cell of the verdict table: the MP4 link `[▶ …mp4|^…mp4]`, plus `!filename.png!` on text-verification rows — one case per row.

---

## Step 6 — Draft Jira comment

**Do not post until the user approves** (unless they explicitly waive approval).

**Draft in the syntax of the endpoint chosen at Step 3 — never in markdown "and convert later".**
Markdown and Jira wiki markup are different languages that share characters, so a markdown draft
posted to `/rest/api/2/` does not error — it renders as visible garbage (`**x**` → `*<b>x</b>*`).
Pick the template below that matches `COMMENT_FORMAT`; syntax map and gates in
[jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md).

**Template core — v2 wiki markup** (`/rest/api/2/…`; FE bugs, anything with screenshots):

```text
*Retest Result: PASSED* ✅   (or *Retest Result: FAILED* ❌)

*Env:* {ENV} ({url})
*API:* {METHOD} {path}   (if API bug)
*Swagger:* {link}
*Date:* {YYYY-MM-DD}
*Fixture:* {what was used, and whether it was restored}

----

*Test Step (from ticket):* …
*Expected Result (from ticket, verbatim):* …

||*No.*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||
|1|{item quoted from the ticket}|{observed}|!tc1.png!|✅/❌|

*Expected-result coverage:* {n} / {total} items met
```

The **`Evidence` column** (between `Actual Result` and `Status`) holds the case's screenshot **in the
cell** — `!file.png!`, pre-resized, **no `|width=…`** (the pipe breaks the row). One image per row,
for PASSED and FAILED alike. **API bugs have no screenshots** → drop the `Evidence` column
(`||*No.*||*Expected Result*||*Actual Result*||*Status*||`) and put the full cURL + response for each
case in a separate `*Evidence*` section below the table instead (a cURL block does not fit in a cell).

**Template core — markdown/ADF** (MCP `addCommentToJiraIssue` or `/rest/api/3/…`): identical
content, but `**bold**`, `---`, and a `| col | col |` table with a `|---|` divider row.

Never mix the two in one body.

**Verbosity ceiling:** a PASSED comment stays inside the template above — no added narrative
paragraphs, no restating the ticket, no "why this matters" prose. Each field line holds only its
value. FE screenshots go **in the `Evidence` cell** — the `Actual Result` cell already describes what
the image shows, so no separate caption line is needed. If a field doesn't apply (e.g.
**API**/**Swagger** on an FE bug), omit the line entirely rather than writing "N/A".

### 6a. Extra sections REQUIRED when the verdict is FAILED or BLOCKED

A PASSED comment stops at the template above. **A FAILED / BLOCKED comment adds exactly these two
blocks**, in this order (the failing behaviour itself already lives in the `Actual Result` cell + its
`Evidence` screenshot, so it is not repeated as a separate prose block):

| Block | Content | Answers |
|-------|---------|---------|
| **Root cause** | the Step 4g investigation, condensed: one-sentence cause + a `Confirmed`/`Suspected`/`Unknown — not investigated` label, and the captured artifacts that back it (status code, response field/message, console error, bundle probe, fixture read-back). | "why does it happen, which layer do I open, and how sure are you?" |
| **Resolution options** | the two mutually exclusive outcomes with a named **role** owner each (role only, never a person's name) — spec owner updates the expected result (no code change) **or** dev changes `{exact route/surface}` and leaves `{what already passes}` alone; end with `Decided by: <role>` | "do I change code or do you change the ticket, and who decides?" |

Also state plainly, in one line, whether the **originally reported symptom is gone** — a FAILED verdict on a
different deviation is routinely misread as "the fix didn't work".

**Do not add** a separate `Repro matrix` or `Why this item failed` block — the entry point(s) exercised
go into the `Fixture` line, and the expected-vs-actual comparison is the verdict-table row itself. Keep
the comment to: header → Env/Role/Date/Fixture → Test Step/Expected → verdict table (with `Evidence`
cell) → coverage → symptom-gone line → Root cause → Resolution options. Nothing else.

**Never edit the ticket's expected-result field** to match observed behavior. QA reports the conflict and names
the decision-maker; QA does not resolve it.

### 6b. Dev-question gate (MUST pass before the draft goes to the user)

Read your own draft as the developer who will act on it. Run the six-question gate in
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §5. Any "no" → **fix the
comment**, never "post now and explain in chat". Also confirm: every scope word in the draft (`always`,
`any entry point`, `only when …`) traces to something you actually exercised and captured (a verdict-table
row + its `Evidence` screenshot), and no observation in the draft is under an unresolved contradiction.

**Cause gate (same pass, no exceptions):** read every sentence in the draft that states or implies a
cause and check each one —

- [ ] It cites a **captured artifact** from the Step 4g sweep (status code, response field, console
      error, bundle probe, fixture read-back), not a recollection and not another record's behaviour.
- [ ] It carries a label — `Confirmed` / `Suspected` / `Unknown — not investigated` — and the label
      matches what was actually run: `Confirmed` only if the falsifying check was run.
- [ ] It contains **no hedge word standing in for a cause** (`probably`, `น่าจะ`, `seems`, `flaky`,
      `cache issue`, `environment issue`, `race condition`).
- [ ] It does not restate the symptom as the cause, and every `not checked` boundary is still visible
      in the block rather than quietly dropped.

Any box unchecked → delete the sentence or go back to Step 4g and earn it. Do not soften it into a
hedge.

**Table headers:** every column MUST carry an explicit, all-English header. The verdict table's header row is fixed and MUST read exactly `No.` · `Expected Result` · `Actual Result` · `Evidence` · `Status` — the middle two mirror the ticket's own field names (**Expected Result** / **Actual Result**) so a reader lines the comment up against the ticket without translating, and `Evidence` (between `Actual Result` and `Status`) holds each row's screenshot in-cell. **API bugs drop the `Evidence` column** (`No.` · `Expected Result` · `Actual Result` · `Status`) and carry cURL/response in a section below. Never `Expected result item`, never a bare `Actual`. A bare `#` for the row-number column renders as a **blank** header cell in Jira. **Headers MUST be bold, in the syntax of the target endpoint** — v2 wiki `||*No.*||*Expected Result*||…` (single asterisk, `||` delimiters, **no divider row**); markdown/ADF `| **No.** | **Expected Result** | …` followed by a `|---|` divider. A `**No.**` in a v2 body renders as literal `*No.*`, and a `|---|` divider row in a v2 body renders as a visible row of dashes.

Show the full draft in chat and wait.

---

## Step 7 — Post comment

### Pre-post checklist

- [ ] Real ❌ ✅ emoji (not escaped literals in the payload)
- [ ] Issue keys in body wrapped or avoided if auto-link is unwanted
- [ ] ASCII-safe JS if using JXA (`/[^\x00-\x7F]/.test(js)` false)
- [ ] v2 vs v3 endpoint matches format

#### Syntax gate — scan the body string before the request (mandatory)

Run both gates in [jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md):
grep the **exact outgoing body** for `**`, `^---$`, `^\|\s*-{3,}`, `![](`, backticks and unescaped
`{word}`; then after posting, re-fetch with `?expand=renderedBody` and check the four counts. Any
pre-post hit = fix the body, do not post.

This is a string scan, not a read-through — markdown leaks are invisible when proof-reading, because
the draft looks like what you meant.

### 7a. Choose method based on content

| Content | Method |
|---------|--------|
| Comment ≤ 3 table rows OR text-only (no table) | MCP `addCommentToJiraIssue` — fast for short results |
| Comment > 3 table rows | ADF-direct via browser JS (Pattern D in [jira-fast-publish.md](../../../references/jira-fast-publish.md)) |
| FE bug with screenshots | v2 wiki markup via browser JS (Step 7c) |

**Definition of "table":** `| col | col |` rows with data — the evidence summary block (`**Env:** staging`, `**API:** …`) is NOT a table.

**For MCP path (≤ 3 rows / text-only):**
`addCommentToJiraIssue` with approved body. **Verify on Jira** — truncation still possible; if truncated, switch to ADF-direct.

**For ADF-direct path (> 3 table rows):**

1. Build ADF JSON from approved draft. Convert `<br>` → `{"type": "hardBreak"}` nodes. Full rules: [jira-linebreak-conversion.md](../../../references/jira-linebreak-conversion.md).
2. Set `window.__adfBody` on page (Pattern A — ADF only, no CSV data needed).
3. Run Pattern D (comment-only): single JS fetch to `/rest/api/3/issue/{KEY}/comment`.
4. Read `window.__fastPublish` via Pattern C; check `status: 'ok'`.

Full JS patterns and error recovery: [jira-fast-publish.md](../../../references/jira-fast-publish.md).

### 7b. Fallback for MCP path only

When MCP truncates or returns 403 on a ≤ 3 row comment, switch to ADF-direct Pattern D above.

### 7c. FE + MP4/screenshots (in-cell evidence embedding)

Use **v2** wiki markup and `/rest/api/2/issue/{KEY}/comment`.

**Mandatory flow — each row's `Evidence` cell carries a working MP4 link (every case) plus an inline screenshot (text-verification cases):**

1. **Resize any screenshot first** — text-verification stills to ~600–640 px wide (`sips -Z 640 …`) so a bare `!file.png!` renders at a readable in-cell size. (MP4s are not resized.)
2. **Upload attachments** — for each MP4 and screenshot, `POST /rest/api/3/issue/{KEY}/attachments` (curl `-u email:token` with `X-Atlassian-Token: no-check`, or authenticated browser fetch).
3. **Embed in the `Evidence` cell** — the MP4 as a wiki attachment link `[▶ {KEY}_TC_{nn}.mp4|^{KEY}_TC_{nn}.mp4]`, and (text-verification rows only) the screenshot as `!filename.png!` **with no `|width=…`** (the pipe would split the table row). One case per verdict-table row.
4. **Post comment** — v2 wiki `POST /rest/api/2/issue/{KEY}/comment`. v2 renders `!file.png!` as an inline picture and `[▶ …|^…mp4]` as a click-to-play/download attachment link.
5. **Verify (Step 7d)** — confirm the MP4 link resolves and plays from Jira, each text still renders as a picture inside its `Evidence` cell (not `!filename!` text), and the table still has all its columns.

### 7d — Post-publish review (mandatory)

Before Step 8 transition, run review per [jira-comment-post-review.md](../../../references/jira-comment-post-review.md):

1. Re-open `https://{JIRA_DOMAIN}/browse/{ISSUE_KEY}` (or equivalent).
2. Checklist:
   - [ ] New comment visible; summary line **PASSED ✅** or **FAILED ❌** correct.
   - [ ] **No literal `<br>`, HTML tags, or stray markup** visible as text.
   - [ ] **Numbered items** (`1. ` `2. ` `3. `) each on a separate line — not running together.
   - [ ] No truncation; FE MP4 link resolves + plays, and text-verification screenshots render.
   - [ ] Each FE MP4 clears the 7-layer quality+correctness gate — plays sharp end-to-end, shows the flow reaching the stated target (no early cut), ER visible.
   - [ ] API evidence: cURL + response present per row.
3. If any check fails → fix → re-post → re-verify on Jira UI. **Max 3 rounds** — then report specific failures with best available workaround.

MUST NOT transition, assign, or report "done" until 7d passes — because stakeholders trust Jira, not MCP output.

**Fresh-eyes:** MUST re-read full draft from Step 6 before Step 7 when comment **> 80 lines** or table **> 15 rows**.

---

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] Summary line is exactly **PASSED ✅** or **FAILED ❌** (not ambiguous text).
- [ ] `Verdict: PASSED` or `Verdict: FAILED` with issue link.
- [ ] **Non-PASSED verdict:** Step 6a's two blocks present — **root cause** (Confirmed/Suspected/Unknown + backing artifacts) and **resolution options** (two options, each a named **role** owner, ending `Decided by: <role>`) — plus the one-line statement of whether the originally reported symptom is gone. (No separate repro-matrix / why-failed block — that content lives in the `Fixture` line and the verdict-table row + its `Evidence` MP4 / screenshot.)
- [ ] **Step 4g root-cause investigation ran for every non-PASSED item** (including BLOCKED): the cause cites captured artifacts (status code, response field/message, console error, bundle probe, fixture read-back) and is labelled `Confirmed` / `Suspected` (+ the confirming check) / `Unknown — not investigated` (+ what is needed).
- [ ] **Step 4h challenge gate ran for every non-PASSED item** ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)): the expected side re-verified char-exact against an authoritative source **including related/linked tickets' AC/EC**; a wrong/superseded expected became an expected/TC adjustment (not a FAILED), an unclear/hedged spec became BLOCKED + a who-to-ask remark (not a bug), and every surviving non-PASS was surfaced to the user in chat (recommendation A/B/C) before the comment was drafted.
- [ ] **Step 6b dev-question gate + cause gate passed before the first post**; every scope word traces to a verdict-table row + its `Evidence`; every cause sentence cites an artifact and carries a label; no hedge word used as a cause; no unresolved contradiction between your own observations.
- [ ] v2/v3 format matches Step 3 lock; FE bugs have the per-case MP4 (and text-verification screenshots) attached before wiki embed, every MP4 green on the 7-layer quality+correctness gate.
- [ ] API cases: full cURL + response per row (no "same as above").
- [ ] Jira issue re-opened after post: comment visible, not truncated.
- [ ] Step 7d fix-verify completed.
- [ ] **Step 8·0 format-completeness gate passed BEFORE any transition** — FE bug: screenshots embedded inline + render-verified; API bug: full cURL/response per row.
- [ ] Bug landed in Done → **Step 8d** run: stories it blocked either moved to ready-for-QA or left with their remaining blockers reported.
- [ ] Step 9 QA notify sent if the project configures a channel (retest verdict + Jira comment link + @mention).
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (Retest section).

---

## Step 8 — Close out (after successful post; no second approval unless user asked)

### 8·0 — Format-completeness gate (MUST pass before ANY transition)

**Hard gate — do NOT run 8a until the posted comment is complete per the Step 6 / Step 7c format:**

- [ ] Summary line is exactly **PASSED ✅** or **FAILED ❌**; env + results table present (bold headers, `No.` column).
- [ ] One result row per expected-result item (the ALL-items check is visible).
- [ ] **FE / UI bug:** a whole-flow **MP4 for every executed case**, uploaded as an attachment **and linked in that row's `Evidence` cell** (`[▶ …mp4|^…mp4]`), the link confirmed to resolve/play from the Jira UI (Step 7d); **plus** an inline screenshot (`!file.png!`, pre-resized, no `|width`) on every **text-verification** row, confirmed rendering as a picture. **A text-only comment for an FE bug FAILS this gate** — the exact-text/values table is not a substitute for the required MP4 (and text stills).
- [ ] **Every MP4 passes all 7 layers of the [MP4 quality + correctness gate](../../../references/qa-evidence-gates.md)** — max quality, whole flow with no skip, reaches the stated target (never cut early), ER visible on screen, legible/text-backed, file integrity + case match, attached-and-link-verified. Fail-closed: any layer red = re-capture, do NOT transition.
- [ ] **API bug:** full cURL + response per row (no "same as above").
- [ ] No local file paths, no literal `<br>`/HTML markup.

If any item fails — including when evidence **cannot** be embedded (e.g. no Jira-auth upload path) — **STOP. Do NOT transition.** Report the specific gap to the user and resolve it (or get an explicit user waiver) first. Never move a bug's status on an evidence-incomplete comment.

### 8a. Transition

Read transition names from the workspace `*-retest-guide.md` (see [project-config-template.md](references/project-config-template.md)). If missing, ask the user for **PASSED** and **FAILED** transition names before calling the API.

NEVER hardcode transition names in the skill — Jira workflows differ per project.

Use `getTransitionsForJiraIssue` and match the names from config or the user.

**Default transitions (override in project config):**

| Verdict | Target status | Typical transition name |
|---------|--------------|------------------------|
| PASSED | Done | "approve by QA" |
| FAILED | In Progress | project-specific — check config |

**Note:** some projects use BLOCKED for FAILED retests — check the project's `*-retest-guide.md` or `references/ols-project-guide.md` for the correct target status.

### 8b. Find developer (project-overridable)

From changelog: last move into the project's **active development** status (often named "In Progress" — use the name from config if different) → that author's `accountId`.

**Some projects (e.g. OLS) never change assignee** — check the project guide before running this step.

### 8c. Assign (project-overridable)

`editJiraIssue` → assignee = that developer (PASSED and FAILED).

**Skip if the project guide says "never change assignee"** (e.g. OLS — ownership tracked by status, not assignee).

### 8d. Unblock linked stories (run once the bug reaches Done)

**Trigger: the bug is now in Done** — i.e. the retest PASSED and Step 8a moved it there. A bug in Done
counts as fixed, and that is what releases the stories it was blocking. Run this immediately after the
8a transition succeeds (and also whenever you find a Done bug whose blocked stories were never moved).

A bug usually carries a **blocks** link to one or more stories — on the story those appear as
**"is blocked by {ISSUE_KEY}"**. Once this bug is Done the story may be ready for QA again, but only
when **nothing else** still blocks it.

1. Read the bug's link list and collect every issue it **blocks**.
2. For each of those stories, re-read the story's own **inward blocks links** ("is blocked by") — do
   NOT assume this bug was the only blocker.
3. Move the story to the project's ready-for-QA status **only if every one of its blockers is in
   Done**. Take the status/transition name from the project config (`references/*-retest-guide.md` /
   project guide) — never hardcode it here.
4. **Only Done counts as resolved.** A blocker still in an in-flight status — being deployed, in
   review, in progress — leaves the story blocked.
5. **Only move a story that is parked in the project's blocked status.** A story already in QA
   (ready-for-QA / testing) or still being built (in progress / review) must be left alone — pushing it
   to ready-for-QA would move it backwards or hand QA work the dev has not finished.
6. If any blocker is unresolved, **leave the story untouched** and report the remaining blocker keys
   and their statuses to the user.
7. Never change the story's assignee or QA Owner while doing this.

**Bug not in Done → skip this step entirely.** A story stays blocked while the bug is unfixed.

| Situation | Action |
|-----------|--------|
| Bug Done, story parked in blocked status, no other blocker outside Done | transition story → ready-for-QA status |
| Bug Done, story still blocked by something not Done | leave; report the blocker keys + statuses |
| Bug Done, story already in QA or still in development | leave; never move it backwards |
| Bug Done, no blocks link on the bug | nothing to do |
| Bug not in Done (FAILED / BLOCKED verdict) | skip |

### 8e. Tell the user

> Done. Review at `https://{JIRA_DOMAIN}/browse/{ISSUE_KEY}`

Include the 8d outcome: which stories were moved, and which stayed blocked and by what.

---

## Step 9 — QA result notify (if the project configures a channel)

After the transition, if the project defines a **QA notify channel** (Discord/Slack/chat), post a **retest-result** notification so the reporter / QA owner sees the outcome.

- Load channel, format, recipient, and any helper from the workspace `*-retest-guide.md` / project guide. **Never hardcode webhook URLs, tokens, machine paths, or user IDs in this skill** ([portable-content.md](../../../references/portable-content.md)) — they live in project config or local agent memory.
- Message = the single **retest verdict** (PASSED ✅ / FAILED ❌), a short bullet of what was checked, a link to the Jira retest comment, and an @mention of the recipient.
- **Recipient resolution (mandatory):** read the recipient from the ticket field the project guide names (e.g. a "QA Owner" custom field) — fetch that field's value from the bug itself for **every** notify; do not reuse a name from an earlier ticket, and do not default to the Reporter. The label printed next to the mention MUST match the field the value came from (label "QA Owner" ⇒ value from the QA Owner field). If the field is empty or the guide names no field, ask the user before sending.
- This is a **result FYI**, not a "please review" request (the retest is already closed) — do not reuse the full-test-run "QA Review Requested / pending review" wording.
- If the project provides a notify helper, **use it** (it gets @mention + headers right) instead of hand-assembling the payload.

### Pre-notify review gate (mandatory, every send)

Run this checklist on the **dry-run output** before every real send — no exceptions, including resends and corrections:

1. **Ticket key + title** match the Jira issue exactly.
2. **Verdict + counts** match the posted Jira retest comment (PASS/FAIL/BLOCKED numbers add up to the cases actually run).
3. **Body bullets** describe what was actually tested against the **bug's own expected results** — no copy-paste from another ticket.
4. **Result link** opens the correct issue and `focusedCommentId` = the retest comment ID just posted.
5. **Recipient**: re-read the QA Owner field value fetched in this session for THIS ticket; confirm the resolved `<@id>` maps to that name in the roster, and the label matches the field source.
6. Only after all 5 pass → send. Any doubt → show the dry-run to the user first.

Skip if the project has no notify channel configured.

### Correcting a posted notification

If a verdict changes after the notification was sent (e.g. PASSED→FAILED on re-audit):

1. **PATCH the existing Discord message** — do not repost. Use `PATCH /webhooks/{wid}/{wtok}/messages/{mid}?thread_id={thread}` with the corrected content.
2. To find the message ID: use webhook GET `GET /webhooks/{wid}/{wtok}/messages/{mid}?thread_id={thread}` (bot token GET returns empty `content` without MESSAGE_CONTENT intent).
3. Update the Jira comment in place (`addCommentToJiraIssue` with `commentId` parameter).
4. Transition the ticket to the correct status.

---

## Step 10 — A question arrives after the comment was posted

A follow-up question is a **defect in the comment**, not a normal step. Handle it in this order — see
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §6.

1. **Re-verify before answering.** If the answer is not already backed by a labelled evidence file from
   this retest, re-run that surface first. Never answer from memory of an earlier run, and never answer
   from the comment you wrote — the comment is what is being questioned.
2. **Check your own evidence set for the contradiction first.** If two captures disagree, that is the
   answer's real subject; resolve it per §3b before replying.
3. **Answer in the shape asked** (§7): direct answer first, then at most one line of why. If the user
   says it is too long, shorten the same answer — do not re-emit it at the same length.
4. **Fold the answer into the original comment** (edit in place, same comment id) so the next reader
   never needs the chat thread. Re-run Step 7d after the edit.
5. **If an earlier statement was wrong**, correct it **visibly in both places**: the in-place comment edit
   states which claim is being corrected, **and** a follow-up message goes into the thread where the wrong
   answer was given. Never a silent edit — people have already replied to the wrong version.
6. Record which Step 6a block would have prevented the question, so the next retest writes it up front.

---

## Skill composition

| Situation | See |
|-----------|-----|
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
| MUST include full cURL/response per API case | Evidence must stand alone |
| MUST treat Swagger (+ error docs) over stale ticket text | Ticket may be wrong |
| MUST use **PASSED ✅** or **FAILED ❌** only in summary line | Scanability for dev/QA |
| MUST keep a PASSED comment inside the Step 6 template fields only — no narrative padding, one-line evidence captions | A tight comment is scannable in seconds; prose bloat buries the verdict (locked from OLS-251 accepted format 2026-07-23) |
| MUST give every table column an explicit English header; row-number column = `No.` | bare `#` renders as a blank header cell in Jira |
| MUST head the FE verdict table exactly `No.` · `Expected Result` · `Actual Result` · `Evidence` · `Status` (API bug: drop `Evidence`) — never `Expected result item`, never a bare `Actual` | the middle columns carry the ticket's own field names so a reader lines the comment up with no translation, and `Evidence` holds each row's screenshot in-cell (user correction 2026-07-24 OLS-250/249; Evidence column added 2026-07-27, OLS-289) |
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
| MUST NOT include local file paths in Jira comments (`docs/result/`, absolute home/machine paths, etc.) | Meaningless to Jira readers; user enforced "เน้นๆๆ ห้ามผิดอีก" |
| MUST scan Jira comment for local paths before posting | Catches leaks: `docs/`, `~/`, absolute paths |
| MUST use two-step transition for READY TO TEST → Done: `121` then `41` | Single `151` fails; READY TO TEST can't jump directly to Done |
| MUST transition FAIL verdict to In Progress (`21`), NEVER to BLOCKED | OLS workflow: BLOCKED = external block, In Progress = needs dev fix |
| MUST `--dry-run` Discord notify before real send | Catches format errors before they go live |
| MUST set `--pass-count N` + `--summary "Retest of dev fix"` + `--owner-label "QA Owner"` on every Discord retest notify | Defaults produce wrong output (0/0/0 + wrong label); learned from 3-resend incident |
| MUST fetch the notify recipient from the ticket's QA Owner field (per project guide) per ticket, and verify the @mention person = that field's value — NEVER the Reporter, never a name carried over from another ticket | Label said "QA Owner" but pinged the Reporter → 3 wrong pings, user correction 2026-07-15 |
| MUST verdict from the bug's OWN expected results — PASSED only when ALL items are met (character-exact where wording is specified); parent AC is supplement, never substitute | Bug details are the contract; partial match = FAILED (user rule 2026-07-15) |
| MUST judge any Priority/Severity referenced in a retest comment ONLY from the [Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md) — never invent a severity notion | Keeps bug-priority language consistent across QA workflows; no ad hoc severity claims in Jira comments |
| MUST exercise **every** entry point to a failing surface separately (direct route **and** the in-app path a user takes) and capture each with its own screenshot in the `Evidence` cell; name the entry point(s) actually exercised in the `Fixture` line, and never claim a path you did not run | A path with no captured screenshot is a guess. OLS-108: "happens via both entry points" was published from one run, the dev acted on it, and it had to be retracted in-ticket |
| MUST NOT write a scope word (`always`, `any entry point`, `both ways`, `only when …`) that no exercised-and-captured `Evidence` row supports | The scope claim is the first thing a dev builds on |
| MUST hard-reload every surface after a state-changing fixture step before observing or capturing it; report a stale-data window only as a separate timing note with the measured delay | An already-open view holds pre-change data — recording it publishes your test timing as product behavior (OLS-108: card looked clickable ~5s after unpublish) |
| MUST resolve any disagreement between your own observations with one clean re-run before drafting, and record which was the artifact; unresolvable → BLOCKED, not FAILED | Resolving it in favour of the verdict you already reached is how the wrong repro path shipped |
| MUST include the Step 6a blocks on every non-PASSED comment — **root cause** and **resolution options** (two options, each a named **role** owner, ending `Decided by: <role>`); NO separate repro-matrix / why-failed block (that content is the `Fixture` line + the verdict-table row and its `Evidence` screenshot) | These answer the dev's next questions without bloating the comment; the failing behaviour + evidence already sit in the table row |
| MUST run the Step 4g root-cause investigation for EVERY non-PASSED item (FAILED and BLOCKED alike), starting by invoking `superpowers:systematic-debugging` (Phases 1–3) and naming it in the comment | Improvised reasoning is where guessing enters; the process is also faster than guess-and-check |
| MUST run the Step 4h challenge gate for EVERY non-PASSED item — re-verify the expected side char-exact against an authoritative source **including related/linked tickets' AC/EC**, then surface expected-vs-observed + the AC/EC finding + a recommendation (adjust expected/TC / re-test / confirm defect) to the user in chat before drafting the comment ([non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)) | A non-PASS against a stale, superseded, or misread expected is a phantom FAILED; the expected side must be earned, and adjusting a spec or re-testing is the user's call (PM-006) |
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
| MUST run the Step 9 pre-notify review gate (5 checks on dry-run output) before EVERY send, including resends | Catches wrong recipient/link/counts before they go live (user rule 2026-07-15) |
| MUST embed each FE screenshot in its verdict-table `Evidence` cell as `!file.png!` — pre-resized (~600–640 px), **no `\|width=…`** (the pipe splits the table row) — never leave as filename-only text | Screenshots must render as pictures inside the cell; a `\|width` param breaks the row, and filename text is unreadable evidence (OLS-289, 2026-07-27) |
| MUST NOT use `await` in superpowers-chrome eval — use setTimeout + window.__var | `await` returns undefined; callback pattern required |
| MUST use `mousedown` event (not `click`) for MUI Select/combobox elements | MUI Select ignores regular click events |
| MUST match OLS buttons by textContent, not generic CSS class | Generic selectors hit wrong button (e.g. "สร้างสื่อ" instead of target) |
| MUST NOT modify DOM inside MutationObserver callback | Causes infinite recursion → CDP crash |
| MUST use singular OLS management URLs (`/creator/learning-path` not `/learning-paths`) | Plural = 404; API uses plural but UI uses singular |
