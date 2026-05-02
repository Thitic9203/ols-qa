---
name: qa-data
description: "[QA Process · Test Data Management] Test data strategy, factory functions, seed scripts, and PII masking. Use when tests need consistent, isolated, realistic data without hitting production."
---

# Helix — Test Data Management

> 📚 **Knowledge References** (loaded automatically):
> `qa-data-patterns.md` — test data strategies, factory patterns, PII masking, seed script templates

Test data is the silent killer of test reliability. Bad data causes flaky tests, false positives, and security risks. This skill establishes a repeatable, safe test data strategy.

## Step 1: Audit Current State

Scan the repo:
```
- Existing factories/fixtures? (tests/factories/, tests/fixtures/)
- Seed scripts? (db/seeds/, prisma/seed.ts)
- Hardcoded test data in test files?
- PII in test data? (real emails, names, phone numbers)
```

## Step 2: Choose Strategy

| Strategy | When to Use |
|----------|-------------|
| **Factory functions** | Per-test isolated records with overrides |
| **Static fixtures** | Read-only reference data (countries, roles, config) |
| **Seed scripts** | Full environment baseline (staging, CI) |
| **Anonymized prod snapshot** | Realistic volume testing (PII masked) |
| **Synthetic generation** | Large-scale performance/load test data |

## Step 3: PII Masking Rules

Any data derived from production **must** be masked before use in tests:

```
Real name     → Faker.name()
Real email    → user-{uuid}@test.invalid
Real phone    → +66-000-000-0000
Real address  → 123 Test Street, Test City
Credit card   → 4111111111111111 (Stripe test card)
SSN / ID no.  → 000-00-0000
```

**Rule:** `.test.invalid` domain emails can never receive real email — safe by design.

## Step 4: Generate Factory Functions

Example output (TypeScript):
```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: `user-${faker.string.uuid()}@test.invalid`,
    name: faker.person.fullName(),
    role: 'member',
    createdAt: new Date(),
    ...overrides,
  };
}
```

## Step 5: Generate Seed Script

```typescript
// prisma/seed.test.ts
async function seed() {
  await db.user.createMany({ data: Array.from({length: 10}, () => createUser()) });
  await db.user.create({ data: createUser({ role: 'admin' }) });
}
```

## Step 6: CI Integration

Add to test workflow:
```yaml
- name: Seed test database
  run: npx ts-node prisma/seed.test.ts
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Step 7: Output

Generate:
- `tests/factories/*.factory.ts` (or `.py`, `.go`)
- `prisma/seed.test.ts` (or equivalent)
- `docs/qa/test-data-strategy.md`

Commit to repo.

## Done

Present: strategy chosen, factories created, PII risks addressed.

## Self-Evaluation Loop

```
1. PII ถูก mask ครบไหม?
2. Factory functions isolated ไหม (ไม่ share state)?
3. Seed script idempotent ไหม (รันซ้ำได้)?
4. ใช้ได้กับทั้ง local และ CI ไหม?
```
