# Coverage delta summary (after review, before full draft)

Post this block in chat **immediately after** the coverage review block and **before** the full TC table. English only.

## FE (AC/EC)

```text
━━━ Coverage delta (FE) ━━━
| AC/EC | Status | TC ID(s) | Action taken |
|-------|--------|----------|--------------|
| AC_01 | OK     | TC_x_01  | —            |
| EC_02 | GAP    | —        | Added TC_x_05 |
| —     | ORPHAN | TC_x_99  | Removed (no AC/EC) |

Summary: {n} gaps closed · {n} orphans removed · {n} scope trims
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Status values:** `OK` | `GAP` (was missing, now mapped) | `ORPHAN` (removed) | `TRIM` (out-of-scope removed) | `SPLIT` (one AC split into multiple TC)

## API (spec / Swagger)

```text
━━━ Coverage delta (API) ━━━
| Endpoint / operation | Status | TC ID(s) | Action taken |
|--------------------|--------|----------|--------------|
| POST /v1/foo       | OK     | TC_API_Foo_01 | — |
| DELETE /v1/bar     | GAP    | TC_API_Bar_01 | Added |

Out of scope (documented): {list}
Summary: {n} endpoints covered · {n} gaps closed · {n} invented rows removed
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

MUST NOT publish the full table until coverage review shows **Ready for draft: YES** and this delta is posted (even if all rows are `OK`).
