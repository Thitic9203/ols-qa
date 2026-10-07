# Qase import format (FE TC)

The CSV attached to the Jira comment is a **Qase.io import file** for the OLS project
(`https://app.qase.io/project/OLS`). Filename: `Import_Qase_{ISSUE_KEY}.csv`
(e.g. `Import_Qase_OLS-142.csv`).

Qase import uses a column-mapping wizard — header names are free text, you map each to a
Qase field during import. Use the exact column set below; do not add the cut fields.

## Column set (use exactly these — nothing more)

| Column | Maps to Qase field | Content |
|--------|--------------------|---------|
| **AC/EC** | *custom field / leading text* | AC/EC reference as plain text — `{LABEL} — {full criterion text}` (e.g. `EC_07 — กรอก Metadata ไม่ครบ → ปุ่มส่งตรวจปิดใช้งาน ปุ่มบันทึกแบบร่างเปิดใช้งาน`) |
| **Title** | Title *(required)* | Test case name (Thai) |
| **Preconditions** | Preconditions | Full shared prep steps expanded inline (numbered continuously) + any per-case setup (Thai) — CSV is standalone; no separate shared-prep block |
| **Priority** | Priority | `High` / `Medium` / `Low` |
| **Type** | Type | `System Test` / `Unit Test` / `Integration Test` only |
| **Status** | Status | `Done` (always) |
| **Suite** | Suite | Existing OLS suite path — see Suite rules below |
| **Steps – Action** | Step action | Numbered manual steps (Thai) |
| **Steps – Expected result** | Step expected result | Numbered assertions (Thai) |
| **Steps – Data** | Step data | Test data for the step |
| **Tags** | Tags | optional; comma-separated |

### Cut fields — NEVER include

`Description`, `Postconditions`, `Severity`, `Layer`, `Behavior`, `Automation status`,
`Is flaky`, `Milestone`. Do not add them as columns even if Qase offers them.

## Field option values

| Field | Allowed values |
|-------|----------------|
| **Priority** | `High` · `Medium` · `Low` |
| **Type** | `System Test` · `Unit Test` · `Integration Test` |
| **Status** | `Done` (fixed — every row) |

> ⚠️ **AC/EC is not a native Qase field.** It maps to a custom field configured in the OLS project. If OLS has no custom field named `AC/EC` (or equivalent), this column will be silently ignored on import — no error shown. Verify the OLS custom fields before importing, and note the correct field name to map to in the import wizard.

> ⚠️ **Type and Status are NOT Qase defaults.** Stock Qase Type is
> `Functional/Smoke/Regression/…` and Status is `Actual/Draft/Deprecated`. The values
> above only import correctly if OLS has them configured as custom values. **Verify the
> OLS project's Type and Status options before import** (Qase UI → project settings, or
> the import wizard preview). If a value does not exist, the import silently resets it —
> stop and tell the user, do not let rows import with wrong Type/Status.

## Suite rules (mandatory — no duplicates)

1. **Inspect the OLS project's existing suite tree first** (Qase UI → Test cases →
   suite sidebar). Record the current suites before assigning anything.
2. If an existing suite already fits the test cases → **reuse it** (use its exact path).
3. Only propose a **new** suite when nothing fits. A new suite MUST NOT duplicate, rename,
   or collide with an existing one.
4. **Get user approval before creating any new suite.** List the proposed suite path and
   why no existing suite fits, then wait.
5. Nested suites use `Parent > Child` path notation in the CSV cell.

There is no Qase MCP in this workspace — suite inspection is done via the Qase web UI
(browser) or by the user pasting the current suite list. Never assign a suite blind.

## Step formatting in CSV

Qase accepts one of two layouts — pick one and stay consistent:

- **One row per TC** (default): all steps in the single `Steps – *` cells, numbered
  (`1.` `2.` `3.`) and newline-separated. Follow `csv-export-rules.md` cell-cleaning
  (convert `<br>`, strip tags, preserve Thai).
- **Multi-row per TC**: first row carries Title + all metadata; following rows leave
  Title/metadata blank and carry only the next step. Use only if the user asks.

## Relationship to the Jira comment table

The Jira comment keeps its existing 9-column markdown table (unchanged). This Qase CSV is
the **attachment** — same test cases, restructured for Qase import. Row count of the CSV
(by test case) MUST match the approved draft table.
