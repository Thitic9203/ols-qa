# Integration Testing Patterns

## What to Test vs What Not to Test

**ควร test ใน integration:**
- Service A เรียก Service B ได้ถูกต้อง
- API handler → DB query → response
- Auth middleware → protected route
- Event published → handler consumed

**ไม่ควร test ซ้ำจาก unit test:**
- Business logic ย่อยๆ (ทำใน unit test แล้ว)
- Error handling ภายใน function เดี่ยวๆ

## Database Test Patterns

```typescript
// ✅ ใช้ transaction rollback เพื่อ cleanup
beforeEach(async () => { await db.beginTransaction() })
afterEach(async () => { await db.rollbackTransaction() })

// ✅ ใช้ separate test DB (ไม่ใช้ production DB เด็ดขาด)
// .env.test: DATABASE_URL=postgresql://localhost/app_test

// ✅ Seed ข้อมูลขั้นต่ำที่ test ต้องการ
const user = await factory.create('user', { role: 'admin' })
```

## Isolation Strategies

| Strategy | เหมาะกับ | Trade-off |
|----------|---------|-----------|
| Transaction rollback | SQL DB | เร็ว แต่ไม่ test commit path |
| Test database per run | ทุก type | Clean แต่ setup นาน |
| Docker container | External services | Accurate แต่ต้องการ Docker |
| In-memory substitute | Simple cases | เร็วมาก แต่ไม่ test DB logic |

## API Integration Test Structure

```typescript
describe('POST /api/orders', () => {
  it('creates order and charges payment', async () => {
    // Arrange
    const user = await createTestUser()
    const token = generateToken(user)

    // Act
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: 1, qty: 2 }] })

    // Assert — test observable behavior, not internals
    expect(res.status).toBe(201)
    expect(res.body.orderId).toBeDefined()
    const order = await db.orders.findById(res.body.orderId)
    expect(order.status).toBe('pending_payment')
  })
})
```
