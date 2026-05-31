# Test.md format (agent-native test cases)

**Single source of truth** for Helix's Test.md export. Test.md is TestMu AI's Markdown-based, **agent-native** test format for **Kane CLI**: plain-language steps interpreted and replayed by an AI agent at runtime — no selectors, no code.

> **Source (official, content verified):** `LambdaTest/agent-skills` › [playwright-skill/reference/test-md-format.md](https://github.com/LambdaTest/agent-skills/blob/main/playwright-skill/reference/test-md-format.md) (TestMu AI / Kane CLI, announced 14 May 2026). This file records that spec verbatim-in-substance + how Helix maps a reviewed TC table onto it. If upstream changes, update **only** this file + [scripts/export-test-md.py](../scripts/export-test-md.py).

## Why (additive, not a replacement)

Test.md is an **additive** delivery option alongside CSV / Excel / Jira comment — never a replacement. CSV stays the default for spreadsheets; Test.md is for agent hand-off (Kane CLI, Playwright agent) and PR-review reading.

## Official anatomy

A Test.md file has two parts: **YAML frontmatter** + a **Markdown body of steps written as plain-English prose**.

Minimal example (verbatim shape from the spec):

```markdown
---
name: Login Test
url: https://example.com/login
---

# Login Test

1. Type "user@test.com" in the email field
2. Type "password123" in the password field
3. Click the "Sign In" button
4. Verify the dashboard is visible
```

### Frontmatter fields (official)

| Field | Required | Meaning |
|-------|----------|---------|
| `name` | yes | Human-readable test name |
| `url` | yes | Starting URL for the test |
| `tags` | no | List of labels, e.g. `[smoke, login]` |
| `config` | no | Per-test overrides — `viewport: { width: 1280, height: 720 }`, `timeout: 30000` |

(Only these four. `config` sub-keys are overrides; if omitted, Kane uses defaults.)

### Writing steps (official)

- Steps are a **numbered or bulleted Markdown list** in plain English; **one action or assertion per step**.
- **Actions:** `Click ...`, `Type ... in ...`, `Navigate to ...`
- **Assertions:** `Verify ...`, `Expect ...`, `Check that ...`
- Optionally group related steps under **H2 section headings** (`## Setup`, `## Purchase`) — these are readability groups, not required.
- **Data capture/reuse:** `Store the order number as orderId` … later `Verify the confirmation shows orderId`.
- **Imports:** `@import ./flows/login.test.md` reuses a shared flow.

### Naming, layout, running (official)

- Suffix `.test.md`; group by feature under `tests/` (e.g. `tests/auth/login.test.md`).
- Run: `kane-cli testmd run tests/auth/login.test.md` or `kane-cli testmd run tests/ --tag smoke`.
- Steps record on first run, replay deterministically after; pass/fail is binary from a real browser run.

## Helix mapping: reviewed TC table → Test.md

A Helix TC table is a *suite* of cases. Helix maps **one reviewed TC row → one `## {title}` section** whose steps are a numbered plain-English list (source attributes from [tc-quality-standards.md](tc-quality-standards.md)):

| TC table column | Test.md target |
|-----------------|----------------|
| Test Case ID / Title | `## {title} ({id})` section heading (id kept for traceability) |
| Precondition | first numbered step: `Ensure {…}` |
| Test Data | numbered step: `Use test data: {…}` |
| Test Steps | numbered action steps (plain English, as written) |
| Expected Result | numbered assertion steps: `Verify {…}` |
| Priority / Module | frontmatter `tags` |
| (suite / ISSUE_KEY) | frontmatter `name` + `# {name}` H1 |
| (environment URL) | frontmatter `url` — from intake/guide or `--url`; if unknown, a `REPLACE_ME` placeholder the user must fill |

`url` is **required** by the spec but TC tables often lack it — the exporter takes `--url` and otherwise writes a `REPLACE_ME` placeholder so the gap is visible, never silently wrong. `config` is omitted by default (optional).

## Rules

- Emit **exactly** the reviewed rows shown in chat — never invent cases (same rule as CSV).
- UTF-8, `.test.md` suffix (e.g. `{ISSUE_KEY}.test.md`).
- Portable: no host paths, secrets, or real customer keys.
- Keep the format spec only here — one edit point if upstream changes.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST follow the official anatomy (frontmatter `name`/`url` + `# title` + numbered plain-English steps) | So Kane CLI / agents can actually replay it |
| MUST use action/assertion phrasing (`Click`, `Type`, `Verify`, `Expect`, `Check that`) | Kane interprets steps by their verbs |
| MUST keep Test.md additive to CSV/Excel | Existing spreadsheet users must not break |
| MUST source rows from the reviewed chat table | No fabricated cases (parity with csv-export-rules) |
| MUST surface a missing `url` as `REPLACE_ME`, not guess | `url` is required; a silent wrong value breaks the run |
| NEVER invent frontmatter fields beyond name/url/tags/config | Stay byte-faithful to the spec |

## Delivery & script

- Generator: [scripts/export-test-md.py](../scripts/export-test-md.py) — reads the same one-table Markdown that [export-markdown-table-to-csv.py](../scripts/export-markdown-table-to-csv.py) reads; `--url` sets the entry URL, `--self-test` runs an internal check.
- Offered alongside CSV/Excel in tc-fe-prep and tc-api-prep delivery options.
- Sibling export path: [csv-export-rules.md](csv-export-rules.md).
