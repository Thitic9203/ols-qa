# API test case guidelines

## Coverage per endpoint

At minimum consider:

| Scenario | Typical expected |
|----------|----------------|
| Happy path | Documented 2xx + schema fields |
| Missing auth | 401 when security required |
| Forbidden role | 403 when RBAC applies |
| Invalid body | 400 with validation detail |
| Missing required field | 400 |
| Wrong type / format | 400 |
| Not found | 404 for path id |
| Conflict / duplicate | 409 when applicable |

Skip scenarios not applicable; list **out of scope** in the draft header.

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
