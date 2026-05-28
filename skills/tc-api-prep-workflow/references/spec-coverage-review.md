# API test cases — spec & Swagger coverage review

Run **after Phase D (design)** and **before Phase F (draft in chat)**. Pair with [tc-quality-standards.md](../../../references/tc-quality-standards.md) for ISTQB / 29119-3 row quality.

---

## Goal

Prove the table matches **in-scope API behaviour** from the user’s **API spec** and **Swagger/OpenAPI** — complete for agreed scope, no invented endpoints, no out-of-scope or redundant cases.

---

## Build the endpoint coverage matrix (mandatory)

From Phase A load + user API spec scope:

| Endpoint (method path) | In spec scope | Swagger present | Covered by TC ID(s) | Out of scope reason |
|------------------------|---------------|-----------------|---------------------|---------------------|
| POST /orders | Yes | Yes | TC_API_Orders_01–03 | — |
| DELETE /internal/debug | No | Yes | — | Spec excludes internal |

Rules:

- Every **in-scope** endpoint/method from the API spec must have ≥1 TC (or group row with explicit “covered by” set).
- Swagger-only paths **not** in spec → default **out of scope** unless user explicitly includes them.
- Spec-required behaviour **without** a matching Swagger path → flag **spec/Swagger gap** to user; do not invent URL.

---

## Spec alignment (สอดคล้อง API spec)

| Check | PASS when |
|-------|-----------|
| Scope boundary | Only modules/flows the spec describes are covered |
| Business rules | Status transitions, error codes, side effects from spec appear in Expected Result |
| Auth model | Spec security (API key, OAuth, roles) reflected in cases |
| Data rules | Required fields, limits, enums from spec appear in Test Data / steps |

---

## Swagger alignment (สอดคล้อง Swagger)

| Check | PASS when |
|-------|-----------|
| Method + path | Match Swagger operation (including path params) |
| Request body / query | Fields match schema properties used in TC |
| Responses | Expected status codes exist in Swagger for that operation (or documented extension in spec) |
| Security scheme | 401/403 cases when `security` applies |

---

## Scope discipline (ไม่กาว · ไม่เพ้อ · นอกสโคป)

| Check | FAIL examples |
|-------|----------------|
| **No invented endpoints** | TC for paths not in spec or Swagger |
| **No out-of-scope APIs** | Deprecated/internal endpoints user did not include |
| **No duplicate intent** | Same happy path repeated for identical payload with no new assertion |
| **No glue cases** | “Call API and check response is OK” without field/status checks |
| **No fantasy contracts** | Expected fields not in schema or spec |

Document **explicit out-of-scope list** in the review block (endpoints or scenario types skipped and why).

---

## Review output (post in chat before draft table)

```text
━━━ API TC coverage review ━━━
Sources: spec {link/summary} · Swagger {url}
In-scope endpoints: {N} · Test cases: {M}

Endpoint coverage: complete — YES | gaps: {list}
Out of scope (documented): {bullet list or "none"}
Spec/Swagger gaps flagged: {list or "none"}
Quality (ISTQB/29119-3): PASS | FIX rows: {ids}

Ready for draft: YES | NO — {reason}
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then post the **Coverage delta** table per [coverage-delta-template.md](../../../references/coverage-delta-template.md) (API section).

MUST NOT post the full draft table until **Ready for draft: YES** and the delta table is posted.
