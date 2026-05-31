# Test.md format (agent-native test cases)

**Single source of truth** for Helix's Test.md export — a structured Markdown that is both human-readable and directly runnable by another agent (no parsing of prose tables needed).

> **Status:** Helix-defined interpretation. An official "Test.md" spec (announced May 2026, TestMu) could not be verified at authoring time, so this file defines a concrete, ISTQB-grounded format. **If/when the official spec lands, update only this file + [scripts/export-test-md.py](../scripts/export-test-md.py)** — every workflow links here, so the change is one place.

## Why (not a replacement)

Test.md is an **additive** delivery option alongside CSV / Excel / Jira comment — never a replacement. CSV stays the default for spreadsheets; Test.md is for agent hand-off (Playwright agent, CLI runner) and PR-review reading.

## Mapping: ISTQB attribute → Test.md field

Source attributes from [tc-quality-standards.md](tc-quality-standards.md).

| ISTQB attribute | Test.md field |
|-----------------|---------------|
| Unique ID | `## {id}` heading + `id:` |
| Title | heading text after `—` |
| Precondition | `precondition:` |
| Test Steps | `**Steps:**` numbered list |
| Test Data | `test_data:` |
| Expected Result | `**Expected:**` list |
| Priority | `priority:` |
| Traceability | `traceability:` |
| Module/Feature (API) | `module:` |
| Services Impacted (API) | `services:` |

Unmapped TC columns are emitted as extra `key: value` lines (lower-cased, spaces→`_`) so no data is lost.

## Structure

```markdown
---
suite: {ISSUE_KEY or feature}
format: test.md/v0 (helix)
source: {jira key / spec ref}
count: {N}
---

## TC-LOGIN-001 — Submit valid credentials logs the user in

- id: TC-LOGIN-001
- priority: High
- traceability: JIRA-123 / AC-1
- precondition: User account exists and is active
- test_data: user=valid@example.com, password=valid

**Steps:**
1. Open the login page.
2. Enter the email and password.
3. Click Submit.

**Expected:**
- User lands on the dashboard.
- Session cookie is set.
```

## Rules

- One `##` block per test case; heading = `## {id} — {title}`.
- Field lines are `- key: value`; keep `—` for empty (matches table).
- `**Steps:**` = numbered list, one imperative action per line (atomic).
- `**Expected:**` = bullet list, one observable result per line.
- UTF-8, `.test.md` suffix (e.g. `{ISSUE_KEY}.test.md`).
- Emit **exactly** the rows shown in chat — never invent cases (same rule as CSV).
- Portable: no host paths, secrets, or real customer keys.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST keep Test.md additive to CSV/Excel | Existing spreadsheet users must not break |
| MUST source rows from the reviewed chat table | No fabricated cases (parity with csv-export-rules) |
| MUST keep format spec only here | One edit point when the official spec ships |
| NEVER drop a TC column on conversion | Unmapped columns become `key: value` lines |

## Delivery & script

- Generator: [scripts/export-test-md.py](../scripts/export-test-md.py) — reads the same one-table Markdown that [export-markdown-table-to-csv.py](../scripts/export-markdown-table-to-csv.py) reads.
- Offered alongside CSV/Excel in tc-fe-prep and tc-api-prep delivery options.
- See also [csv-export-rules.md](csv-export-rules.md) (sibling export path).
