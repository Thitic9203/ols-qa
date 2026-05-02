# Unit Testing Patterns

## โครงสร้าง Test ที่ดี (AAA Pattern)

```typescript
it('should return error when email is invalid', () => {
  // Arrange — เตรียม input และ expected
  const invalidEmail = 'not-an-email'
  const expected = { success: false, error: 'Invalid email format' }

  // Act — เรียก function ที่ test
  const result = validateEmail(invalidEmail)

  // Assert — ตรวจผลลัพธ์
  expect(result).toEqual(expected)
})
```

## Test Naming Convention

```
should [expected behavior] when [condition]
returns [value] for [input]
throws [error] when [condition]
```

ตัวอย่างที่ดี:
- `should return null when user not found`
- `throws ValidationError when price is negative`
- `returns empty array when no results match filter`

## Coverage ที่มีความหมาย

| Coverage Type | ตรวจอะไร | Target |
|--------------|---------|--------|
| Line coverage | ทุก line ถูกรันไหม | 80%+ |
| Branch coverage | ทุก if/else ถูกทดสอบไหม | 70%+ |
| Function coverage | ทุก function ถูก call ไหม | 90%+ |

**Warning**: 100% coverage ไม่ได้แปลว่า bug-free — เขียน meaningful assertions ดีกว่า coverage %

## สิ่งที่ Unit Test ไม่ควรทำ

```
❌ Test ที่ depend กัน (test A ต้องรันก่อน test B)
❌ Call API จริง / ต่อ DB จริง → ใช้ mock
❌ Test private method โดยตรง → test ผ่าน public interface
❌ Assert implementation detail (เช่น "function X ถูก call") → assert output
❌ Sleep / wait ใน test → ใช้ fake timer
```

## Mock Patterns

```typescript
// ✅ Mock external dependency
jest.mock('../services/emailService', () => ({
  send: jest.fn().mockResolvedValue({ success: true })
}))

// ✅ Mock เฉพาะส่วนที่ test ไม่ได้ test
const mockRepo = { findById: jest.fn().mockResolvedValue(user) }

// ❌ อย่า mock ตัว function ที่กำลัง test
```
