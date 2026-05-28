# Post-mortem template — retest workflow

Record lessons when retest work wastes time or repeats mistakes. Append to `references/post-mortem-log.md` in the user's repo if they maintain one.

## When to write

- Comment had to be re-posted (format/encoding)
- Auth failed repeatedly
- New gotcha not in `gotchas.md`
- Skill steps were insufficient

## Template

```markdown
## PM-{N}: {ISSUE_KEY} — {short title} ({DATE})

**Problem:** What happened and time lost.

**Root cause:**
1. Mechanism (not symptom only)
2. …

**Fixes applied:**
- Skill / gotchas / config updates

**Lesson:** One sentence — what to do differently next time.
```

Rules: sequential PM ids; root cause = mechanism; update `gotchas.md` when the fix is reusable.
