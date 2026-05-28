---
name: create-bug-workflow
description: Open bug reports on Jira or GitHub after collecting target link, format template, and bug details — confirm before creating. Use when user chooses Create bug from Helix or invokes /create-bug. Separate from testing-ticket-workflow.
---

# Create bug workflow

File **one or more bug reports** on the tracker the user names (Jira, GitHub Issues, etc.). Ported from the former full-test **Phase 6** — **self-contained in Helix**; do not invoke `full-test-plugin`.

## Communication (mandatory)

Read [user-communication.md](../../references/user-communication.md).

- **English only** for all questions, options, confirmations, and summaries — **never Thai**, even if the user writes in Thai.
- **AskUserQuestion / popups:** every field English only.
- **No issue created** until the user confirms the intake + bug drafts (Phase C).
- **No evidence, no issue** — every bug needs observable behavior or measurable error.
- Verify each created issue **exists at the URL** before saying done (Phase F).

---

## Phase A — Intake (one message, three parts)

Ask in **one** grouped message (fill in only what the user has not already provided):

### A1 — Where to open bugs (required)

> **Where should I open the bug(s)?** Please provide the target link or identifier, for example:
> - Jira: project URL, board URL, or project key + issue type (e.g. Bug)
> - GitHub: repo URL (`https://github.com/owner/repo`) or `owner/repo`

Support **one target per run** unless the user explicitly asks for both Jira and GitHub (then treat as two targets with separate confirms).

### A2 — Bug format (required)

> **Is there a required format or example?** For example:
> - Paste a template or link to an example issue
> - “Use Helix default” (behavioral title + What happens / Expected / Steps / Environment)
> - Project rules (Jira v2 wiki for FE, v3 ADF for API — if user specifies, **lock** for the session)

If the user says “Helix default”, use the draft structure in [bug-draft-template.md](references/bug-draft-template.md).

### A3 — Bug information (required)

> **What bug(s) should I open?** Provide for each:
> - Title or short summary
> - What happens / expected behavior
> - Steps to reproduce
> - Severity (Critical / High / Medium / Low)
> - Evidence (screenshots, errors, URLs) — attach paths or paste text

The user may reference findings from a **prior testing-ticket** run in the same chat — reuse that evidence; do not invent details.

**Wait** until A1–A3 are sufficient to draft. Ask follow-ups only for gaps.

---

## Phase B — Parse target

| Target | Detect | Pre-flight |
|--------|--------|------------|
| **GitHub** | `github.com/owner/repo` | `gh auth status`; repo exists |
| **Jira** | Domain + project key from URL | MCP `getVisibleJiraProjects` or ask user to confirm browser login |

If pre-flight fails, report and stop — do not create issues silently.

---

## Phase C — Confirm before create (hard gate)

Show:

```text
━━━ Create bug — confirm before filing ━━━
Target:     {Jira PROJ / GitHub owner/repo}
Format:     {user template name or Helix default}
Bug count:  {N}

Draft summaries:
  1. [{Severity}] {Module} — {title one line}
  2. ...

(Full drafts below — review each body)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to create all listed bugs, or specify edits.
```

Then post **full drafts** (one block per bug) per [bug-draft-template.md](references/bug-draft-template.md).

**Do not call `gh issue create`, `createJiraIssue`, or browser create until the user confirms.**

---

## Phase D — Create issues

Follow [posting-discipline.md](references/posting-discipline.md).

### GitHub

```bash
gh issue create --repo <owner/repo> \
  --title "<title>" \
  --label "bug,severity:<level>" \
  --body "<body>"
```

Capture returned issue URL.

### Jira

1. Lock **v2 wiki** (FE/UI) vs **v3 ADF** (API) per user format — do not switch mid-session.
2. Prefer Atlassian MCP `createJiraIssue`.
3. On MCP failure → JXA + Chrome fallback per posting-discipline (ASCII-only script, dry-run before post).

Attach screenshots to Jira before embedding `!file.png|width=600!` in wiki bodies.

---

## Phase E — Falsification (before create)

For each bug, if not already validated in a prior test:

- One disproof attempt: intentional design? role-only? flake?
- Drop or mark **Needs Review** — only create **Confirmed** / user-approved **Likely** items.

---

## Phase F — Verify and close (mandatory)

Before “all bugs created”:

1. List each issue with **URL or key** from tool output (not guessed).
2. Open or fetch each link — confirm title/summary visible.
3. If any create failed → report which succeeded and which failed.

```text
━━━ Create bug — complete ━━━
| # | Target  | Issue              | Severity |
|---|---------|--------------------|----------|
| 1 | Jira    | PROJ-456 (link)    | High     |
Created: {N}/{N} — verified at destination.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Out of scope

- Running a full test pass → `testing-ticket-workflow`
- Retesting an existing bug fix → `retest-bug-workflow`
- Posting test **results** to Sheets/Confluence → testing ticket Phase G

---

## References

| File | Use |
|------|-----|
| [bug-draft-template.md](references/bug-draft-template.md) | Default draft layout |
| [posting-discipline.md](references/posting-discipline.md) | GitHub + Jira posting, JXA rules |
