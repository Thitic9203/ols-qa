# Swagger / spec diff (optional — API TC prep)

Run when the user says Swagger **changed**, **new version**, **regression on API TCs**, or provides **old + new** spec URLs/files. Run **after** Phase A sources are loaded, **before** Phase D design.

## Inputs

| Input | Required |
|-------|----------|
| Current Swagger/spec | Yes (already in Phase A) |
| Previous Swagger/spec | Yes — URL, file path, or git ref the user names |
| Existing TC set (optional) | User path or prior `references/*_API_TC.md` in workspace |

If previous version is missing, ask once — do not invent a baseline.

## Steps

1. **Fetch both** OpenAPI documents (same auth/VPN rules as Phase A).
2. **Diff** at operation level:
   - Added / removed paths or methods
   - Request schema changes (required fields, types, enums)
   - Response status or schema changes
   - Auth / security scheme changes
3. **Map to TC impact:**

| Change type | TC action |
|-------------|-----------|
| New operation | Add new `TC_API_*` rows |
| Removed operation | Mark old TC **deprecated** or remove with user confirm |
| Breaking request/response | Update steps + expected for mapped TCs |
| Non-breaking additive | Optional new row or note in Precondition |

4. Post **Swagger diff summary** in chat:

```text
━━━ Swagger diff summary ━━━
Baseline: {label or date}
Current:  {label}
Added operations: {n} — {list}
Removed: {n} — {list}
Changed: {n} — {list with TC IDs to update}
No TC change needed: {n}
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

5. Continue Phase D using the **current** spec only; apply the impact table when naming `TC_API_*` rows.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST NOT delete TC rows silently | User may still need regression on old API |
| MUST ask before removing coverage for deprecated endpoints | Contract may still be in production |
