# Helix handoff file template

Save as `references/helix-handoff-{KEY}.md` in the **user’s workspace**. English only.

Retest / testing ticket / smoke: write it at the close of **every round** and fill the "Round state"
and "Source fingerprints" sections. At the start of round N, fetch each fingerprint fresh; a matching
source is not re-read in full, a changed or missing one is re-read
([round-time-contract.md §10](round-time-contract.md#10-per-ticket-state-and-fingerprints)).

```markdown
# Helix handoff — {KEY}

**Workflow:** {tc-fe-prep | tc-api-prep | retest-bug | testing-ticket | create-bug}
**Updated:** {ISO date}
**Verdict:** {COMPLETE | PARTIAL | BLOCKED}

## Scope

- Issue / target: {KEY or URL}
- Environment: {name or URL — no passwords}

## Round state (retest / testing ticket / smoke)

- Round: {N}
- Case list: {case id · title · in scope this round | out of scope this round}
- AC/EC list: {id · one-line summary}
- Figma node refs: {screen · node link · width(s)}
- Swagger version: {version or spec URL + hash — or N/A}
- Last-round results: {case id · PASSED | FAILED | BLOCKED | NOT TESTED · evidence path}

## Source fingerprints (captured at close of round {N})

| Source | Fingerprint |
|--------|-------------|
| Ticket | `updated` {timestamp} · comment count {n} |
| Figma file | `lastModified` {timestamp} |
| Swagger spec | hash {sha} |
| Build | version {id — or "not exposed"} |

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
