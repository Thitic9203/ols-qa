# CONTEXT — domain glossary

Terms used across Helix skills. For install, menu, and versioning see [README.md](README.md) and [docs/DOC-MAP.md](docs/DOC-MAP.md).

## TC FE prep

| Term | Meaning |
|------|---------|
| **Story** | Default Jira target for FE TC comments (not sub-tasks) |
| **Shared data prep** | Numbered steps above the TC table |
| **Precondition column** | After shared prep, before Test Steps |
| **ADF** | Jira rich comment format for large tables |

## TC API prep

| Term | Meaning |
|------|---------|
| **API Spec** | Scope doc, Confluence, or narrative beyond raw Swagger |
| **Swagger** | OpenAPI URL or file — primary source for paths and schemas |
| **Default columns** | Test Case ID, Module/Feature, Services Impacted, Title, Precondition, Test Data, Expected Result, Priority |
| **Delivery** | Comment at user link and/or CSV/Excel in workspace |

## Retest bug

| Term | Meaning |
|------|---------|
| **Retest** | Re-test after a dev fix — not generic "verify" |
| **Bug API** | Backend/API — Swagger, full cURL/response, v3 ADF |
| **Bug FE** | UI — screenshots required, v2 wiki markup |
| **Project config** | `references/*-retest-guide.md` in the user's repo |
| **v2 / v3** | Jira REST comment API versions (wiki vs ADF) |

## Testing ticket

| Term | Meaning |
|------|---------|
| **Intake** | Ticket, URL, User, Password, VPN, Confluence, Swagger |
| **Confirm gate** | User approves summary before Playwright |
| **Result update** | Optional destination link + columns + verify |

## Create bug

| Term | Meaning |
|------|---------|
| **Target** | Jira or GitHub URL |
| **Format** | User template or Helix default draft |
| **Verify** | Re-open each created issue URL |

## Placeholders

`{ISSUE_KEY}`, `{JIRA_DOMAIN}`, `{PORTAL}` — never commit real customer keys in skill files.
