# Contract Testing Patterns (Pact)

## Core Concept

```
Consumer                    Provider
(frontend/mobile)           (API server)

writes expectations    →    pact file (.json)    →    verifies against real API
"I expect GET /users        {interactions: [...]}      runs pact file as test suite
to return {id, name}"
```

Contract tests are **not** integration tests. They don't test that business logic is correct — they test that the *shape* of the API matches what both sides agreed on.

## Consumer-Driven Contracts

The consumer writes what it needs. The provider verifies it can deliver it.

**Why consumer-driven:** The consumer knows what fields it actually uses. The provider shouldn't dictate what the consumer must accept.

## Matcher Types

| Matcher | Use when | Example |
|---------|---------|---------|
| `like(value)` | Type matters, exact value doesn't | `like('Alice')` → any string |
| `eachLike(obj)` | Array with at least one item matching shape | `eachLike({id: 1})` |
| `regex(pattern, value)` | Format matters | `regex(/\d{4}-\d{2}-\d{2}/, '2024-01-15')` |
| `integer(n)` | Must be an integer | `integer(42)` |
| `decimal(n)` | Must be a number | `decimal(9.99)` |
| exact value | Exact match required | `'active'` (status enum) |

**Use `like()` for most fields** — don't assert exact values, assert shape. Tests will be too brittle otherwise.

## State Handlers (Provider Side)

State handlers seed the database before each interaction is verified.

```typescript
stateHandlers: {
  'users exist': async () => {
    await db.users.create([{ id: 1, name: 'Alice' }]);
  },
  'no users exist': async () => {
    await db.users.deleteAll();
  },
  'user 99 does not exist': async () => {
    await db.users.delete(99);
  },
}
```

**Naming convention:** State names are prose descriptions in the consumer test. Match them exactly in provider handlers.

## Common Failure Patterns

### Provider added required field
```
Pact failure: expected response body to match
  Expected: {id, name}
  Actual:   {id, name, role}   ← new required field
```
Fix: Consumer adds `role: like('user')` to its expectation — but first, check if consumer actually needs it.

### Provider renamed a field
```
Expected: {userId: like(1)}
Actual:   {user_id: 1}        ← naming convention change
```
Fix: Provider keeps backward-compatible alias, or both sides update + version the contract.

### Provider changed error shape
```
Expected: {error: like('Not found')}
Actual:   {message: 'Not found', code: 404}
```
Fix: Agree on error envelope format — document it, update consumer test.

## Pact Broker vs Local Files

| Approach | When to use | Setup |
|----------|------------|-------|
| Local pact files | Single repo / monorepo | `pactUrls: ['./pacts/*.json']` |
| Pactflow (free tier) | Separate repos, CI integration | `pactBrokerUrl: process.env.PACT_BROKER_URL` |
| Self-hosted broker | Air-gapped / on-prem | Docker: `pactfoundation/pact-broker` |

## CI Integration Pattern

```yaml
# Run consumer tests → publish pacts → verify provider
jobs:
  consumer:
    steps:
      - run: npx jest tests/contract/consumer/
      # pact files are artifacts
  
  provider:
    needs: consumer
    steps:
      - run: npx jest tests/contract/provider/
```

## What NOT to Test with Contracts

- Business logic (use unit/integration tests)
- Auth/session behavior (use integration tests)  
- Exact data values (use `like()` matchers)
- UI rendering (use E2E tests)
- Performance (use perf tests)
