# Test Data Management Patterns

## Knowledge Sources
- [xUnit Test Patterns — Meszaros](http://xunitpatterns.com/Patterns%20for%20Managing%20Temporary%20Persistent%20Test%20Data.html)
- [faker.js](https://fakerjs.dev/) / [Faker (Python)](https://faker.readthedocs.io/)
- [GDPR Article 25 — Data Protection by Design](https://gdpr-info.eu/art-25-gdpr/)

## Test Data Strategies Comparison

| Strategy | Isolation | Speed | Realism | Maintenance |
|----------|-----------|-------|---------|-------------|
| Factory + Transaction rollback | ✅ High | ✅ Fast | ⚠️ Synthetic | ✅ Low |
| Static fixtures | ⚠️ Shared | ✅ Fast | ⚠️ Static | ⚠️ Medium |
| Seed scripts | ⚠️ Shared | ⚠️ Slower | ✅ Realistic | ⚠️ Medium |
| Anonymized prod snapshot | ⚠️ Shared | ❌ Slow | ✅ High | ❌ High |
| Synthetic generation | ✅ High | ⚠️ Medium | ✅ Configurable | ✅ Low |

## PII Categories That Must Be Masked

| Data Type | Masking Approach |
|-----------|-----------------|
| Full name | `faker.person.fullName()` |
| Email | `user-{uuid}@test.invalid` |
| Phone | `+66-000-000-0000` |
| Address | `123 Test St, Test City, 00000` |
| Date of birth | Random date in safe range (1970-2000) |
| National ID / SSN | `000-00-0000` |
| Credit card | Stripe test cards only (4111...) |
| Passport number | `TEST12345678` |
| IP address | `192.0.2.x` (TEST-NET RFC 5737) |

**Rule:** `.test.invalid` TLD can never receive real email (RFC 2606).
**Rule:** TEST-NET IPs (192.0.2.0/24) are never routable.

## Factory Pattern Best Practices

```typescript
// ✅ Good: unique by default, overridable
export function createUser(overrides = {}) {
  return { email: `u-${uuid()}@test.invalid`, ...overrides };
}

// ❌ Bad: hardcoded values cause collision
export function createUser() {
  return { email: 'test@test.com' }; // breaks on 2nd run
}
```

## Transaction Rollback Pattern

```typescript
let trx: Transaction;
beforeEach(async () => { trx = await db.transaction(); });
afterEach(async () => { await trx.rollback(); });
```

Benefits: no cleanup code, no data leaks between tests, full speed.

## Seed Script Requirements

1. **Idempotent** — safe to run multiple times (`upsert`, not `insert`)
2. **Deterministic** — same seed = same data (use fixed seeds for `faker`)
3. **Minimal** — only data tests actually need
4. **Documented** — comments explaining each entity created

```typescript
faker.seed(12345); // deterministic
```
