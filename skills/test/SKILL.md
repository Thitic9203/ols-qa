---
name: test
description: "Testing orchestrator — choose test type or run all. Checks existing test structure in target repo before creating or augmenting. Supports unit, integration, e2e, performance, security, contract, accessibility, and visual regression tests."
---

# Helix — Test Phase

เลือกประเภท test หรือรันทั้งหมด  
**ทุกประเภทจะเช็ค repo ก่อนเสมอ — สร้างใหม่ถ้ายังไม่มี เพิ่ม/ปรับปรุงถ้ามีแล้ว**

## Input ที่ต้องการ

ถามผู้ใช้:
```
1. ทำที่ repo ใด?
2. ต้องการทดสอบประเภทไหน? (เลือกได้หลายอย่าง)

   [ ] 1. Unit Tests         →  /helix:test-unit
   [ ] 2. Integration Tests  →  /helix:test-integration
   [ ] 3. E2E Tests          →  /helix:test-e2e
   [ ] 4. Performance Tests  →  /helix:test-perf
   [ ] 5. Security Tests     →  /helix:test-security
   [ ] 6. Contract Tests     →  /helix:test-contract
   [ ] 7. Accessibility      →  /helix:test-a11y
   [ ] 8. Visual Regression  →  /helix:test-visual
   [ ] 9. ทั้งหมด (1-8 ตามลำดับ)
```

## Execution Order (ถ้าเลือกหลายประเภท)

รันตามลำดับนี้เสมอ เพราะแต่ละชั้นขึ้นอยู่กับชั้นก่อน:

```
unit → integration → contract → e2e → a11y → visual → performance → security
```

## สรุปผลรวม (หลังทุก type เสร็จ)

```
🧪 Test Summary — [timestamp]

| Type        | Cases | ✅ Pass | ❌ Fail | Notes    |
|-------------|-------|---------|---------|----------|
| Unit        | —     | —       | —       | —% cov   |
| Integration | —     | —       | —       | —        |
| Contract    | —     | —       | —       | —        |
| E2E         | —     | —       | —       | —        |
| A11y        | —     | —       | —       | violations|
| Visual      | —     | —       | —       | diff px  |
| Performance | —     | —       | —       | p95 ms   |
| Security    | —     | —       | —       | findings |
```

ถามผู้ใช้ว่าต้องการต่อไป `/helix:deploy` ไหม

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
