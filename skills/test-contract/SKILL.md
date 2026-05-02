---
name: test-contract
description: "API contract test workflow — verifies that API providers and consumers agree on the contract. Creates Pact tests if missing, augments if exists. Essential for microservices and separated frontend/backend teams."
---

# Helix — Contract Test (Pact)

> 📚 **Knowledge References** (loaded automatically):  
> `contract-patterns.md` — Pact concepts, consumer/provider setup, CI integration

ตรวจว่า API ที่ expose ออกไปยังตรงกับที่ consumer คาดหวัง — จับ breaking changes ก่อน deploy

## Step 1: Repo Structure Check

```bash
# หา contract test folder และ Pact config
find . -type d \( -name "contract" -o -name "pact" \) \
  | grep -v node_modules | grep -v .git

# ตรวจว่า Pact ติดตั้งแล้วไหม
cat package.json 2>/dev/null | grep -E "pact|@pact-foundation"
pip list 2>/dev/null | grep pact
```

### กรณี A: ยังไม่มี contract test

**ถาม user ก่อน:**
```
Pact ต้องการ Pact Broker เพื่อ share contracts ระหว่าง services
→ มี Pact Broker แล้วไหม? (Pactflow free tier / self-hosted)
→ ถ้าไม่มี: ใช้ local pact files ก่อนได้ ไม่ต้องมี broker
```

สร้าง structure:
```
tests/contract/
├── consumer/        ← consumer-side tests (what the API should return)
│   └── api.pact.spec.ts
├── provider/        ← provider verification
│   └── api.verify.spec.ts
└── pacts/           ← generated .json files (.gitignore ถ้าใช้ broker)
```

ติดตั้ง (ฟรี):
```bash
# Node/TS
npm install -D @pact-foundation/pact

# Python
pip install pact-python
```

### กรณี B: มี contract test แล้ว

- อ่าน pact files ที่มีอยู่
- ระบุ API endpoints ใหม่ที่ยังไม่มี contract
- เพิ่ม interactions ใหม่ ไม่แตะ contract เดิม

## Step 2: Test Case Planning

สำหรับแต่ละ API endpoint ที่เกี่ยวข้อง:

```
| Endpoint | Consumer | Expected Request | Expected Response | Status |
|----------|---------|-----------------|------------------|--------|
```

ครอบคลุม:
- Happy path response shape (fields, types)
- Error responses (4xx, 5xx) — shape ต้องตรงด้วย
- Optional fields — ระบุให้ชัดว่า optional หรือ required

## Step 3: Write Tests

### Consumer Side (Node/TS)

```typescript
// tests/contract/consumer/api.pact.spec.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/src/v3/matchers';

const provider = new PactV3({
  consumer: 'frontend',
  provider: 'api-service',
  dir: 'tests/contract/pacts',
});

describe('API Contract', () => {
  it('returns user list', () => {
    provider
      .given('users exist')
      .uponReceiving('a GET /users request')
      .withRequest({ method: 'GET', path: '/users' })
      .willRespondWith({
        status: 200,
        body: eachLike({
          id: like(1),
          name: like('Alice'),
          email: like('alice@example.com'),
        }),
      });

    return provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/users`);
      const users = await response.json();
      expect(users[0]).toHaveProperty('id');
    });
  });
});
```

### Provider Verification

```typescript
// tests/contract/provider/api.verify.spec.ts
import { Verifier } from '@pact-foundation/pact';

describe('Provider verification', () => {
  it('validates contracts', () => {
    return new Verifier({
      provider: 'api-service',
      providerBaseUrl: 'http://localhost:3000',
      pactUrls: ['tests/contract/pacts/frontend-api-service.json'],
      stateHandlers: {
        'users exist': async () => {
          // seed test data
        },
      },
    }).verifyProvider();
  });
});
```

## Step 4: Run & Fix

```bash
# รัน consumer tests → สร้าง pact files
npx jest tests/contract/consumer/

# รัน provider verification
npx jest tests/contract/provider/

# Python
pytest tests/contract/
```

รายงานผลทุก 10 นาที — ถ้า provider fail → ระบุว่า API เปลี่ยนอะไร + แจ้ง consumer team ก่อนแก้

## Done

แจ้ง user ผลสรุป + list contracts ที่ผ่าน/ไม่ผ่าน  
ถามว่าต้องการต่อ `/helix:test-a11y` ไหม

---

## Self-Evaluation Loop

ก่อนส่ง output ให้ user ทำ self-check ทุกครั้ง:

```
1. Output ครบถ้วนตาม scope ที่รับมาไหม?
2. มีจุดไหนที่ยังไม่แน่ใจ ควรถามก่อนไหม?
3. Format ถูกต้องตามที่กำหนดในสกิลไหม?
4. มีอะไรที่อาจทำให้งานพัง / เกิด side effect ที่ไม่ตั้งใจไหม?
```

ตอบ "ไม่ใช่" ข้อไหน → **แก้ก่อนส่ง** เสมอ
