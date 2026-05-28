# Subagent patterns (Helix QA)

Helix stays **portable** — no mandatory subagent framework. Use these patterns only when the host agent supports delegation and the task is **read-only analysis**.

## Good uses

| Task | Subagent does | Parent keeps |
|------|---------------|--------------|
| Parse large Playwright trace / network log | Summarize failed requests, status codes | Jira draft, user approval |
| Compare Swagger vs draft TC table | Gap list by operationId | Coverage review gate |
| Search workspace for spec paths | Candidate file list | Final path choice with user |
| Parallel doc fetch (Confluence + Jira) | Raw excerpts | Synthesis and AC mapping |

## Bad uses

| Task | Why not |
|------|---------|
| Post Jira comment | Side effect — parent only after approval |
| Transition issue | Same |
| Run Playwright without user-approved plan | Execution belongs in testing-ticket workflow |
| “Fix the test until green” | Violates debug discipline — report root cause |

## Two-stage review (optional)

For large TC drafts:

1. **Subagent A** — AC/EC coverage only ([ac-ec-coverage-review](../skills/tc-fe-prep-workflow/references/ac-ec-coverage-review.md) criteria).  
2. **Parent** — merges findings, asks user, posts review block.

Do not treat subagent output as **Ready for draft: YES** without parent re-check.

## Prompt skeleton

```text
You are a read-only QA analyst. Do not post to Jira or run destructive commands.
Input: {paths or trace}
Output: bullet list — finding, evidence (file:line or URL), severity
Do not recommend code fixes unless asked.
```
