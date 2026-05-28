# CONTEXT — domain language

## Helix

**Helix:** QA assistant persona — routes to TC prep, testing ticket, or retest workflows. User-facing language: English.

## TC FE prep

| Term | Meaning |
|------|---------|
| **Story** | Default Jira target for TC comments (not sub-tasks) |
| **Shared data prep** | Numbered steps above the TC table |
| **Precondition column** | After shared prep, before Test Steps |
| **ADF** | Jira rich comment format for large tables |

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
| **Intake** | Seven fields: Ticket, URL, User, Password, VPN, Confluence, Swagger |
| **Confirm gate** | User must approve summary before Playwright runs |
| **Ticket guide** | Optional `references/*-testing-ticket-guide.md` (no passwords) |

## Placeholders

Use `{ISSUE_KEY}`, `{JIRA_DOMAIN}`, `{PORTAL}` — never commit real customer ticket numbers in skill files.
