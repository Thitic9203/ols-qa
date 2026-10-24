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

Skip a scenario only when its condition does not hold, and list it under **out of scope** in the draft header.

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
