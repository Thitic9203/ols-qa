# OLS Project Guide

Project-specific config for all Helix workflows in this workspace.
AI reads this file before asking any OLS-related questions.

## Jira

| Field | Value |
|-------|-------|
| Domain | `skilllane.atlassian.net` |
| Project key | `OLS` |
| Project ID | `10791` |
| Board ID | `818` |
| Board URL | https://skilllane.atlassian.net/jira/software/projects/OLS/boards/818/backlog |

### Workflow statuses

| Status | Notes |
|--------|-------|
| To Do | Backlog |
| In Progress | Dev working |
| REVIEWING | PR / code review |
| DEPLOYING | Being deployed |
| READY TO TEST | QA pickup point |
| TESTING | QA in progress |
| BLOCKED | Blocked (dev or QA) |
| Done | Closed |

### QA lifecycle

1. Dev deploys → transitions to **READY TO TEST**
2. QA picks up → transitions to **TESTING**
3. Pass → transition to **Done** (or follow team convention)
4. Fail → create bug, transition ticket to **BLOCKED**

### Directed transitions (for retest-bug workflow)

| Transition | From → To |
|-----------|-----------|
| pick up by QA | READY TO TEST → TESTING |
| approve by QA | TESTING → Done |
| block | any → BLOCKED |
| Deploy done | DEPLOYING → READY TO TEST |

## Confluence

| Field | Value |
|-------|-------|
| Space | `PLUT` |
| OLS folder | https://skilllane.atlassian.net/wiki/spaces/PLUT/folder/3592814638 |
| Base URL | https://skilllane.atlassian.net/wiki/spaces/PLUT |

## Figma

| Field | Value |
|-------|-------|
| Working file | https://www.figma.com/design/EzwBjyCfqCCof1MuPdQUsq/OLS_Working-file |
| Main frame | node-id `226-94221` |

## Qase (test management)

| Field | Value |
|-------|-------|
| Project | `OLS` |
| Project URL | https://app.qase.io/project/OLS |
| FE TC Jira-format file | `Draft_Jira_{ISSUE_KEY}.csv` — 10-column Jira table schema; attached to story comment |
| FE TC Qase import file | `Import_Qase_{ISSUE_KEY}.csv` — Qase schema; attached to story comment alongside Draft_Jira (schema: `skills/deprecated/tc-fe-prep-workflow/references/qase-import-format.md`) |
| Type values | `System Test` · `Unit Test` · `Integration Test` *(verify these exist as OLS custom Type values before import)* |
| Status value | `Done` *(verify exists as OLS custom Status value before import)* |
| Suite | reuse existing OLS suite; new suite only with user approval, never a duplicate |

## Test Environment

| Env | URL |
|-----|-----|
| Staging | *(not configured — ask user and update this table)* |
| Production | *(not configured — ask user and update this table)* |

## Default assignee / reporter

*(not configured — ask user and update this table)*

## Preferred CSV format

Default: UTF-8, comma-separated, with header row (per `references/csv-export-rules.md`).
