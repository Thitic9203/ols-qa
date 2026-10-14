# Retest bug — comment and post (Steps 6–7)

Part of [WORKFLOW.md](WORKFLOW.md). Sections moved verbatim; read before drafting the comment.

## Contents

- [Step 6 — Draft Jira comment \[medium freedom\]](#step-6--draft-jira-comment-medium-freedom)
  - [6·0 — Build the run manifest, render the body, run the guard (mandatory)](#60--build-the-run-manifest-render-the-body-run-the-guard-mandatory)
  - [6a. Extra sections REQUIRED when the verdict is FAILED or BLOCKED](#6a-extra-sections-required-when-the-verdict-is-failed-or-blocked)
  - [6b. Dev-question gate (MUST pass before the draft goes to the user)](#6b-dev-question-gate-must-pass-before-the-draft-goes-to-the-user)
  - [6c. Independent reviewer pass (mandatory before the first post)](#6c-independent-reviewer-pass-mandatory-before-the-first-post)
  - [6d. End of round — decisions popup, then one approval bundle (mandatory, fixed order)](#6d-end-of-round--decisions-popup-then-one-approval-bundle-mandatory-fixed-order)
- [Step 7 — Post comment \[low freedom\]](#step-7--post-comment-low-freedom)
  - [Pre-post checklist](#pre-post-checklist)
  - [7a. Choose method based on content](#7a-choose-method-based-on-content)
  - [7b. Fallback for MCP path only](#7b-fallback-for-mcp-path-only)
  - [7c. FE + MP4/screenshots (in-cell evidence embedding)](#7c-fe--mp4screenshots-in-cell-evidence-embedding)
  - [7d — Post-publish review (mandatory)](#7d--post-publish-review-mandatory)

---

## Step 6 — Draft Jira comment [medium freedom]

**Do not post until the user approves** (unless they explicitly waive approval) — through the single
Step 6d approval popup.

**Draft in the syntax of the endpoint chosen at Step 3 — never in markdown "and convert later".**
Markdown and Jira wiki markup are different languages that share characters, so a markdown draft
posted to `/rest/api/2/` does not error — it renders as visible garbage (`**x**` → `*<b>x</b>*`).
Pick the template below that matches `COMMENT_FORMAT`; syntax map and gates in
[jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md).

**Template core — v2 wiki markup** (`/rest/api/2/…`; FE bugs, anything with screenshots):

```text
*Retest Result: PASSED* ✅   (or FAILED ❌ · BLOCKED ⛔ · PWMI ⚠️ — the round's real verdict; scoped rounds read "PASSED (scoped: TC_03)")

*Env:* {ENV} ({url})
*API:* {METHOD} {path}   (if API bug)
*Swagger:* {link}
*Design ref:* {figma node link}   (UI retest — or "none, asked {who} {YYYY-MM-DD}"; no " — " or " · " in the value)
*Role:* {role(s) the cases were run as}
*Date:* {YYYY-MM-DD}
*Build:*
* {build / tag the fix landed in}
* {second point, when the value has more than one}

*Fixture:*
* {what was used}
* {whether it was restored, and how that was checked}

*Scope:* CASES: TC_03, TC_07   (scoped rounds only — a full round prints NO Scope line)

----

*Test Step (from ticket):* …
*Expected Result (from ticket, verbatim):* …          (Bug)
(Task / Story: no separate AC line — each AC's text sits verbatim in its table row's Expected Result column)

||*No.*||*ER*||*Case (Role)*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||
|1|ER1|• TC_01 {what it verifies} ({role}) \\ • TC_04 {what it verifies} ({role})|{item quoted from the ticket}|• {observed point} \\ • {observed point}|[▶ tc1.mp4|^tc1.mp4] !tc1.png!|✅/❌/⛔|

*Expected-result coverage:* {met} / {total} items met[ · {k} PWMI][ · {k} failed][ · {k} blocked]      (a Task reads *Acceptance-criteria coverage:*)
*Case coverage:* {run} / {total} cases run — {passed} passed / {failed} failed[ / {pwmi} PWMI] / {blocked} blocked

*Out of scope this round:* {ids} — not covered by the scoped cases, not verified   (scoped rounds only)

*Test run time:* {minutes} min — includes evidence capture ({screenshots|screenshots and video}); excludes re-checks, design lookup and comment drafting

_retestskillmarker · skill=retest-bug-workflow · src={ols-qa|helix} · via={retest-bug|retest-bug-workflow|helix-menu} · agent={claude-code|cursor|codex|copilot|other}_
```

🔴 **Last line = the usage marker, after one blank line — every retest result, every format.** Fill it
from the run, never guess: `src=helix` when running from the Helix plugin, `src=ols-qa` from this repo;
`via` = the command or skill the user invoked; `agent` = the AI tool doing the run. In `run.json` set
`marker: {src, via, agent}` and the renderer prints it; `retest_guard.js` refuses a body without it (`marker-missing`).

🔴 **The line just above the marker = the measured test run time (one blank line between) — never estimate it.**
Right before drafting, measure over **every lane's** evidence/result directories (screenshots, clips,
`results.jsonl`):

```bash
node tools/run-time/measure.js --dirs {lane1_evidence_dir},{lane2_evidence_dir} [--gap-s 120]
```

It prints `{method, minutes, bursts, files, gapS, hasVideo}` (method `evidence-burst-v1`): the file write
times of all lanes as one union, split into bursts wherever no file was written for more than 120 s, and
the burst durations summed — so it counts running and evidence capture, and leaves out idle time,
re-checks, design lookup and comment drafting. Copy it into `run.json` as
`testRunTime: {minutes, hasVideo, method}`; the renderer prints the line (`hasVideo` picks "screenshots" or
"screenshots and video"), `retest_manifest.js` refuses a manifest without it, and `retest_guard.js`
refuses a body whose line above the marker is not it (`run-time-line-missing`). Exit 2 = it could not
measure (a lane directory is missing, or no evidence files) — fix the directory list; never type a
number instead. When the workspace has no such tool, measure by the same method by hand (list every
evidence file's modification time across all lanes, split at gaps over 120 s, sum the bursts) and say in
the chat report that it was measured by hand.

**All-BLOCKED round (owner, 2026-10-14):** when every case and every result is BLOCKED, nothing ran and
there is nothing to measure. Put `testRunTime: {notMeasured: true, reason: "no-case-ran"}` in `run.json`;
the renderer prints `*Test run time:* not measured — no case ran`. The manifest check and the guard refuse
this line in any round where a case passed, failed or was PWMI (`run-time-not-measured-with-cases`).

**This block is the shape the renderer produces, not something to hand-type.** Build `run.json` and
render it (Step 6·0); the guard rejects a body that drifts from this shape, including one typed from
this very block.
Follow [comment-template-v2.md](references/comment-template-v2.md) for the render command, the
line order and a machine-checked manifest → body example.

🔴 **ONE table — owner format, 2026-09-24.** The comment carries a single table, heading exactly
`No.` · `ER` (a Task: `AC`) · `Case (Role)` · `Expected Result` · `Actual Result` · `Evidence` ·
`Status` (API bug: drop `Evidence`). One row per `ER*`/`AC*` item; its `Case (Role)` cell lists
**every** Step 2c case covering that item as `• TC_nn title (role)`, joined by the wiki line break
` \\ `. There is no separate `Test cases run` table any more — the case list with outcomes still
ships on every retest, bug and task alike, but inside the rows it covers; it is what tells the next
reader what was actually exercised, and a result that never became a case does not get re-run
([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §1). The
coverage lines stay **after** the table. The owner's words: "ทำไมต้องแยกตาราง รวมให้เป็นตารางเดียว".

🔴 **No `Scope: FULL` line.** A full round prints no Scope line at all ("*Scope:* FULL ตัดทิ้ง");
only a scoped round prints `*Scope:* CASES: <ids>`.

🔴 **Several points = bullets, never one long line.** A header value with more than one point
(separated by ` · ` or ` — ` in `run.json`) renders as the label on its own line, one `* ` bullet per
point, then exactly **one** blank line — without it the wiki list continues into the next label, and
`Fixture` must sit at the same level as `Build`. Inside a table cell, several points (` · ` in
`run.json`) render as `• point` lines joined by ` \\ `. Owner: "ให้ทำเป็นบลูเลทๆ เสมอไม่ยาวพืดให้อ่านยาก".

🔴 **After posting: column widths and centring (post-publish step).** The v2 wiki endpoint cannot
carry widths or alignment, so once the wiki body is posted, GET the comment's v3 ADF, run
`node tools/retest-guard/adf_colwidth.js --in get.json --out put.json`, PUT `put.json` to the v3
comment endpoint, GET it again and run `adf_colwidth.js --check readback.json` — exit 0 is required.
It sets `colwidth` [50, 75, 230, 200, 330, 230, 65] on the single table and centres every clip and
image in the `No.` / `Evidence` / `Status` columns (each MP4 `mediaGroup` becomes a centred
`mediaSingle`); owner: "จัดกลางเสมอ อย่าให้ต้องบอกซ้ำ". The readback check is the evidence — not the
PUT status.

🔴 **The table carries NO design-node column — not on any retest, ever.** The design reference is
one fact about the round, not a per-row fact, so it belongs on the header's `Design ref:` line and
nowhere else: the node URL when one exists, or the Step 2d reason when none does. A column repeating
"no node" down every row tells the reader nothing and was removed on user instruction 2026-08-25 after
it shipped that way. When different cases genuinely use different nodes, name them on the `Design ref:`
line (`TC_03 → {url} · TC_07 → {url}`) rather than reinstating a column.

**Put any design-node URL on the `Design ref:` line as a bare URL.** That line is not a table row, so
nothing is at stake there and a bare URL is the shorter, more readable form.

🟢 **A labelled link inside a table cell is safe — measured, not assumed.** This file used to claim the
`|` in `[label|url]` splits the row it lands in. It does not: OLS-701's retest comment (2026-09-05)
carries `[▶ file.mp4|^file.mp4]` in an Evidence cell, and its rendered row has all **five** `<td>`
elements, with the MP4 resolving to a real attachment link. The construct that genuinely breaks a row
is the image width parameter (`!img|width=N!`, PM-004) — that one is still forbidden.

The **`Evidence` column** (between `Actual Result` and `Status`) holds the case's screenshot **in the
cell** — `!file.png!`, pre-resized, **no `|width=…`** (the pipe breaks the row). One image per row,
for PASSED and FAILED alike. **API bugs have no screenshots** → drop the `Evidence` column
(`||*No.*||*Expected Result*||*Actual Result*||*Status*||`) and put the full cURL + response for each
case in a separate `*Evidence*` section below the table instead (a cURL block does not fit in a cell).

**Template core — markdown/ADF** (MCP `addCommentToJiraIssue` or `/rest/api/3/…`): identical
content, but `**bold**`, `---`, and a `| col | col |` table with a `|---|` divider row. It ends with the same
marker line (`_…_` is italic in both syntaxes), after one blank line.

Never mix the two in one body.

**AC/EC coverage reconciliation before the draft is final (gate layer 6, fail-closed).** Reconcile the
Step 2 enumerated `ER*` list against the verdict table: **`enumerated ids == rows carrying a status +
evidence (or an explicit BLOCKED reason)`**, and `*Expected-result coverage:* {n} / {total}` shows
`{n} == {total}`. Every expected-result/detail item is its **own row** — none parked only in a remark,
a note under the table, or chat; no row is status-less; the verdict is **not PASSED** if any item was
unverified or observed to differ — an **observed-to-differ** item is a FAILED row (per matrix), an
**unverified/unreached** item is a BLOCKED row (a coverage gap, not a product FAILED). Any shortfall ⇒
the retest is **not complete** — add the row / verify the item / re-status the partial case before drafting further.

**Case-list reconciliation (same pass).** Every case in the Step 2c list appears in the `Case (Role)`
cell of the row(s) it covers, with a status in `run.json`; every `ER*`/`AC*` row names at least one case; every UI
case carries a design node link **or** the BLOCKED-with-reason recorded at Step 2d. A case that was
planned and not run is a **BLOCKED row with the reason**, never a quietly shortened list. Every row
with a passing status carries an evidence reference — passed rows included
([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §7).

**Verbosity ceiling:** a PASSED comment stays inside the template above — no added narrative
paragraphs, no restating the ticket, no "why this matters" prose. Each field line holds only its
value. FE screenshots go **in the `Evidence` cell** — the `Actual Result` cell already describes what
the image shows, so no separate caption line is needed. If a field doesn't apply (e.g.
**API**/**Swagger** on an FE bug), omit the line entirely rather than writing "N/A".

### 6·0 — Build the run manifest, render the body, run the guard (mandatory)

The comment is **produced from data**, not typed. Write `run.json` for this round — ticket, type,
bug type, format, env, design ref, role(s), date, build, fixture, **scope**, the enumerated contract,
the cases, the per-item results with their evidence, and the **lane plan the round ran**:
`lanes: [{id, account, cases: [TC ids], lease: true}]` ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md)).
Every in-scope case sits in exactly one lane, every lane held a session lease (`lease: true`), no account
is in two lanes, and a round with 2+ cases in one lane carries `serialReason` = one of `one-account` ·
`shared-record` · `env-forbids-concurrency` · `two-or-fewer-scenarios` · `user-asked-serial` (§4 a–e).
A manifest without `lanes` does not validate.

Coverage footer: *items met* counts PASSED items only; PWMI, failed and blocked items are named after
it on the same line (`4 / 5 items met · 1 PWMI`), and the line reconciles when they add up to the total.
A PWMI case is never counted as failed.

**When the workspace provides `tools/retest-guard/` — run it; it is not optional there.** When the
workspace does not (this skill also ships to projects that have not adopted it), the same rules still
apply and this step is done by hand against the template below — a missing tool is not a lighter
standard, and "the guard is not installed here" is never a reason to post something it would reject.

```
node tools/retest-guard/retest_guard.js --manifest run.json --out body.txt --evidence-dir out/
```

- **exit 0** — the mechanical rules pass: markup for the locked endpoint, header lines, table headers,
  per-row evidence, the coverage arithmetic, scope wording, no local paths. Continue to 6a/6b.
- **exit 1** — findings; each names the rule and the fix. Close them; do not draft around them.
- **exit 2** — the guard could not run. That is **not** a pass and never becomes one.

**Go back:** On exit 1, fix the manifest or body and return to the top of Step 6·0 — re-run the guard. On exit 2, make the guard run. The draft moves to 6a/6b on neither.

**Scope is a field, not a sentence.** `"scope": {"mode":"FULL"}` for a full retest (the comment then
prints no Scope line at all);
`{"mode":"CASES","cases":["TC_03","TC_07"]}` when the user asked for particular cases, or for a
round-N scoped round the agent proposed (Step 2c, confirmed in the Step 6d popup). The scoped
form narrows the coverage denominator to what those cases cover, prints the verdict as
`PASSED (scoped: TC_03, TC_07)`, and lists every item it did **not** verify in an `Out of scope this
round:` line — so a partial retest is honest instead of either breaking the coverage gate or quietly
widening what was asked for.

A hand-written body is still allowed when the manifest cannot be built, but it passes the same gate:
`node tools/retest-guard/retest_guard.js --body body.txt --format v2 --bug-type FE`.

**What the guard does not decide, and never implies:** whether the clip reached its target, whether
the cause is real, whether the expected side was verified against the design. Those are 4d, 4h and 4i
and no exit code stands in for them.

### 6a. Extra sections REQUIRED when the verdict is FAILED or BLOCKED

A PASSED comment stops at the template above. **A FAILED / BLOCKED comment adds exactly these two
blocks**, in this order (the failing behaviour itself already lives in the `Actual Result` cell + its
`Evidence` screenshot, so it is not repeated as a separate prose block):

| Block | Content | Answers |
|-------|---------|---------|
| **Root cause** | the Step 4h investigation, condensed: one-sentence cause + a `Confirmed`/`Suspected`/`Unknown — not investigated` label, and the captured artifacts that back it (status code, response field/message, console error, bundle probe, fixture read-back). | "why does it happen, which layer do I open, and how sure are you?" |
| **Resolution options** | the two mutually exclusive outcomes with a named **role** owner each (role only, never a person's name) — spec owner updates the expected result (no code change) **or** dev changes `{exact route/surface}` and leaves `{what already passes}` alone; end with `Decided by: <role>` | "do I change code or do you change the ticket, and who decides?" |

Also state plainly, in one line, whether the **originally reported symptom is gone** — a FAILED verdict on a
different deviation is routinely misread as "the fix didn't work".

**Do not add** a separate `Repro matrix` or `Why this item failed` block — the entry point(s) exercised
go into the `Fixture` line, and the expected-vs-actual comparison is the verdict-table row itself. Keep
the comment to: header → Env/Role/Date/Build/Fixture → Test Step/Expected → the one table (with `Evidence`
cell) → coverage → symptom-gone line → Root cause → Resolution options. Nothing else.

**Never edit the ticket's expected-result field** to match observed behavior. QA reports the conflict and names
the decision-maker; QA does not resolve it.

### 6b. Dev-question gate (MUST pass before the draft goes to the user)

Read your own draft as the developer who will act on it. Run the six-question gate in
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §5. Any "no" → **fix the
comment**, never "post now and explain in chat". Also confirm: every scope word in the draft (`always`,
`any entry point`, `only when …`) traces to something you actually exercised and captured (a verdict-table
row + its `Evidence` screenshot), and no observation in the draft is under an unresolved contradiction.

**Go back:** If any of the six questions is "no", fix the comment and return to Step 6·0 — re-render and re-run the guard before 6c.

**Cause gate (same pass, no exceptions):** read every sentence in the draft that states or implies a
cause and check each one —

- [ ] It cites a **captured artifact** from the Step 4h sweep (status code, response field, console
      error, bundle probe, fixture read-back), not a recollection and not another record's behaviour.
- [ ] It carries a label — `Confirmed` / `Suspected` / `Unknown — not investigated` — and the label
      matches what was actually run: `Confirmed` only if the falsifying check was run.
- [ ] It contains **no hedge word standing in for a cause** (`probably`, `น่าจะ`, `seems`, `flaky`,
      `cache issue`, `environment issue`, `race condition`).
- [ ] It does not restate the symptom as the cause, and every `not checked` boundary is still visible
      in the block rather than quietly dropped.

Any box unchecked → delete the sentence or go back to Step 4h and earn it. Do not soften it into a
hedge.

**Table headers:** every column MUST carry an explicit, all-English header. The single table's header row is fixed and MUST read exactly `No.` · `ER` (Task: `AC`) · `Case (Role)` · `Expected Result` · `Actual Result` · `Evidence` · `Status` — `Expected Result` / `Actual Result` mirror the ticket's own field names (**Expected Result** / **Actual Result**) so a reader lines the comment up against the ticket without translating, and `Evidence` (between `Actual Result` and `Status`) holds each row's screenshot in-cell. **API bugs drop the `Evidence` column** (`No.` · `ER` · `Case (Role)` · `Expected Result` · `Actual Result` · `Status`) and carry cURL/response in a section below. Never `Expected result item`, never a bare `Actual`. A bare `#` for the row-number column renders as a **blank** header cell in Jira. **Headers MUST be bold, in the syntax of the target endpoint** — v2 wiki `||*No.*||*Expected Result*||…` (single asterisk, `||` delimiters, **no divider row**); markdown/ADF `| **No.** | **Expected Result** | …` followed by a `|---|` divider. A `**No.**` in a v2 body renders as literal `*No.*`, and a `|---|` divider row in a v2 body renders as a visible row of dashes.

Show the full draft in chat; the user's approval is the single Step 6d approval popup — no separate
wait here.

---

### 6c. Independent reviewer pass (mandatory before the first post)

6b is the author re-reading their own draft, and
[qa-evidence-gates.md](../../../references/qa-evidence-gates.md) sets the real bar itself: *a second
QA — or another agent given the ticket, the deliverable and nothing else*. Make that literal.

1. **Dispatch a reviewer subagent in the background** (Agent/Task tool) with **only**: the ticket, the
   rendered body, and the evidence files. Not the session, not the reasoning, not what you meant. While
   it runs, build the Step 6d bundle in parallel; the reviewer must return **CLEAN before the approval
   popup** ([round-time-contract.md](../../../references/round-time-contract.md) §3 step 1).
2. **It answers the four adversarial questions** from the pre-delivery gate, each **by pointing at a
   row or a file** — the least-certain row, the shortest clip, the hardest-to-read value, and what
   was not tested and where the deliverable says so.
3. **Binary verdict per round:** `CLEAN` or `HAS-COMMENTS` with a numbered list. Nitpicks are not
   defects; only gaps against the ticket and the evidence count.
4. **Report the round to the user** as it finishes, then fix every finding and dispatch a **fresh**
   round. Loop until a round is clean — no cap, and a round whose result was never reported does not
   count.
5. **Verify the reviewer's claims yourself before acting on them** — a subagent's report is not
   evidence, it is a lead.

**Go back:** If a round returns `HAS-COMMENTS`, fix every finding and return to 6c item 1 with a fresh reviewer. The Step 6d approval popup waits for `CLEAN`.

**Unattended / bot mode:** run one reviewer round, fold its findings in, and record any it could not
resolve as BLOCKED rows with reasons — never halt the queue, never post over an unanswered finding.

### 6d. End of round — decisions popup, then one approval bundle (mandatory, fixed order)

**Delegated rounds:** when the owner has delegated the round ("don't ask", "don't wait", "handle it"), the decisions popup carries only what the [no-wait decision gate](../../../references/no-wait-decision-gate.md) could not resolve, and the approval wait is skipped (layer 19) — every format, syntax and readback gate below still runs. Opening new bugs still needs a live yes.

Follow [round-time-contract.md](../../../references/round-time-contract.md) §3 in this order:

1. **Reviewer and bundle in parallel** — the 6c reviewer runs in the background while you build the
   bundle: run the cross-ticket conflict check (QA closing) and queue its result, then run the
   **render + media check** on the **final** body (§6) — render the body locally in the format locked
   at Step 3 (v2 wiki or ADF) and confirm tables, line breaks and formatting; resolve every referenced
   image or clip (the attachment exists, its id or filename matches the reference). A render or media
   failure blocks the approval popup until fixed. The reviewer must return CLEAN before item 4.
2. **Decisions popup — only when something is queued.** One `AskUserQuestion`, batched 4 questions at a
   time: the scope plan (Step 2b/2c, and the round-N scope), each queued non-PASS (A/B/C, Step 4i),
   each missing design (Step 2d), and each cross-ticket conflict (*Investigate further* / *Close out
   now*). Nothing queued → skip this item; the round then has a single human touch.
3. **Apply the answers** — re-render the draft and re-run the Step 6·0 guard (and the §6 check). A
   scope correction or **B re-test** starts a new round.
4. **One approval popup for the whole bundle**, listing every concrete action by name: the comment
   (target ticket + endpoint) · each transition (ticket, from → to, Step 8a) · each assign (ticket +
   person, Step 8c) · each linked story to unblock (Step 8d) · each notify (channel + resolved
   recipient, Step 9) · each external result update (destination + rows).
5. **Execute** — post (Step 7), then the 7d post-publish re-read, then transition, assign, unblock,
   notify and update results under that same approval. **No second approval.**

**Go back:** If the render or media check fails, fix the body and return to 6d item 1. If an answer is a scope correction or **B re-test**, return to Step 2c — a new round starts.

---

## Step 7 — Post comment [low freedom]

### Pre-post checklist

- [ ] Real ❌ ✅ emoji (not escaped literals in the payload)
- [ ] Issue keys in body wrapped or avoided if auto-link is unwanted
- [ ] ASCII-safe JS if using JXA (`/[^\x00-\x7F]/.test(js)` false)
- [ ] v2 vs v3 endpoint matches format
- [ ] Step 6d render + media check green on the **final** body, and the post is covered by the Step 6d approval bundle ([round-time-contract.md](../../../references/round-time-contract.md) §3, §6)

#### Syntax gate — scan the body string before the request (mandatory)

Run both gates in [jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md):
grep the **exact outgoing body** for `**`, `^---$`, `^\|\s*-{3,}`, `![](`, backticks and unescaped
`{word}`; then after posting, re-fetch with `?expand=renderedBody` and check the four counts. Any
pre-post hit = fix the body, do not post.

**Go back:** If the pre-post checklist or the syntax scan fails, fix the body and return to the top of Step 7 — Pre-post checklist. Nothing is posted until both are clean.

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
3. **Embed in the `Evidence` cell** — the MP4 as a wiki attachment link `[▶ {KEY}_TC_{nn}.mp4|^{KEY}_TC_{nn}.mp4]` (role-suffixed when the case covers more than one role — use the attached name verbatim), and (text-verification rows only) the screenshot as `!filename.png!` **with no `|width=…`** (the pipe would split the table row). One case per verdict-table row.
4. **Post comment** — v2 wiki `POST /rest/api/2/issue/{KEY}/comment`. v2 renders `!file.png!` as an inline picture and `[▶ …|^…mp4]` as a click-to-play/download attachment link.
5. **Verify (Step 7d)** — confirm the MP4 link resolves and plays from Jira, each text still renders as a picture inside its `Evidence` cell (not `!filename!` text), and the table still has all its columns.

### 7d — Post-publish review (mandatory)

Before Step 8 transition, run review per [jira-comment-post-review.md](../../../references/jira-comment-post-review.md):

1. Re-open `https://{JIRA_DOMAIN}/browse/{ISSUE_KEY}` (or equivalent).
2. Checklist:
   - [ ] New comment visible; summary line (**PASSED ✅** / **FAILED ❌** / **BLOCKED ⛔** / **PWMI ⚠️**) correct.
   - [ ] **No literal `<br>`, HTML tags, or stray markup** visible as text.
   - [ ] **Numbered items** (`1. ` `2. ` `3. `) each on a separate line — not running together.
   - [ ] No truncation; FE MP4 link resolves + plays, and text-verification screenshots render.
   - [ ] Each FE MP4 clears the 7-layer quality+correctness gate — plays sharp end-to-end **with no flicker/judder at 100%** (layers 1b/1c: ≤5% repeated moving frames, provenance manifest present), **scrolls to and holds the stated target in frame** (no early cut), ER visible; one clip per named role.
   - [ ] **Pre-delivery completeness gate (7-layer) green** ([qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *Pre-delivery completeness*): scope re-counted from the bug **this round**, role × case matrix full, **every** attachment opened and played from Jira (not sampled), every claim points at a row, verdict↔bug↔priority↔remark agree, nothing recorded only in prose, **4-question adversarial pass answered with a pointer for every question**; unattended runs resolve to BLOCKED rows and report incomplete rather than halting silently. Fail closed — no transition, no notify, no "done" while red.
   - [ ] API evidence: cURL + response present per row.
3. If any check fails → fix → re-post → re-verify on Jira UI. **Max 3 rounds** — then report specific failures with best available workaround.

MUST NOT transition, assign, or report "done" until 7d passes — because stakeholders trust Jira, not MCP output.

**Go back:** If any 7d check fails, fix and return to Step 7 to re-post, then run 7d again — max 3 rounds. Step 8 does not start until 7d passes.

**Fresh-eyes:** MUST re-read full draft from Step 6 before Step 7 when comment **> 80 lines** or table **> 15 rows**.

---
