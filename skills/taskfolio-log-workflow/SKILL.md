---
name: taskfolio-log-workflow
description: |
  Fill the user's own Taskfolio timesheet (week view) for the current week from evidence of what they actually did each day — Jira changes, bugs they opened, Slack, Google Calendar — so nothing is typed from memory. Proposes a per-day table, validates every entry's time, project and completeness, saves only after the user confirms, then re-reads every saved entry. Never submits the week.
  Use when the user says ลง taskfolio, ลง timesheet, ลงเวลางาน, fill taskfolio, log timesheet, or /taskfolio-log.
  Do NOT use for leave requests, for another person's timesheet, for clicking Submit week, or for logging work in Jira worklogs.
metadata:
  proactive_triggers:
    - /taskfolio-log
    - fill taskfolio
    - log my timesheet
    - ลง taskfolio
    - ลง timesheet
    - ลงเวลางาน
---

# Taskfolio log

Announce once: `Using **taskfolio-log-workflow** to fill this week's Taskfolio from evidence.`

Talk to the user in their language. Write to Taskfolio **only after the user confirms the table** (step 4). **NEVER click Submit week** — submitting is the user's decision.

Follow [user-communication.md](../../references/user-communication.md), [skill-rules-style.md](../../references/skill-rules-style.md) and [portable-content.md](../../references/portable-content.md).

## Contents

- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Step 1 — Read the week](#step-1--read-the-week)
- [Step 2 — Evidence per day](#step-2--evidence-per-day)
- [Step 3 — Propose (show, do not save)](#step-3--propose-show-do-not-save)
- [Step 4 — Validation gate (approval gate)](#step-4--validation-gate-approval-gate)
- [Step 5 — Apply (after the user confirms)](#step-5--apply-after-the-user-confirms)
- [Step 6 — Fix-verify (mandatory after saving)](#step-6--fix-verify-mandatory-after-saving)
- [QA closing](#qa-closing-mandatory-before-done)
- [Must-read files](#must-read-files)
- [Out of scope](#out-of-scope)

## Refusal-first (precondition gate)

MUST NOT start step 2 until all of these hold:

| Input | Required | Because |
|-------|----------|---------|
| macOS + Google Chrome, View → Developer → **Allow JavaScript from Apple Events** on | Yes | `scripts/tf.sh` drives the open tab through AppleScript |
| Taskfolio week page open and signed in | Yes | The skill reads and writes that tab only |
| Taskfolio URL (or a unique part of it) | Yes | Read it from the workspace's `references/taskfolio-guide.md`; if missing, ask once and save it there |
| VPN off (`scripts/vpn_check.sh` → `VPN_OFF`) | Yes | Taskfolio must be used with the VPN off |
| Atlassian, Slack and Google Calendar connectors | Yes — say which is missing | Evidence comes only from these; a missing source is reported, never read as "no work" |

If anything is missing, stop and say exactly what to fix.

Helpers (run by their path inside this skill folder; never guess an install path):
- `scripts/vpn_check.sh` → `VPN_ON` / `VPN_OFF`
- `scripts/tf.sh <file.js> [tab-url-substring]` → runs a JS file in the Taskfolio tab and prints the result. Write JS files to the session scratchpad; escape non-ASCII as `\uXXXX`. `execute` does not await promises — click in one call, read in the next. Wrap each call in an IIFE with `try/catch` returning the error text (a bare statement returns `null` on error).

---

## Step 1 — Read the week

1. Click **This week**, then **Refresh from Calendar**, then read the page again. If refresh fails ("Could not read Google Calendar"), use the Calendar connector in step 2 and add missing meetings with `+ Add`.
2. From `document.body.innerText`, per day column (MON … FRI): drafts and saved entries, each with start–end, project and title.
   - Jira draft: key (e.g. `PROJ-100`) + title.
   - Meeting draft: `Meeting · <subcategory>` + title + `HH:MM–HH:MM · duration`.
3. Only days up to **today** in the user's timezone (default Asia/Bangkok). Leave future days untouched.

## Step 2 — Evidence per day

Per day 00:00–24:00. If a source fails, say so in the proposal.

| Source | Query |
|--------|-------|
| Me | `atlassianUserInfo` → accountId; Slack user id from the Slack tool description |
| Jira changes | JQL `issue in updatedBy("<accountId>", "<day>", "<day+1>")` (`currentUser()` does not work inside `updatedBy`). Per hit, read the issue with changelog + comments; keep only the user's changes/comments inside the day, with time. Large results are saved to a file — filter with `jq`. |
| Bugs opened | `reporter = currentUser() AND issuetype = Bug AND created >= "<day>" AND created < "<day+1>"` |
| Slack | Sent: `from:<@ME> on:<YYYY-MM-DD>`. Mentions: `on:<YYYY-MM-DD> -from:<@ME>`, keep hits containing `<@ME`. Read a thread only when the hit alone is unclear. |
| Calendar | Primary calendar events of the day; drop events the user declined. |

Write an **evidence list** per day: one line per distinct piece of work (card + event, meeting, bug, support thread) with its time. Step 4's completeness check runs against this list.

## Step 3 — Propose (show, do not save)

Target **at least 8 h per working day**. 8 h is a minimum, not a cap — never cut evidenced work to fit.

- **Meetings:** keep with Calendar start–end. Remove meetings the user declined or that are not on their Calendar. A meeting attended but never answered still counts — ask only when unsure.
- **Jira drafts:** keep a card only if that day has evidence for it; otherwise propose **Delete** with "no evidence this day".
- **Same card on several days:** each day's entry names a different event (TC written → TC reviewed → test started → blocked → done) in Description. No new event that day → no entry.
- **Bug opened that day:** its own entry (reproduce, steps, evidence), longer than a status move.
- **Support work** (help for customers or developers in Slack or chat) → category Support & Operations.
- **Evidence with no draft:** propose **+ Add**.
- **Hours:** 8 h − meetings, split across kept cards by amount of evidence, in 15 m steps, minimum 30 m.
- **Lunch 12:00–13:00** (unless the workspace guide says otherwise): morning slots end by 12:00, afternoon slots start at 13:00. An entry may sit inside lunch only when evidence shows work in that hour.
- **Subcategory** (Testing): TC written → Test case design; TC reviewed → Review test case; test run / result → Test execution; data setup → Prepare test data; regression / smoke → matching name. Unsure → ask.
- **Project — every entry MUST have one:**

| Entry | Project |
|-------|---------|
| Jira card `ABC-123` | `jira-ABC` (the key prefix) |
| Meeting or support whose title/thread names a product or squad that has a Project option (stand-up, planning, review, retro, grooming …) | that project |
| A mapping recorded in the workspace's `references/taskfolio-guide.md` (e.g. "titles containing X → project Y") | that project |
| Cannot tell | **Ask the user**, then save the answer to the guide. Never leave "No project" silently. |

  If the needed option is not in the Project select, stop and ask.

Show one table per day, sorted by start:

| Start–End | Entry | Action | Project | Subcategory | Evidence |
|-----------|-------|--------|---------|-------------|----------|

with the day total, then the Step 4 validation block. **Wait** for changes or confirmation.

## Step 4 — Validation gate (approval gate)

Run on the final table, including saved entries that stay, before asking to confirm and again right before saving. Show each check as ✅/❌. **MUST NOT save while any check is ❌** — because a wrong time or project is filed under the user's name and is hard to spot after submit.

**Time**
- [ ] Every entry has start **and** end, end > start, logged = end − start.
- [ ] Non-meeting entries are on 15 m steps and ≥ 30 m.
- [ ] Meetings match Calendar start–end exactly.
- [ ] No two entries in one day overlap (compare sorted start/end pairs).
- [ ] No entry crosses lunch unless the table cites evidence in that hour.
- [ ] Day total = sum of entries and ≥ 8 h (or the user agreed otherwise).

**Project**
- [ ] Every entry has a Project.
- [ ] Jira entries: Project = key prefix.
- [ ] Meetings / support: Project = product named in the title, thread or guide mapping.

**Completeness**
- [ ] Every evidence-list line maps to an entry, or is listed under "not logged" with a reason the user approved (e.g. merged into another entry).
- [ ] Every attended Calendar meeting has an entry.
- [ ] Every draft on the page is kept or marked Delete.
- [ ] Every working day up to today has entries.

## Step 5 — Apply (after the user confirms)

One entry at a time:
1. Open it: draft or saved entry → its `.entbtn` inside its day column; new entry → `button.addbtn[data-add=YYYY-MM-DD]`. Wait for `[role=dialog]`. Find a day column with `button.addbtn[data-add=…]` → `.closest('.day-b')`. Match entries by exact text or index, never by a loose `includes` on a parent element — it can open the wrong entry.
2. Set selects with the native setter + `change`:
   `Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('change',{bubbles:true}))`.
   Find selects by their options, never by index or `name`: Category = has option `testing`; Subcategory = the select right after Category; Project = has options starting `jira-`; Start = has `06:00` and no "(…)" texts; End = options like `10:00 (30 m)`. A saved entry's dialog has an extra Date select first. Text inputs: `#j` Jira issue, `#d` Description (native setter + `input` event).
3. Set Category → **Subcategory** (required — the form drops the project otherwise) → **Project** → **Start** → **End**. Start + End fill Logged time. Read Project, Start, End and Logged back from the dialog **before** saving; mismatch → fix, do not save.
4. Click **Add entry** (draft / new) or **Save** (saved entry). Wait ~6 s before the next call; the list re-renders.
5. Delete = the entry's Delete, then confirm **Delete entry**.

Gotchas:
- Subcategory values: Testing → `test-design`, `test-exec`, `regression`, plus generated ids for Smoke testing, Review test case, Prepare test data, Review test result — pick by option text. Meeting → `sprint-ceremony`, Internal, External. Support → `prod-support`, `release-deploy`, `it-support`.
- Start and end are required — without them **Add entry** silently keeps the dialog open.
- `+ Add` for a Jira card: type the key into `#j` (no suggestion list), then set Project yourself — it does not fill from the key.
- The list does **not** refresh after a `+ Add` save — reload before checking, and never re-submit because it "looks missing" (that creates duplicates).
- Logged-time `+`/`−`: one click per `execute` call. Preset buttons (`15m 30m 1h …`) **set** the value, they do not add.
- A reload drops injected helpers — re-inject after every reload. A reload may pull new Jira drafts; include them in the next validation.

## Step 6 — Fix-verify (mandatory after saving)

Reload, re-inject helpers, then for **each confirmed day**:
1. List every entry with start–end, project and title.
2. Compare with the confirmed table row by row: same count, same start–end, same project, no extra, missing or duplicate entry.
3. Day `WORKED` = confirmed total.
4. Re-run the Step 4 checks on what the page shows.

Mismatch → fix that entry and verify again. **Max 2 rounds** — then report what is still wrong.

---

## QA closing (mandatory before "done")

Follow [skill-rules-style.md — doubt and fix-verify](../../references/skill-rules-style.md#qa-closing-doubt-and-fix-verify).

1. **Assume** the first table is wrong — the Step 4 gate and Step 6 re-read catch it.
2. Skill-specific:
   - [ ] Every saved entry was re-read with start–end and project (Step 6), not only the day total.
   - [ ] Evidence lines not logged are listed with the user-approved reason.
   - [ ] Submit week was **not** clicked.
   - [ ] Close-out includes `Verified:` with counts — entries saved / deleted per day, per-day totals, week total vs 40 h.
3. Shared checklist: [qa-closing-shared.md#shared-checklist](../../references/qa-closing-shared.md#shared-checklist).

End with a reminder that the user submits the week themselves when ready.

## Must-read files

Every file the shared closing rules require, one hop from here. Read each at the point its line names.

- Read [qa-closing-shared.md](../../references/qa-closing-shared.md) before saying done; shared closing checklist.
- Read [qa-evidence-gates.md](../../references/qa-evidence-gates.md) before any completion claim.
- Read [verify-closing-checklist.md](../../references/verify-closing-checklist.md) before the `Verified:` close-out line.
- Read [agent-rationalizations.md](../../references/agent-rationalizations.md) before you skip, shorten or reorder any step or gate.
- Read [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) before invoking or switching skills.
- Read [long-workflow-todos.md](../../references/long-workflow-todos.md) at the start of every run (this procedure has 6 steps); keep the todo list.
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a `tf.sh` call errors or a save does not stick.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [round-time-contract.md](../../references/round-time-contract.md) when reporting durations or totals.
- Read [session-closing.md](../../references/session-closing.md) at session end.

## Out of scope

Leave requests, other people's timesheets, Submit week, Jira worklogs, editing past weeks unless the user names them.
