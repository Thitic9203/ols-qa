# Retest bug — close out and notify (Steps 8–10)

Part of [WORKFLOW.md](WORKFLOW.md). Sections moved verbatim; read right after the comment is posted.

## Contents

- [Step 8 — Close out (after successful post; no second approval unless user asked) \[low freedom\]](#step-8--close-out-after-successful-post-no-second-approval-unless-user-asked-low-freedom)
  - [8·0 — Format-completeness gate (MUST pass before ANY transition)](#80--format-completeness-gate-must-pass-before-any-transition)
  - [8a. Transition](#8a-transition)
  - [8b. Find developer (project-overridable)](#8b-find-developer-project-overridable)
  - [8c. Assign (project-overridable)](#8c-assign-project-overridable)
  - [8d. Unblock linked stories (run once the bug reaches Done)](#8d-unblock-linked-stories-run-once-the-bug-reaches-done)
  - [8e. Tell the user](#8e-tell-the-user)
- [Step 9 — QA result notify (if the project configures a channel) \[low freedom\]](#step-9--qa-result-notify-if-the-project-configures-a-channel-low-freedom)
  - [Pre-notify review gate (mandatory, every send)](#pre-notify-review-gate-mandatory-every-send)
  - [Correcting a posted notification](#correcting-a-posted-notification)
- [Step 10 — A question arrives after the comment was posted \[low freedom\]](#step-10--a-question-arrives-after-the-comment-was-posted-low-freedom)

---

## Step 8 — Close out (after successful post; no second approval unless user asked) [low freedom]

Every action here — each 8a transition, 8c assign and 8d unblock — runs under the single Step 6d
approval bundle, which listed it by name ([round-time-contract.md](../../../references/round-time-contract.md) §3).
An action that was not listed in that bundle is not run without asking.

### 8·0 — Format-completeness gate (MUST pass before ANY transition)

**Hard gate — do NOT run 8a until the posted comment is complete per the Step 6 / Step 7c format:**

- [ ] **`retest_guard.js` exits 0 for the posted body** (re-run it against what was actually posted, not against the draft). Exit 2 is not a pass. **Skip only** when a fresh hash compare shows the posted body byte-identical to the draft that passed the guard; any difference → run the guard ([round-time-contract.md](../../../references/round-time-contract.md) §9).
- [ ] Summary line is exactly one of **PASSED ✅** / **FAILED ❌** / **BLOCKED ⛔** / **PWMI ⚠️**; env + results table present (bold headers, `No.` column).
- [ ] **Case list present and reconciled:** the single table's `Case (Role)` cells carry every Step 2c case, every `ER*`/`AC*` row names at least one case, and `Case coverage: {n}/{total}` matches the rows. A planned-but-unrun case is a BLOCKED row with its reason — never a shortened list.
- [ ] **Design reference accounted for:** the header's `Design ref:` line carries the node link(s) actually opened, or the Step 2d reason naming who was asked. A UI retest with neither is not verified — do **not** transition ([figma-design-comparison.md](../../../references/figma-design-comparison.md)).
- [ ] **No passing row whose actual result contains `caveat` / `not verifiable` / `assumed` / `ยืนยันไม่ได้` / `ตรวจไม่ได้`** — such a row is BLOCKED or PWMI, never PASSED ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §3).
- [ ] **Every passing row carries an evidence reference** — `count(passing rows) == count(evidence links)`.
- [ ] **AC/EC coverage reconciled (7-layer gate layer 6·7):** `enumerated Step 2 ER* ids == rows carrying a status + evidence (or explicit BLOCKED)`, and `Expected-result coverage: {n}/{total}` has `{n}=={total}`. Every expected-result/detail item is its **own row** — none only in a remark/note/chat; no PASSED verdict over an unverified or differing item. Any shortfall ⇒ do **not** transition; go back and close it.
- [ ] **FE / UI bug:** a whole-flow **MP4 for every executed case**, uploaded as an attachment **and linked in that row's `Evidence` cell** (`[▶ …mp4|^…mp4]`), the link confirmed to resolve/play from the Jira UI (Step 7d); **plus** an inline screenshot (`!file.png!`, pre-resized, no `|width`) on every **text-verification** row, confirmed rendering as a picture. **A text-only comment for an FE bug FAILS this gate** — the exact-text/values table is not a substitute for the required MP4 (and text stills).
- [ ] **Every MP4 passes all 7 layers of the [MP4 quality + correctness gate](../../../references/qa-evidence-gates.md)** — max quality, whole flow with no skip, reaches the stated target (never cut early), ER visible on screen, legible/text-backed, file integrity + case match, attached-and-link-verified. Fail-closed: any layer red = re-capture, do NOT transition.
- [ ] **API bug:** full cURL + response per row (no "same as above").
- [ ] No local file paths, no literal `<br>`/HTML markup.

If any item fails — including when evidence **cannot** be embedded (e.g. no Jira-auth upload path) — **STOP. Do NOT transition.** Report the specific gap to the user and resolve it (or get an explicit user waiver) first. Never move a bug's status on an evidence-incomplete comment.

### 8a. Transition

Read transition names from the workspace `*-retest-guide.md` (see [project-config-template.md](references/project-config-template.md)). If missing, ask once for the **PASSED** and **FAILED** transition names in the 6d decisions popup (before approval) and save them to the guide immediately ([round-time-contract.md §2](../../../references/round-time-contract.md)); never ask after the bundle was approved.

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

🔴 **Adoption count — verify, then say it in the chat close-out.** After the result comment is posted, check
that the ticket is counted by the project's AI-skill adoption dashboard (the project guide names it — by
placeholder `<ADOPTION_DASHBOARD_URL>` in shared files; the real URL lives in local secrets). The dashboard
runs the tracker search `comment ~ "retestskillmarker"` and counts a ticket when one of its comments carries
the marker (created after its snapshot cutoff). Run the same search scoped to this ticket and confirm the
marker is the last line of the posted comment:

```bash
TRACKER_BASE_URL=https://{JIRA_DOMAIN} TRACKER_EMAIL=… TRACKER_API_TOKEN=… \
  node tools/adoption-check/check.js --key {ISSUE_KEY} [--cutoff {snapshot cutoff}] [--dashboard {dashboard URL}]
```

It runs `key = {ISSUE_KEY} AND comment ~ "retestskillmarker"` on the tracker's current search endpoint
(`POST /rest/api/3/search/jql`), then reads the comments: exit 0 = counted · 1 = not counted (the reason says
why) · 2 = cannot check. When the workspace has no such tool, run that search by hand and open the posted
comment to confirm the marker is its last line. The chat close-out MUST then carry exactly one of:

- `Counted in <ADOPTION_DASHBOARD_URL> — tab AI Skill Adoption Overview (dashboard refreshes every 5 minutes)`
- `NOT counted yet — {reason from the search / comment read}` (also when the check could not run — say why)

Never claim it without the search result.

Write `references/helix-handoff-{KEY}.md` for this round ([handoff-file-template.md](../../../references/handoff-file-template.md)) —
case list, AC/EC list, Figma node refs, Swagger version, last-round results, one fingerprint per source
([round-time-contract.md](../../../references/round-time-contract.md) §10).

**The round report ends with this line** (§1), numbers measured from the session's own timestamps,
never estimated:

`Round time: AGENT+EXEC {n} min · human wait {h} min · overrun {max(0, n-15)} min`

---

## Step 9 — QA result notify (if the project configures a channel) [low freedom]

After the transition, if the project defines a **QA notify channel** (Discord/Slack/chat), post a **retest-result** notification so the reporter / QA owner sees the outcome. It runs under the Step 6d approval bundle, which named the channel and the resolved recipient — no second approval.

**Who invoked the retest never changes this.** The notify is part of closing a retest, not a favour to the person who asked for one. It is sent the same way whether the workflow was started by the repo owner, by another QA, by a teammate in the channel, by a slash command, or by an unattended bot/trigger — and whether or not that person mentioned a notification. The **only** condition is the one above: the project configures a channel. A retest whose comment is posted and whose ticket is transitioned but whose notify was skipped is **not closed**.

- Load channel, format, recipient, and any helper from the workspace `*-retest-guide.md` / project guide. **Never hardcode webhook URLs, tokens, machine paths, or user IDs in this skill** ([portable-content.md](../../../references/portable-content.md)) — they live in project config or local agent memory.
- Message = the single **retest verdict** (PASSED ✅ / FAILED ❌), a short bullet of what was checked, a link to the Jira retest comment, and an @mention of the recipient.
- **Recipient resolution (mandatory):** read the recipient from the ticket field the project guide names (e.g. a "QA Owner" custom field) — fetch that field's value from the bug itself for **every** notify; do not reuse a name from an earlier ticket, and do not default to the Reporter. The label printed next to the mention MUST match the field the value came from (label "QA Owner" ⇒ value from the QA Owner field). Resolve it before the 6d approval popup; if the field is empty or the guide names no field, queue the recipient question in the 6d decisions popup — never ask after approval.
- This is a **result FYI**, not a "please review" request (the retest is already closed) — do not reuse the full-test-run "QA Review Requested / pending review" wording.
- If the project provides a notify helper, **use it** (it gets @mention + headers right) instead of hand-assembling the payload.

### Pre-notify review gate (mandatory, every send)

Run this checklist on the **dry-run output** before every real send — no exceptions, including resends and corrections:

1. **Ticket key + title** match the Jira issue exactly.
2. **Verdict + counts** match the posted Jira retest comment (PASS/FAIL/BLOCKED numbers add up to the cases actually run).
3. **Body bullets** describe what was actually tested against the **bug's own expected results** — no copy-paste from another ticket.
4. **Result link** opens the correct issue and `focusedCommentId` = the retest comment ID just posted.
5. **Recipient**: re-read the QA Owner field value fetched in this session for THIS ticket; confirm the resolved `<@id>` maps to that name in the roster, and the label matches the field source.
6. Only after all 5 pass → send. The dry-run text and resolved recipient are already listed in the 6d approval popup; any doubt found here → stop and report it, never send a message the user did not see in that bundle.

Skip if the project has no notify channel configured.

### Correcting a posted notification

If a verdict changes after the notification was sent (e.g. PASSED→FAILED on re-audit):

1. **PATCH the existing Discord message** — do not repost. Use `PATCH /webhooks/{wid}/{wtok}/messages/{mid}?thread_id={thread}` with the corrected content.
2. To find the message ID: use webhook GET `GET /webhooks/{wid}/{wtok}/messages/{mid}?thread_id={thread}` (bot token GET returns empty `content` without MESSAGE_CONTENT intent).
3. Update the Jira comment in place (`addCommentToJiraIssue` with `commentId` parameter) — keep the usage marker as the body's last line, unchanged.
4. Transition the ticket to the correct status.

---

## Step 10 — A question arrives after the comment was posted [low freedom]

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
   never needs the chat thread; the usage marker stays the last line. Re-run Step 7d after the edit.
5. **If an earlier statement was wrong**, correct it **visibly in both places**: the in-place comment edit
   states which claim is being corrected, **and** a follow-up message goes into the thread where the wrong
   answer was given. Never a silent edit — people have already replied to the wrong version.
6. Record which Step 6a block would have prevented the question, so the next retest writes it up front.

---
