# Retest bug — close out and notify (Steps 8–10)

Part of [WORKFLOW.md](WORKFLOW.md). Read right after the comment is posted.

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
- [ ] **Design reference accounted for:** the header's `Design ref:` line carries the node link(s) actually opened, or the Step 2d reason naming who was or is to be asked. A UI retest with neither is not verified — do **not** transition ([figma-design-comparison.md](../../../references/figma-design-comparison.md)).
- [ ] **No passing row whose actual result contains a word on the [customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §3 list** (`caveat`, `not verifiable`, …) — such a row is BLOCKED or PWMI, never PASSED.
- [ ] **Every passing row carries an evidence reference** — `count(passing rows) == count(evidence links)`.
- [ ] **AC/EC coverage reconciled (gate layer 6·7):** `enumerated Step 2 ER* ids == rows carrying a status + evidence (or explicit BLOCKED)` and `{n}=={total}` ([coverage gate](WORKFLOW.md#coverage-gate)). Any shortfall ⇒ do **not** transition; go back and close it.
- [ ] **FE / UI bug:** a whole-flow **MP4 for every executed case**, uploaded as an attachment **and linked in that row's `Evidence` cell** (`[▶ …mp4|^…mp4]`), the link confirmed to resolve/play from the Jira UI (Step 7d); **plus** an inline screenshot (`!file.png!`, pre-resized, no `|width`) on every **text-verification** row, confirmed rendering as a picture. **A text-only comment for an FE bug FAILS this gate** — the exact-text/values table is not a substitute for the required MP4 (and text stills).
- [ ] **Every MP4 passes all 7 layers of the [MP4 quality + correctness gate](../../../references/qa-evidence-capture.md)** — max quality, whole flow with no skip, reaches the stated target (never cut early), ER visible on screen, legible/text-backed, file integrity + case match, attached-and-link-verified. Fail-closed: any layer red = re-capture, do NOT transition.
- [ ] **API bug:** full cURL + response per row (no "same as above").
- [ ] No local file paths, no literal `<br>`/HTML markup.

If any item fails — including when evidence **cannot** be embedded (e.g. no Jira-auth upload path) — **STOP. Do NOT transition.** Report the specific gap to the user and resolve it first — an FE MP4 / still gap is never waived (WORKFLOW *MUST / NEVER*); any other item only by the user's explicit waiver of that item. Never move a bug's status on an evidence-incomplete comment.

**Go back:** If any 8·0 item fails, fix the posted comment in place (same comment id) and return to Step 7d — re-verify, then run this gate again. 8a waits.

### 8a. Transition

Read transition names from the workspace `*-retest-guide.md` (see [project-config-template.md](references/project-config-template.md)). If missing, ask once for the transition name of this round's verdict (PASSED / FAILED / PWMI / BLOCKED) in the 6d decisions popup (before approval) and save them to the guide immediately ([round-time-contract.md §2](../../../references/round-time-contract.md)); never ask after the bundle was approved.

Use `getTransitionsForJiraIssue` and match the names from config or the user.

**Not offered, or refused** (name not offered from the current status, or the transition or 8c assign errors): never pick another transition or repeat the call unchanged ([settle-and-strategize.md](../../../references/settle-and-strategize.md) §4); read status and assignee back. The comment stays; 8d runs only on a read-back Done; Step 9 still sends the verdict; 8e lists each action not done with its error and the offered transitions and asks once — another transition runs only on that live yes. The round stays open until then.

**Shape of the config (placeholders only — never use these as names):**

| Verdict | Target status | Transition name |
|---------|--------------|-----------------|
| PASSED | `{PASSED_TARGET_STATUS}` | `{PASSED_TRANSITION}` |
| FAILED | `{FAILED_TARGET_STATUS}` | `{FAILED_TRANSITION}` |
| PWMI | `{PWMI_TARGET_STATUS}` | `{PWMI_TRANSITION}` |
| BLOCKED | `{BLOCKED_TARGET_STATUS}` | `{BLOCKED_TRANSITION}` |

Never hardcode these names: the only sources are the workspace `*-retest-guide.md` and the ask-once popup above; a name not found there is asked, never guessed. Some projects use BLOCKED for FAILED retests — the guide says which.

### 8b. Find developer (project-overridable)

From changelog: last move into the project's **active development** status (often named "In Progress" — use the name from config if different) → that author's `accountId`.

### 8c. Assign (project-overridable)

`editJiraIssue` → assignee = that developer, for every verdict (the 6d default). Refused → the 8a **Not offered, or refused** rule.

**Skip 8b–8c if the project guide says "never change assignee"** (ownership is then tracked by status, not assignee).

### 8d. Unblock linked stories (run once the bug reaches Done)

**Trigger: the bug is now in Done** — i.e. the retest PASSED and Step 8a moved it there. A bug in Done
counts as fixed, and that is what releases the stories it was blocking. Run this immediately after the
8a transition succeeds (and also whenever you find a Done bug whose blocked stories were never moved).

A bug usually carries a **blocks** link to one or more stories — on the story those appear as
**"is blocked by {ISSUE_KEY}"**. Once this bug is Done the story can be ready for QA again, but only
when **nothing else** still blocks it.

1. Read the bug's link list and collect every issue it **blocks**.
2. For each of those stories, re-read the story's own **inward blocks links** ("is blocked by") — do
   NOT assume this bug was the only blocker.
3. Move the story to the project's ready-for-QA status **only if every one of its blockers is in
   Done**. Take the status/transition name from the project config (`<workspace>/references/*-retest-guide.md` /
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

Write `<workspace>/references/helix-handoff-{KEY}.md` for this round ([handoff-file-template.md](../../../references/handoff-file-template.md)) —
case list, AC/EC list, Figma node refs, Swagger version, last-round results, one fingerprint per source
([round-time-contract.md](../../../references/round-time-contract.md) §10).

**The round report ends with this line** (§1), numbers measured from the session's own timestamps,
never estimated:

`Round time: AGENT+EXEC {n} min · human wait {h} min · overrun {max(0, n-15)} min`

---

## Step 9 — QA result notify (if the project configures a channel) [low freedom]

After the transition, if the project defines a **QA notify channel** (Discord/Slack/chat), post a **retest-result** notification so the reporter / QA owner sees the outcome. It runs under the Step 6d approval bundle, which named the channel and the resolved recipient — no second approval.

**Who invoked the retest never changes this** (owner, another QA, a teammate, a slash command, a bot — mentioned or not). The **only** condition is that the project configures a channel. A retest whose comment is posted and whose ticket is transitioned but whose notify was skipped is **not closed**.

- Load channel, format, recipient, and any helper from the workspace `*-retest-guide.md` / project guide. **Never hardcode webhook URLs, tokens, machine paths, or user IDs in this skill** ([portable-content.md](../../../references/portable-content.md)) — they live in project config or local agent memory.
- Message = the single **retest verdict** (PASSED ✅ / FAILED ❌ / BLOCKED ⛔ / PWMI ⚠️ — same as the comment's summary line), a short bullet of what was checked, a link to the Jira retest comment, and an @mention of the recipient.
- **Recipient resolution (mandatory):** read the recipient from the ticket field the project guide names (e.g. a "QA Owner" custom field) — fetch that field's value from the bug itself for **every** notify; do not reuse a name from an earlier ticket, and do not default to the Reporter. The label printed next to the mention MUST match the field the value came from (label "QA Owner" ⇒ value from the QA Owner field). Resolve it before the 6d approval popup; if the field is empty or the guide names no field, queue the recipient question in the 6d decisions popup — never ask after approval.
- This is a **result FYI**, not a "please review" request — do not reuse the "QA Review Requested / pending review" wording.
- If the project provides a notify helper, **use it** (it gets @mention + headers right) instead of hand-assembling the payload.
- **The agent sends the notify itself — every time.** Load the helper's transport (webhook, credentials, flags) from where the project guide says it lives, and run the real send yourself; never hand the send command to the user. A helper skip / "transport unavailable" result is not a send: re-read the project guide's notify section and every file or note it points to, fix the input, and send once more — never state a cause you have not checked. The same result twice → stop resending ([settle-and-strategize.md](../../../references/settle-and-strategize.md) §4), report the helper's output, and leave the round open. The round is not closed until the helper prints its success line (the guide names it). Send with `?wait=true` (or the helper's equivalent); record the returned message `id` and thread id.

### Pre-notify review gate (mandatory, every send)

Run this checklist on the **dry-run output** before every real send — no exceptions, including resends and corrections:

1. **Ticket key + title** match the Jira issue exactly.
2. **Verdict + counts** match the posted Jira retest comment (PASS/FAIL/BLOCKED numbers add up to the cases actually run).
3. **Body bullets** describe what was actually tested against the **bug's own expected results** — no copy-paste from another ticket.
3b. **Body is generated, never hand-typed.** When every case passed, build the body with the helper's generator (an AC-range / env / roles option where the helper has one). Never add a bullet that restates the verdict or counts, or a status line. A helper format refusal (non-zero exit) is a gate: fix the input, never the layout.
4. **Result link** opens the correct issue and `focusedCommentId` = the retest comment ID just posted.
5. **Recipient**: re-read the QA Owner field value fetched in this session for THIS ticket; confirm the resolved `<@id>` maps to that name in the roster, and the label matches the field source.
6. Only after all 5 pass → send. The dry-run text and resolved recipient are already listed in the 6d approval popup; any doubt found here → stop and report it, never send a message the user did not see in that bundle.

**Go back:** If any of checks 1–5 fails, stop (item 6) — fix the dry-run and run this gate again from check 1 before any send.

### Correcting a posted notification

If a verdict changes after the notification was sent (e.g. PASSED→FAILED on re-audit), first list steps 2–4 by name in one approval popup:

1. `{mid}` = the message `id` recorded at the Step 9 send; read that message back with the channel's get call (Discord webhook: `GET /webhooks/{wid}/{wtok}/messages/{mid}?thread_id={thread}`). No recorded id → stop and report.
2. **Edit the existing message in place** with the channel's edit call named in the project guide (Discord webhook: `PATCH` the same path) — do not repost — after the pre-notify review gate.
3. PUT the corrected Jira comment to the same `commentId` in the Step 3 format — usage marker stays the last line.
4. Transition the ticket to the correct status.

Any step fails → stop, report the step and its response; never repost or run the next step.

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
