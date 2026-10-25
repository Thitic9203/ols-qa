# API test case guidelines

## Coverage per endpoint

At minimum, cover each scenario below whose condition holds for the operation:

| Scenario | Typical expected |
|----------|----------------|
| Happy path | Documented 2xx + schema fields |
| Missing auth | 401 — when the operation (or the global spec) has a `security` requirement |
| Forbidden role | 403 — when the spec or Swagger names roles/scopes for the operation |
| Invalid body | 400 with validation detail |
| Missing required field | 400 |
| Wrong type / format | 400 |
| Not found | 404 — when the path has an id parameter |
| Conflict / duplicate | 409 — when Swagger lists 409 for the operation |
| Repeat call (idempotency) | When the spec or Swagger documents idempotency (e.g. an idempotency key, or PUT/DELETE replay): repeat the same request with the same key/body → the documented status for the repeat, and the expected result names the side-effect check (e.g. "no second resource created — list count unchanged") |

Skip a scenario only when its condition does not hold, and list it under **out of scope** in the draft header.

## Priority

The **Priority** column is `High` / `Medium` / `Low` ([default-columns.md](default-columns.md)).

- Use the criticality the API spec states for an operation or flow when it states one.
- When the spec states none, use this default rule for the whole table: **High** = happy path and auth (401/403) of write operations (POST/PUT/PATCH/DELETE); **Medium** = validation and conflict errors (400/409/422) and the happy path of read operations; **Low** = read-only not-found (404), pagination, sorting and filtering edge cases. Write it in one line in the Phase F draft header (`Priority rule: default — …`) and apply it to every row; the user approves or replaces it at Phase F, and a replacement rule is applied to every row the same way.
- Never mark every row the same priority ([tc-quality-standards.md](../../../../references/tc-quality-standards.md): not "All High"; critical paths not all Medium).
- This is test case priority, not bug priority — the bug priority matrix does not apply here.

## Test Data column

Include:

- HTTP method and path (with placeholders `{id}`)
- Relevant headers (`Authorization`, `Content-Type`)
- Minimal JSON body or query string
- Reference example values from Swagger `example` when present

Never paste production passwords or live API keys.

## Expected Result column

- Lead with **HTTP status**
- Bullet key response fields or error `code` / `message`
- For lists: pagination fields if documented

## Services Impacted

Derive from:

- Swagger `tags`
- User API spec narrative
- Microservice name in path or spec diagram
