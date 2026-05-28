---
name: testing-ticket-workflow
description: |
  Test one Jira ticket with Playwright after intake and confirmation — summarize results in chat, then optionally update an external results destination.
  Use for Testing ticket from Helix, /testing-ticket, or when the user wants automated UI/API checks for a single ticket.
  Do NOT use for opening bug tickets (create-bug-workflow), retest-after-fix on a bug (retest-bug-workflow), or drafting manual TC tables (tc-fe-prep / tc-api-prep). Does not run full-app regression.
---

# Testing ticket workflow

Run **Playwright-based** testing for a **single ticket** after intake and confirmation. **Self-contained in Helix** — do not invoke `full-test-plugin`.

**This workflow does not open bug reports.** If the user wants bugs filed → route to **`create-bug-workflow`** (`/helix` → Create bug).

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

**Gates:** MUST NOT start Playwright until Phase C confirm; MUST NOT update external results until Phase G confirm — because runs and writes are costly to undo. Credentials are session-only.

**Long sessions:** optional todos per [long-workflow-todos.md](../../references/long-workflow-todos.md).

## Refusal-first (precondition gate)

MUST refuse to reach Phase B until **Ticket** and **URL** are provided — because the test plan has no target.

If **VPN** is required per user and environment is unreachable in Phase D, stop and report — do not mark scenarios PASSED without evidence.

---

## Core constraints

Recite once at the start of Phase A (first response only) from [helix-session-constraints.md](../../references/helix-session-constraints.md) — **All Helix workflows** block, then the **Testing ticket** block.

Then follow [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) for **Testing ticket** and show [intake-one-pager.md](../../references/intake-one-pager.md) (Testing ticket section).

---

## Phase A — Session intake (mandatory)

Collect these **seven** items (one grouped message when possible; skip fields already on the one-pager as done):

| Field | Required | What to collect |
|-------|----------|-----------------|
| **Ticket** | Yes | Jira key or browse URL |
| **URL** | Yes | Application under test |
| **User** | Yes* | Login (*`guest` if no login) |
| **Password** | Yes* | (*`—` if no login) |
| **VPN** | Yes | `Required` / `Not required` + note |
| **Confluence** | No | Page URL or `none` |
| **Swagger** | No | OpenAPI URL or `none` |

**Wait** until required fields are answered before Phase B.

---

## Phase B — Load context

Use [parallel-prep.md](../../references/parallel-prep.md) when Jira fetch and Confluence/Swagger are independent.

1. Fetch **Ticket** (Jira or user paste).
2. **Confluence** / **Swagger** if provided.
3. Build numbered **test plan** (in-scope, out-of-scope, API vs UI).
4. Fill [test-execution-plan-template.md](../../references/test-execution-plan-template.md) in chat (environment, auth, in-scope table, pass criteria, risks).

---

## Phase C — Confirm before Playwright (hard gate)

```text
━━━ Testing ticket — confirm before run ━━━
Ticket:      {KEY} — {one-line summary}
URL:         {url}
Login:       {user} / password provided (not shown)
VPN:         {required|not required} — {note}
Confluence:  {url or none}
Swagger:     {url or none}

Test plan ({N} scenarios):
  1. ...
Out of scope: ...

Execution plan: see filled template (preflight, evidence, pass criteria).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to start Playwright, or tell me what to change.
```

**Do not start Phase D until confirmed.**

If results contradict expectations or tests are flaky, follow [qa-debug-discipline.md](../../references/qa-debug-discipline.md) before changing pass/fail wording.

---

## Phase D — Pre-flight (mandatory)

Follow [playwright-preflight.md](../../references/playwright-preflight.md) end-to-end. MUST NOT start Phase E until **Ready to run: YES**.

---

## Phase E — Execute tests (Playwright)

Run confirmed scenarios; record **PASSED** / **FAILED** / **BLOCKED** / **NOT TESTED** with evidence (screenshots, console, network).

Internal failures: note for chat summary only — **do not create Jira/GitHub issues in this workflow.**

---

## Phase F — Summarize in this chat (mandatory)

Always post a clear summary **in the same conversation** before anything else:

### F1 — Executive summary

2–4 sentences: overall result, pass/fail counts, blockers.

### F2 — Results table

```text
| # | Scenario | Result | Notes / evidence |
|---|----------|--------|------------------|
| 1 | ...      | PASSED | —                |
| 2 | ...      | FAILED | screenshot-02.png |
```

### F3 — Defects observed (if any)

List issues found **without filing tickets**:

```text
| # | Title | Severity | Confidence | Evidence |
|---|-------|----------|------------|----------|
| 1 | ...   | High     | Confirmed  | ...      |
```

If the user wants these logged as bugs:

> Say **Create bug** from `/helix`, or ask me to switch to the **create-bug-workflow**.

**Do not proceed to Phase G until F1–F3 are posted.**

---

## Phase G — Optional: update results elsewhere

### G1 — Ask (single question)

> **Do you want me to update the test results somewhere else** (Jira comment, Google Sheet, Confluence table, CSV file, etc.)?

- **No** / **skip** / **done** → Reply: *Testing ticket session complete.* **Stop here.**
- **Yes** → Go to G2.

### G2 — Collect destination details

Ask the user to provide:

1. **Link** — full URL to the destination (Jira issue, Sheet, Confluence page, file path in repo if applicable).
2. **Columns** — which columns or fields to update (names or letters, e.g. `Result`, `Tester`, `Date`, `Notes`).
3. **Formats** — per-column rules if specific (e.g. `Result` = `PASSED`/`FAILED` only; `Date` = `YYYY-MM-DD`; language; no bare ticket keys in Jira wiki).

If anything is unclear, ask follow-ups **before** accessing the destination.

### G3 — Confirm update plan (hard gate)

```text
━━━ Confirm result update ━━━
Destination: {link}
Columns:
  - {Column A}: {format rule}
  - {Column B}: {format rule}
Rows to update: {count} — mapped from scenarios 1..N
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to apply updates, or correct the mapping.
```

**Wait for explicit confirm.**

### G4 — Access and read first

- Open or fetch the destination (browser, API, MCP, or file read).
- **Match existing layout** — headers, row order, language, status vocabulary already in use.
- For Google Sheets: read headers and sample rows before writing.
- For Jira comments: draft in chat; use v2 wiki vs v3 ADF per project guide if present.
- If access fails (auth, 403, VPN) → report exactly what failed; **do not claim success.**

### G5 — Apply updates

- Write **every** planned row/cell/comment field.
- Map each test scenario to the correct row (by TC id, row number, or user mapping).
- Include evidence references where the format allows (screenshot names, bug keys as `{{KEY}}` in Jira wiki).

### G6 — Review before “complete” (mandatory)

Before telling the user updates are done:

1. **Re-open or re-fetch** the destination.
2. **Checklist:**
   - [ ] Every scenario from Phase F2 has a corresponding update (or documented skip reason).
   - [ ] Column values match agreed formats.
   - [ ] No partial rows, empty required cells, or wrong ticket/sheet tab.
   - [ ] Jira/Confluence: comment or table visible as intended (not draft-only unless user asked draft).
3. If any mismatch → fix and re-check. **Maximum 2 fix rounds** — then report what remains blocked.

### G7 — Close

Only after G6 passes:

```text
━━━ Result update complete ━━━
Updated: {link}
Rows/fields written: {summary}
Verified: {what you re-read}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If verification failed partially, state what succeeded and what did not — NEVER say “complete” for unverified work — because partial writes look finished to stakeholders.

---

## QA closing (mandatory before session end)

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + skill-specific:

- [ ] F1–F3 posted before any external update.
- [ ] Every scenario has PASSED/FAILED/BLOCKED/NOT TESTED with evidence reference.
- [ ] If Phase G ran: destination re-read matches agreed column formats.
- [ ] Close-out includes `Verified:` (or partial-failure honesty per Phase F).
- [ ] Phase G6 fix-verify completed when Phase G ran.
- [ ] **Fresh-eyes:** re-read F2 before Phase G when **> 15 scenarios**.
- [ ] [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Testing ticket section).
- [ ] Suggest **create-bug** if F3 has defects; handoff if long run.

---

## Out of scope

- Filing bugs, retest, TC prep, full-app regression — see [skill-routing.md](../../references/skill-routing.md)

---

## Next workflows

See [skill-routing.md](../../references/skill-routing.md) — **Handoffs** after this workflow.

---

## References

| File | Use |
|------|-----|
| [session-intake.md](references/session-intake.md) | Intake fields |
| [playwright-discipline.md](references/playwright-discipline.md) | Playwright rules |
| [result-update-discipline.md](references/result-update-discipline.md) | Sheets, Jira, Confluence update rules |
| [workspace-guide-template.md](references/workspace-guide-template.md) | Optional non-secret defaults |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT open Jira/GitHub bugs in this workflow | Use create-bug-workflow |
| MUST NOT run Playwright before Phase C confirm | Wrong scope/credentials |
| MUST re-read destination after Phase G writes | Silent partial failure |
