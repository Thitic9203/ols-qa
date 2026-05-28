# Workspace guide discovery (every workflow)

Run **once** at the start of a workflow (after reciting session constraints, before detailed intake). Search the **user’s open workspace** — never the Helix install repo.

## Works best with

| Capability | Why |
|------------|-----|
| Jira access (MCP or browser logged in) | Fetch stories, post comments, transitions |
| Browser automation | UI retest, Jira UI verify, Playwright |
| Playwright in the **user’s project** | Testing ticket workflow |
| Workspace `references/*-guide.md` | Stable URLs, formats, transitions without re-asking |

If a capability is missing, **stop and report** — do not invent credentials or URLs.

## Guide glob patterns by workflow

| Workflow | Search under `references/` |
|----------|----------------------------|
| TC FE prep | `*-tc-fe-prep-guide.md`, `*-fe-tc-guide.md` |
| TC API prep | `*-tc-api-prep-guide.md`, `*-api-tc-guide.md` |
| Retest bug | `*-retest-guide.md` |
| Testing ticket | `*-testing-ticket-guide.md`, `*-testing-guide.md` |
| Create bug | `*-create-bug-guide.md`, `*-bug-guide.md` |

Also read any file the user names explicitly.

## When a guide is found

1. Read the full file.
2. Post a **Config loaded** block (English only):

```text
━━━ Project config loaded ━━━
Guide: {filename}
Using: {bullet 1}
       {bullet 2}
       {bullet 3}
       … (max 6 bullets — URLs redact secrets)
Skipped questions: {list fields you will not re-ask}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

3. Use guide values for URLs, Jira format (v2/v3), transitions, default columns, VPN notes.

## When no guide is found

1. Say no workspace guide was found for this workflow.
2. Use the workflow’s `references/project-config-template.md` (or Phase A intake) — **one question at a time**.
3. Offer to save answers to `references/{PROJECT}-{workflow}-guide.md` in the user’s repo.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST search workspace `references/` first | Repeatable team defaults |
| MUST NOT read `~/.helix` or Helix repo guides as project config | Wrong project |
| MUST NOT store production passwords in committed guides | Security |
