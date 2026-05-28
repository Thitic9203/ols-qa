---
name: tc-fe-prep-workflow
description: |
  Prepare frontend manual test cases from a Jira story (AC/EC), draft a 9-column table in chat, export CSV, and publish one comment on that story only.
  Use when the user asks for FE test cases, manual TC from acceptance criteria, draft TC comment on Jira, or TC FE Preparation from Helix (/tc-fe-prep).
  Do NOT use for API-only Swagger test cases (tc-api-prep-workflow), Playwright execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bug tickets (create-bug-workflow).
proactive_triggers:
  - FE test cases
  - manual TC
  - draft TC comment
  - AC/EC test cases
  - prepare test cases for Jira
  - /tc-fe-prep
  - TC FE Preparation
---

# TC FE Prep Workflow

Prepare **frontend manual test cases** from a Jira **story** (acceptance criteria + edge cases), get user approval in chat, then publish **one comment** on **that story only** with a markdown table plus a downloadable CSV attachment.

**Portable:** Works in any AI agent that can read this skill. **Project-agnostic:** No hardcoded repos, paths, or ticket numbers.

## Communication (mandatory)

Follow [user-communication.md](../../references/user-communication.md). Ask one focused question at a time when setup is missing.

Follow [skill-rules-style.md](../../references/skill-rules-style.md) for MUST/NEVER, refusal-first, and QA closing.

## Refusal-first (precondition gate)

MUST refuse to start until the user provides a **Jira story key or browse URL** — because TC rows must trace to AC/EC on a specific issue.

If missing, stop with the refusal template from skill-rules-style.md (list missing items; do not invent a story).

## Prerequisites (read before Step 0)

Read [references/prerequisites.md](references/prerequisites.md) and [references/jira-formatting.md](references/jira-formatting.md).

**Before Step 0:** confirm the **story** issue key with the user; NEVER post to Jira until they approve the draft in chat — because premature comments are hard to retract cleanly.

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

Generate CSV from the approved markdown table per [csv-export-rules.md](../../references/csv-export-rules.md) (in-agent by default; never assume a Helix install path on the agent host).

See [references/publish-options.md](references/publish-options.md) for Jira delivery.

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

**After publish — mandatory fix-verify on Jira UI:**

- [ ] All TC rows visible (not header only).
- [ ] Multi-line cells show separate lines.
- [ ] CSV attachment present and opens with correct row count.
- [ ] Comment is on the **story**, not a sub-task.

If any check fails → fix and re-verify (max 2 rounds) before handoff.

---

## QA closing (mandatory before "done")

Follow [skill-rules-style.md — doubt and fix-verify](../../references/skill-rules-style.md#qa-closing-doubt-and-fix-verify).

1. **Assume** the first draft table had gaps (Step 4 exists for this reason).
2. Skill-specific:
   - [ ] Every AC/EC on the story covered; CSV row count matches table rows.
   - [ ] Jira UI matches approved draft (not MCP output alone).
   - [ ] Close-out includes `Verified:` after Jira re-open.
3. Shared checklist: [skill-rules-style.md](../../references/skill-rules-style.md#shared-closing-checklist-every-workflow).
4. Optional fresh-eyes: re-read draft comment before Step 6 if table is long.

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
| [worked-example.md](references/worked-example.md) | Anonymized end-to-end sample |
| [scripts/README.md](scripts/README.md) | Optional CSV helper pointer |

---

## Out of scope

- API manual TC from Swagger only → `tc-api-prep-workflow`
- Executing tests or Playwright → `testing-ticket-workflow`
- Retest after dev fix → `retest-bug-workflow`
- Filing bugs → `create-bug-workflow`

---

## MUST / NEVER (summary)

| Rule | Because |
|------|---------|
| MUST refuse without story key/URL | No traceable AC/EC source |
| MUST NOT post before user approves draft | Irreversible without edit noise |
| MUST NOT comment on sub-tasks or other issues | Scope is one story |
| MUST NOT reference agent-machine absolute paths in Jira | Other users cannot reproduce |
| MUST NOT claim publish success without Jira UI check | MCP truncation |
| MUST NOT add TC outside story AC/EC | Traceability |
| MUST NOT use `\n` inside Jira markdown table cells | Renders as one line |
