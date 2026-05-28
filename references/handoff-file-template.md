# Helix handoff file template

Save as `references/helix-handoff-{KEY}.md` in the **user’s workspace**. English only.

```markdown
# Helix handoff — {KEY}

**Workflow:** {tc-fe-prep | tc-api-prep | retest-bug | testing-ticket | create-bug}
**Updated:** {ISO date}
**Verdict:** {COMPLETE | PARTIAL | BLOCKED}

## Scope

- Issue / target: {KEY or URL}
- Environment: {name or URL — no passwords}

## Approved by user

- [ ] Draft table / test plan / bug draft
- [ ] Publish / run / create issues

## Done

- {bullet}

## Artifacts

| File | Path |
|------|------|
| … | references/… |

## Blocked / next

- {what remains}
- Suggested next: {/command or skill name}

## Resume prompt

Copy into a new chat:

> Continue Helix {workflow} for {KEY}. Read references/helix-handoff-{KEY}.md and proceed from "Blocked / next".
```

Do not store passwords or API tokens in this file.
