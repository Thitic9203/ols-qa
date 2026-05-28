---
name: create-bug-workflow
description: |
  Open bug reports on Jira or GitHub after collecting target link, format template, and bug details — confirm before creating.
  Use when the user chooses Create bug from Helix, invokes /create-bug, or wants issues filed from test findings.
  Do NOT use for Playwright test runs (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), posting manual TC tables (tc-fe-prep / tc-api-prep), or updating test result sheets without filing bugs.
proactive_triggers:
  - create bug
  - file a bug
  - open Jira bug
  - gh issue create
  - /create-bug
  - Create bug
---

# Create bug workflow

File **one or more bug reports** on the tracker the user names (Jira, GitHub Issues, etc.). Ported from the former full-test **Phase 6** — **self-contained in Helix**; do not invoke `full-test-plugin`.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

**Gates:** MUST NOT create issues until Phase C confirm. MUST NOT file without evidence. MUST verify each URL in Phase F before saying done — because create APIs can return IDs for empty bodies.

## Refusal-first (precondition gate)

MUST refuse to reach Phase B until **A1 (target)**, **A2 (format)**, and **A3 (bug details)** are sufficient to draft — because guessing tracker fields produces junk issues.

If pre-flight fails (auth, repo missing), stop — MUST NOT create issues silently.

On first response after constraints, follow [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) for **Create bug**, then show [intake-one-pager.md](../../references/intake-one-pager.md) (Create bug section).

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

## Phase F — Fix-verify and close (mandatory)

After Phase D create calls:

1. List each issue with **URL or key** from tool output (not guessed).
2. **Fix-verify round 1:** Open or fetch each link — confirm title/summary and body match approved draft.
3. If mismatch (wrong project, truncated body, wrong severity) → fix via edit API or recreate per user direction → **re-fetch** each link.
4. **Maximum 2 fix-verify rounds** — then report partial success honestly.
5. If any create failed → report which succeeded and which failed.

MUST NOT say “all bugs created” until at least one full fix-verify round passes — because create APIs can return success with wrong content.

```text
━━━ Create bug — complete ━━━
Verdict: CREATED {N}/{N} — verified at destination
| # | Target  | Issue              | Severity |
|---|---------|--------------------|----------|
| 1 | Jira    | PROJ-456 (link)    | High     |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + skill-specific:

- [ ] Every created issue has URL/key from tool output (not guessed).
- [ ] Each URL opened or fetched — title visible.
- [ ] Close-out includes `Verdict: CREATED x/y`.
- [ ] [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Create bug section).
- [ ] Suggest **retest** after fix; handoff if blocked.

---

## Out of scope

- Running a full test pass, retest, TC prep, result updates — see [skill-routing.md](../../references/skill-routing.md)

---

## References

| File | Use |
|------|-----|
| [bug-draft-template.md](references/bug-draft-template.md) | Default draft layout |
| [posting-discipline.md](references/posting-discipline.md) | GitHub + Jira posting, JXA rules |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT invent reproduction steps | False bugs |
| MUST verify each issue URL in Phase F | Silent partial failure |
| MUST lock Jira v2/v3 per session when user specifies | Rewrite cost |
