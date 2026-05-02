---
name: test
description: "Testing workflow — write test cases, run tests, fix failures, and report results. Use when dev code is ready and you need to run unit, integration, E2E, performance, or security tests."
---

# Dev Orchestrator — Test Phase

เขียน test cases ครบถ้วน รัน tests และแก้ไขทุก failure จนผ่านหมด

## Input ที่ต้องการ

ถามผู้ใช้:
```
1. ทำที่ repo ใด?
2. จะทดสอบประเภทไหน? (เลือกได้หลายอย่าง)

   [ ] Unit Tests
   [ ] Integration Tests
   [ ] E2E Tests
   [ ] Performance Tests
   [ ] Security Tests
   [ ] อื่นๆ: ___________
```

## Test Planning

สำหรับแต่ละประเภทที่เลือก เขียน test cases ครบ 3 หมวด:

| หมวด | ความหมาย | ตัวอย่าง |
|------|---------|---------|
| Happy path | input ถูกต้อง → ผลลัพธ์ที่คาดหวัง | user login สำเร็จ |
| Edge cases | ค่าขอบเขต / empty / large input | password = 0 chars, 1000 chars |
| Error cases | input ผิด / system failure | wrong password, DB down |

**Test Case Template:**
```
| ID | Description | Precondition | Steps | Expected | Priority |
|----|-------------|--------------|-------|----------|---------|
```

## External Skill Discovery สำหรับ Testing

ก่อน run tests ตรวจ skills ที่เหมาะสม:

| Test Type | Recommended External Skill | Marketplace | Fallback |
|-----------|---------------------------|-------------|---------|
| E2E | `playwright-skill` | `playwright-skill` ⭐⭐ | `fullstack-dev-skills:test-master` |
| Webapp | `webapp-testing` | `anthropic-agent-skills` ⭐⭐⭐ | `fullstack-dev-skills:test-master` |
| Security | `security-guidance` | `claude-plugins-official` ⭐⭐⭐ | `security-review` |
| Security (deep) | `agentic-actions-auditor` | `trailofbits` ⭐⭐ | `fullstack-dev-skills:secure-code-guardian` |

ถ้า skill ที่ต้องการยังไม่ติดตั้ง → แนะนำ + ถาม user ก่อนเสมอ

## Test Review ก่อน Run

ให้ skills เหล่านี้ review test cases ก่อน run จริง:
- `fullstack-dev-skills:code-reviewer` — review test quality
- `tdd` — ตรวจว่า test แท้จริงทดสอบ behavior ไม่ใช่ implementation

ปรับแก้ตาม review ก่อนดำเนินการต่อ

## Test Execution

รัน tests และรายงานผลทุก 10 นาที:

```
🧪 Test Progress — [HH:MM]

| Suite | Total | ✅ Pass | ❌ Fail | ⏭ Skip | Coverage |
|-------|-------|---------|---------|--------|----------|
| Unit  | 42    | 40      | 2       | 0      | 87%      |
| E2E   | 15    | 15      | 0       | 0      | —        |
```

## Failed Test Protocol

เมื่อมี test ไม่ผ่าน:
1. วิเคราะห์ root cause (code bug หรือ test ผิด?)
2. แก้ไขที่ต้นเหตุ
3. Re-run เฉพาะ failed suite ก่อน
4. ตรวจว่าแก้แล้วไม่ทำให้ test อื่นพัง
5. Re-run ทั้งหมด

**ห้าม mark test ว่า pass โดยไม่ได้แก้ปัญหาจริง**
**ห้าม skip test โดยไม่ได้รับอนุญาตจาก user**

## Output

สรุปผล test ทั้งหมด + coverage report แล้วถามว่าต้องการต่อไป `/helix:deploy` ไหม
