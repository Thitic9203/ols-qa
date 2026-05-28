# Default columns — TC API Prep

| Column | Content guidance |
|--------|------------------|
| **Test Case ID** | `TC_API_{Module}_{nn}` — unique |
| **Module / Feature** | Tag, domain, or path group (e.g. `auth`, `orders`) |
| **Services Impacted** | e.g. `- order-service` · `- api-gateway` |
| **Test Title** | e.g. `POST /v1/orders — create order with valid payload` |
| **Precondition** | Bearer token, tenant id, existing record ids, env base URL |
| **Test Data** | Method, path, headers, body/query samples (redact secrets) |
| **Expected Result** | `HTTP 201` + body fields; or `HTTP 400` + error code/message |
| **Priority** | High / Medium / Low |

## Optional columns (only if user adds)

| Column | When useful |
|--------|-------------|
| Test Steps | Numbered call sequence (auth → call → assert) |
| Endpoint | Full path template `/v1/orders/{id}` |
| HTTP Method | GET, POST, PUT, PATCH, DELETE |
| Acceptance Criteria | Trace id to story AC_01 |
| Notes | Rate limits, idempotency keys, feature flags |
