# Worked example (anonymized) — TC API prep

**Scope:** User service `orders` API — 4 endpoints from OpenAPI  
**Outcome:** 12 manual API TC rows → CSV in workspace + optional Jira comment

## Inputs

- API spec: Confluence page (scope: CRUD + cancel)
- Swagger: `https://api.staging.example.com/openapi.json`
- Delivery: CSV only → `references/orders_API_TC.csv`

## Repro — agent steps (abbreviated)

1. **Phase A:** Fetched Swagger; noted `POST /orders`, `GET /orders/{id}`, `PATCH` status, `DELETE` soft-delete.
2. **Phase B:** User replied `default` columns.
3. **Phase D:** Designed happy + 401 + 400 validation per endpoint.
4. **Phase E:** Caught missing 404 on `GET` — added `TC_API_Orders_05`.
5. **Phase F:** Draft in chat → user `approve`.
6. **Phase G1:** Wrote `references/orders_API_TC.md` + CSV via [csv-export-rules.md](../../../references/csv-export-rules.md).

## Output snippet

```text
Draft API test cases (not published yet)
Coverage: 4 endpoints / 12 test cases
| Test Case ID | Module / Feature | Test Title | Expected Result | Priority |
| TC_API_Orders_01 | Orders | POST /orders happy path | 201 + order id in body | High |
```

## Lessons

- Swagger `security` scheme drove 401 cases — spec PDF alone was incomplete.
- NEVER deliver before Phase F approval.
