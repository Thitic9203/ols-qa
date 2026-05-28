---
name: testing-ticket-workflow
description: Test a Jira ticket with Playwright after collecting Ticket, URL, credentials, VPN, Confluence, and Swagger — confirm summary before running. Use when the user chooses Testing ticket from Helix, says test this ticket, or invokes /testing-ticket.
---

# Testing ticket workflow

Run **Playwright-based** testing for a **single Jira ticket** after a structured intake and an explicit user confirmation. Ported from the former full-test orchestrator’s ticket-scoped path — **self-contained in Helix**; do not invoke the external `full-test-plugin`.

## Communication (mandatory)

- Speak to the user in **concise English**.
- **No Playwright run** until the user confirms the intake summary (Phase C).
- **No Jira comment or transition** until the user approves a draft (Phase F).
- Credentials are **session-only** — never write passwords to repo files, logs, or Jira.

## AskUserQuestion rules

If your UI supports structured multiple-choice prompts, **all** AskUserQuestion fields must be **English only**.

Use plain chat for open-ended intake (URLs, credentials, VPN notes).

---

## Core constraints

Recite once at the start of Phase A (first response only):

> **Testing ticket constraints:**
> 1. No evidence = no bug claim
> 2. No test data = create it, never skip
> 3. No run without user confirmation on the intake summary
> 4. Disprove before confirming a defect
> 5. Every claim traces to steps, URL, or ticket text

The user may say **skip the recital** on later turns; still apply all constraints.

---

## Phase A — Session intake (mandatory)

Collect these **seven** items. If the user already provided some in the same message, only ask for what is missing.

Ask in **one** grouped message when possible (table below). Allow `N/A` or `none` only where noted.

| Field | Required | What to collect |
|-------|----------|-----------------|
| **Ticket** | Yes | Jira issue key (e.g. `PROJ-123`) or browse URL |
| **URL** | Yes | Application URL to test (portal, env, or deep link base) |
| **User** | Yes* | Login username or email (*`guest` / no login if ticket is public-only) |
| **Password** | Yes* | Login password (*`—` if no login) |
| **VPN** | Yes | `Required` / `Not required` + short note (e.g. connect OpenVPN before navigation) |
| **Confluence** | No | Page URL for extra AC, test data, or specs — or `none` |
| **Swagger** | No | OpenAPI/Swagger URL for API checks — or `none` |

**Wait until all required fields are answered** before Phase B.

Do **not** store password in any file. Optional: after a successful run, offer to save **non-secret** fields to the user’s workspace `references/{project}-testing-ticket-guide.md` using `references/workspace-guide-template.md`.

---

## Phase B — Load context (silent where possible)

1. **Jira** — Fetch `{TICKET}` (summary, description, AC, steps, environment hints, linked issues).
2. **Confluence** — If URL provided, fetch or summarize test-relevant sections (AC, tables, API notes).
3. **Swagger** — If URL provided, load spec; note endpoints that match ticket scope.
4. **Scope** — Derive a short **test plan** from ticket + Confluence:
   - In-scope scenarios (numbered)
   - Out of scope (explicit)
   - Roles / portals implied by ticket
   - API vs UI vs both

If Jira fetch fails, stop and ask the user to paste ticket text or fix access.

---

## Phase C — Confirm before Playwright (hard gate)

Show this summary and **wait for explicit approval** (`yes`, `confirm`, `go`, etc.):

```text
━━━ Testing ticket — confirm before run ━━━
Ticket:      {KEY} — {summary one line}
URL:         {url}
Login:       {user} / password provided (not shown)
VPN:         {required|not required} — {note}
Confluence:  {url or none}
Swagger:     {url or none}

Test plan ({N} scenarios):
  1. ...
  2. ...

Out of scope: ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to start Playwright testing, or tell me what to change.
```

If the user changes any field, update the summary and ask again. **Do not start Phase D until confirmed.**

---

## Phase D — Pre-flight

1. **VPN** — If required, remind the user to connect; verify reachability to `{URL}` (`curl` or browser navigation). If unreachable, stop and report — do not guess.
2. **URL** — Open base URL; detect login page vs app. Cloudflare or SSO blockers → report and ask user.
3. **Playwright** — Use project Playwright if present (`playwright.config.*`, `npx playwright test`); otherwise browser automation with the same discipline (screenshots, console errors, network failures).
4. **Secrets** — Use intake credentials only in memory for this session.

Display pre-flight result:

```text
━━━ Pre-flight ━━━
URL:       {reachable|blocked} — {status}
VPN:       {user confirmed|n/a}
Playwright:{project config|browser automation}
━━━━━━━━━━━━━━━
```

---

## Phase E — Execute tests (Playwright)

Run scenarios from the confirmed test plan **in order**.

### Per scenario

1. **Arrange** — Navigate, login if needed (stable selectors: `getByRole`, `getByLabel`, `data-testid`).
2. **Act** — Follow ticket steps; create test data when missing (see Test data rules).
3. **Assert** — Compare to ticket expected result; capture evidence:
   - Screenshot path
   - Console errors (if any)
   - Failed network requests (status, URL)
   - API response snippet if Swagger scenario

### Test data rules

Never skip with “no data.” Try: UI create → API (from Swagger) → ask user.

### Playwright discipline

- Prefer `expect` with polling over fixed sleeps.
- One failure ≠ abort whole run unless blocked (login fail, env down).
- Record **PASSED** / **FAILED** / **BLOCKED** / **NOT TESTED** per scenario.

### Findings

For each failure, draft internally:

```text
Finding: {short title}
Scenario: #{n}
Evidence: {screenshot path, error text, or response}
Confidence: Confirmed | Needs Review
```

Apply falsification: one disproof attempt before **Confirmed** (intentional design? role-only? env flake?).

---

## Phase F — Report and optional Jira

### F1 — Results table (always)

```text
| # | Scenario | Result | Evidence |
|---|----------|--------|----------|
| 1 | ...      | PASSED | —        |
| 2 | ...      | FAILED | screenshot-02.png |
```

### F2 — Defects (if any)

List **Confirmed** and **Needs Review** separately. Include steps to reproduce and file/line only if known from the codebase.

### F3 — Jira (only with approval)

Ask: “Post a test result comment on `{TICKET}`?”

- Draft comment in chat first (neutral English, `Test Result: PASSED ✅` / `FAILED ❌` per scenario).
- Match project comment format if a workspace `references/*-retest-guide.md` or `*-testing-ticket-guide.md` defines v2 vs v3.
- Post only after user approves.

Optional: transition or assign — ask separately; never auto-transition.

---

## Out of scope

- Full-app regression (every route × role × viewport) — use a dedicated full-suite workflow instead.
- Performance/load testing, pen-test, pixel-perfect Figma diff.
- Storing credentials in repo or `.env` commits.

---

## Handoff

| User asks | Route to |
|-----------|----------|
| Retest a **bug fix** only | `retest-bug-workflow` |
| **Manual FE TC** from story AC/EC | `tc-fe-prep-workflow` |
| Post-mortem on a fixed defect | User’s post-mortem skill if available |

---

## References (this skill)

| File | Use |
|------|-----|
| [session-intake.md](references/session-intake.md) | Field definitions and examples |
| [playwright-discipline.md](references/playwright-discipline.md) | Selectors, evidence, flakiness |
| [workspace-guide-template.md](references/workspace-guide-template.md) | Optional saved non-secret config |
