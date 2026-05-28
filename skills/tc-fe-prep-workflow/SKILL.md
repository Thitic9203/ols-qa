---
name: tc-fe-prep-workflow
description: Prepare frontend manual test cases from a Jira story (AC/EC), draft a reviewable comment with a 9-column table, export matching CSV, and publish to the specified story only. Use when the user asks to write FE test cases, draft TC for a story, prepare manual QA cases from acceptance criteria, post a test-case table to Jira, or export story TCs to CSV. Triggers include "FE test cases", "manual TC", "draft TC comment", "AC/EC test cases", "prepare test cases for Jira".
---

# TC FE Prep Workflow

Prepare **frontend manual test cases** from a Jira **story** (acceptance criteria + edge cases), get user approval in chat, then publish **one comment** on **that story only** with a markdown table plus a downloadable CSV attachment.

**Portable:** Works in any AI agent that can read this skill. **Project-agnostic:** No hardcoded repos, paths, or ticket numbers.

## Communication (mandatory)

- Respond to the user in **clear English** for this entire workflow.
- Use plain language suitable for QA and developers.
- Ask one focused question at a time when setup is missing.

## Prerequisites (read before Step 0)

1. **Confirm the target issue key** with the user (usually the **story**, not a sub-task) before posting anything to Jira.
2. **Scope = AC/EC on that story only** — do not add cases from other tickets unless they map to an AC/EC row on this story.
3. **Never post to Jira** until the user approves the draft in chat (unless they explicitly waive approval).
4. **Never comment on or attach files to** sub-tasks, linked issues, or other tickets without explicit permission.
5. Read the **full story**: description, AC table, EC, UI constraints (buttons shown/hidden), data preconditions.
6. Align UI labels with the **actual product** (repo POMs, specs, or user-provided names) — do not invent button text.
7. **Two-layer preconditions:**
   - **Above the table:** shared data-prep steps (numbered list) for every TC.
   - **Precondition column:** item 1 = confirm shared prep is done; items 2+ = what to do before Test Steps for that row.
8. **Multi-item cells:** use `1.` `2.` `3.` on **separate lines** (in markdown tables use `<br>` between items — Jira does not honor `\n` inside table cells).
9. **One markdown table row = one test case** — do not wrap multiple TC rows inside one cell.
10. Split cases per **QA practice** (happy / boundary / negative) — not required to be 1:1 with AC rows.
11. **Jira long comments** may be truncated via some APIs — verify row count and formatting on Jira after publish (see `references/publish-options.md`).
12. Do **not** read or exfiltrate `.env` / secrets; use the user's authenticated browser session or approved integrations for Jira.

---

## Step 0 — Obtain the story

If the user did not provide a ticket key or URL:

> Which Jira story should I prepare FE test cases for? Please share the issue key or browse URL.

**Wait for an answer.** Extract `{ISSUE_KEY}` and `{JIRA_DOMAIN}` from the URL when possible.

---

## Step 1 — Load or create project config

Search the **current workspace** (not fixed paths on the agent host):

1. Look for `references/*-tc-fe-prep-guide.md` or `references/*-fe-tc-guide.md`.
2. If found → read it and skip to Step 2.
3. If not found → ask the user the questions in `references/project-config-template.md` (one section at a time) and offer to save answers into `references/{PROJECT}-tc-fe-prep-guide.md` in their repo.

Config should capture: Jira domain, default story vs sub-task policy, portal names, shared login role, CSV example column headers (if different from default), and optional publish method preference.

---

## Step 2 — Extract requirements

From the Jira story, build a checklist:

| Source | Extract |
|--------|---------|
| AC rows | Actor, action, expected UI/API outcome |
| EC rows | Invalid input, validation messages, blocked save |
| Description | Status names, tabs, field limits, forbidden actions |
| Linked docs | Seed data steps (reference by ticket id in text only) |

**Must not:** Copy unrelated business rules from other stories unless user confirms they apply to an AC/EC here.

---

## Step 3 — Design test cases

Default **9 columns** (change only if user specifies otherwise):

| Column | Purpose |
|--------|---------|
| Acceptance Criteria | AC_0n / EC_0n label + short summary |
| Services Impacted | e.g. `- Service Name` |
| Test Case ID | Stable id e.g. `TC_Feature_01` |
| Test Title | Action + expected outcome (no `[Tag]` prefixes unless user wants them) |
| Precondition | Shared prep done + per-case setup |
| Test Data | Values to enter |
| Test Steps | Numbered manual steps |
| Expected Result | Numbered assertions |
| Priority | High / Medium / Low |

**Shared data prep (above table)** — typical pattern:

1. Log in with the required role.
2. Navigate to the feature area.
3. Open the correct tab or filter.
4. Ensure required data state exists (with "if missing, create via …" referencing another story id if needed).
5. Identify the target entity used across TCs.

Add a **Precondition column note** above the table explaining that the column means: *after shared prep, before Test Steps*.

---

## Step 4 — QA self-review (1–2 rounds)

Before showing the user:

- [ ] Every AC and EC on the story covered at least once.
- [ ] No orphan cases (no AC/EC mapping).
- [ ] Steps are executable manually without jargon.
- [ ] Expected results are observable (UI text, toast, status, column values).
- [ ] Schedule/status invariants included where AC requires (e.g. status unchanged after edit).
- [ ] No duplicate cases unless intentional boundary splits.

---

## Step 5 — Draft in chat (approval gate)

Post the full draft in the conversation:

```text
Draft TC FE as below

**Shared data preparation (all TCs):**
1. ...
2. ...

**Note — Precondition column:** After completing shared prep above, complete the numbered items in Precondition before Test Steps.

| Acceptance Criteria | ... |
| --- | --- |
| ... one row per TC ... |
```

State clearly: **Not posted to Jira yet.**

**Wait for approval** or edit requests. Apply feedback, then re-show the changed sections.

---

## Step 6 — Save artifacts in the user's workspace

After approval, write files **inside the user's project** (paths relative to workspace root):

| File | Purpose |
|------|---------|
| `references/{ISSUE_KEY}_FE_TC.md` | Canonical markdown (prep block + table) |
| `references/{ISSUE_KEY}_FE_TC.csv` | UTF-8 BOM CSV export of the same rows |

Generate CSV from the markdown table:

- Header row = column names.
- Convert `<br>` in cells to newlines in CSV.
- Strip `**` markdown bold for CSV plain text.

Optional helper scripts may live in the user's repo under `scripts/` — see `references/publish-options.md`. **Do not assume** those scripts exist; create minimal export logic in-agent if needed.

---

## Step 7 — Publish to Jira (story only)

**Target:** `{ISSUE_KEY}` story the user specified.

**Content:** Single comment (unless user asked otherwise) containing:

1. Intro line: `Draft TC FE as below`
2. Shared prep + precondition note
3. Full table (bold header cells)
4. Footer: short note that CSV matches the table + **clickable attachment link** on the same issue

**Publish methods** (choose what works in the environment — details in `references/publish-options.md`):

| Method | When to use |
|--------|-------------|
| Atlassian MCP / REST | Short comments; **verify** full table rendered |
| ADF JSON + browser session | Large tables; upload CSV via authenticated session |
| User pastes | Fallback if automation unavailable |

**After publish — mandatory verification on Jira UI:**

- [ ] All TC rows visible (not header only).
- [ ] Multi-line cells show separate lines.
- [ ] CSV attachment present and opens with correct row count.
- [ ] Comment is on the **story**, not a sub-task.

---

## Step 8 — Handoff

Tell the user:

- Issue key and that the comment was updated or created.
- Number of test cases.
- Where artifacts were saved in **their** repo (`references/...`).
- Anything blocked (Jira auth, truncation, missing data).

---

## Reference files

| File | Content |
|------|---------|
| [prerequisites.md](references/prerequisites.md) | Expanded pre-flight checklist |
| [jira-formatting.md](references/jira-formatting.md) | Tables, `<br>`, ADF, CSV footer |
| [gotchas.md](references/gotchas.md) | Common failures |
| [markdown-template.md](references/markdown-template.md) | Copy-paste skeleton |
| [project-config-template.md](references/project-config-template.md) | First-time project questions |
| [publish-options.md](references/publish-options.md) | MCP vs browser vs manual |

---

## Must not (summary)

| Must not | Why |
|----------|-----|
| Post before approval | User gate |
| Comment on sub-tasks / other issues | Scope |
| Reference agent-machine absolute paths in Jira | Other users cannot reproduce |
| Assume MCP success without UI check | Truncation |
| Add TC outside story AC/EC | Traceability |
| Use `\n` inside Jira markdown table cells | Renders as one line |
