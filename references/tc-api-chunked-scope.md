# TC API prep — chunked scope (large APIs)

Use when Swagger or the API spec is **large** (many paths, tags, or versions) so one pass would miss coverage or exhaust context.

## When to chunk

- More than **~15 operations** in scope for one ticket, or  
- User says “whole service” / “all endpoints”, or  
- Multiple tags/modules with different auth or base paths.

## Chunking rules

1. **Define chunks** with the user (or from Jira scope): by **tag**, **resource**, or **path prefix** — one chunk = one reviewable draft.  
2. **One chunk per session segment** — finish coverage review + draft approval for chunk A before starting B unless user asks parallel.  
3. **Coverage delta per chunk** — use [coverage-delta-template.md](coverage-delta-template.md); roll up at the end.  
4. **Swagger diff** — if spec changed mid-work, run [swagger-diff-phase.md](swagger-diff-phase.md) before expanding scope.

## Per-chunk checklist

```text
Chunk: {name} — paths: {list or tag}
[ ] Spec section read for this chunk only
[ ] Swagger operations listed (count: N)
[ ] AC/EC or scope traceability for this chunk
[ ] Coverage review: Ready for draft YES/NO
[ ] Draft table approved by user
```

## Handoff between chunks

If stopping mid-API, write [handoff-file-template.md](handoff-file-template.md) with:

- Completed chunks + row counts  
- Next chunk id + first path to cover  
- Open questions (auth, env, missing examples)

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST NOT claim “full API covered” after one tag only | Scope honesty |
| MUST get user sign-off per chunk before merge to master sheet | Avoid silent scope creep |
