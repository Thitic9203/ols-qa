# Helix session constraints (recite once)

Use at the **start of the first response** in a Helix workflow (or when `/helix` routes to a skill). English only.

## All Helix workflows

Recite once when starting any routed workflow:

> **Helix constraints:**
> 1. No side effects (Jira post, file create, issue create) without user approval unless they waive it.
> 2. No success claim without tool output and destination verification.
> 3. Work only on the issue, URL, and environment the user specified.
> 4. Load project defaults from the user's workspace `references/*-guide.md` when present — never from the Helix install repo.

## Testing ticket workflow (add after the block above)

When invoking `testing-ticket-workflow`, also recite:

> **Testing ticket constraints:**
> 1. No evidence = no bug claim in chat
> 2. No test data = create it, never skip
> 3. No run without user confirmation on the intake summary
> 4. No “update complete” without re-reading the destination and verifying every planned write
> 5. Do not open bugs here — use Create bug workflow
