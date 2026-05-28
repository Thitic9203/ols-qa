# Portable content rules (committed skills)

Every file under `skills/` and `commands/` MUST follow these rules. **README / install docs** may mention the default clone directory for humans only.

## MUST NOT appear in skills or commands

| Forbidden | Why |
|-----------|-----|
| Absolute paths (`/Users/...`, `C:\Users\...`, `/tmp/...`) | Tied to one machine |
| Default agent install paths (`~/.helix/...`, `~/.cursor/skills/...`) as something the agent should run | User may install elsewhere |
| `python3 scripts/...` without the user supplying the Helix install root | Assumes cwd = Helix repo |
| Real customer issue keys (`CP-1234`, `PROJ-9495`, …) | Tied to one project |
| One product’s env names (`PD3`, `mycreditport.com`, …) | Tied to one deployment |
| One repo’s Playwright layout (`playwright.e2e.config.ts`, `pw:login:pd3`, `.auth/learner-*.json`) | Tied to one codebase |
| Hardcoded Jira transition names as **required** defaults | Workflows differ per project |

## Allowed

| Allowed | Example |
|---------|---------|
| Placeholders | `{ISSUE_KEY}`, `{JIRA_DOMAIN}`, `{PROJECT}` |
| Fictional examples | `PROJ-100`, `jira.example.com`, `example.atlassian.net` |
| “In the **user’s workspace**” | `references/{PROJECT}-retest-guide.md` |
| Generic patterns | `references/*-retest-guide.md` |
| Negative references | “do not invoke `full-test-plugin`” |
| Symptom examples in gotchas | “symptom: comment contains `/Users/...`” (teaching what to avoid) |

## CSV export

MUST generate CSV **in-agent** from the approved table (UTF-8 BOM, `<br>` → newline, strip `**`), unless the **user explicitly provides** the path to their Helix installation — then you MAY run `{user-provided-root}/scripts/export-markdown-table-to-csv.py`. NEVER guess an install path.

See [csv-export-rules.md](csv-export-rules.md).

## Project config

All URLs, credentials, transition names, and Playwright commands come from:

1. The **user’s** `references/*-guide.md` in the workspace under test, or  
2. Answers collected in the session — then saved into that workspace.

Never read config from the Helix plugin repo itself during a QA run.
