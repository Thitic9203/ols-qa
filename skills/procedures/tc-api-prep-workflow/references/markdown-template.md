# Markdown template — API test cases

```markdown
Draft API test cases as below

**Sources:** API spec: {API_SPEC_REF} · Swagger: {SWAGGER_URL}

**Out of scope:** {optional list}

| **Test Case ID** | **Module / Feature** | **Services Impacted** | **Test Title** | **Precondition** | **Test Data** | **Expected Result** | **Priority** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC_API_Orders_01 | Orders | - order-service | POST /v1/orders — valid create | 1. Valid bearer token for role `user`.<br>2. Base URL `{ENV}`. | Method: POST<br>Path: /v1/orders<br>Body: `{ "sku": "A1", "qty": 1 }` | 1. HTTP 201<br>2. Body contains `orderId` | High |
```

Add columns only if the user confirmed extras in Phase B.
