---
name: test-unit
description: "Unit test workflow — checks existing unit test structure in target repo, creates if missing, augments if exists. Covers all functions, methods, and components related to the current feature."
---

# Helix — Unit Test

ทดสอบทุก function/method/component แบบ isolated

## Step 1: Repo Structure Check

ตรวจ repo ก่อนเสมอ — หา unit test folder และ test framework ที่ใช้:

```bash
# หา test directories ที่มีอยู่
find . -type d -name "__tests__" -o -name "unit" -o -name "spec" \
  | grep -v node_modules | grep -v .git

# หา test framework จาก config/package.json
cat package.json 2>/dev/null | grep -E "jest|vitest|mocha|pytest|rspec|go test"
cat pytest.ini pyproject.toml setup.cfg 2>/dev/null | grep -i test
```

### กรณี A: ยังไม่มี unit test folder

สร้าง structure ตาม convention ของ tech stack นั้น:

| Stack | Structure ที่สร้าง |
|-------|-----------------|
| Node/TS (Jest) | `__tests__/unit/` + `jest.config.ts` |
| Node/TS (Vitest) | `src/__tests__/unit/` + `vitest.config.ts` |
| Python (pytest) | `tests/unit/` + `conftest.py` + `pytest.ini` |
| Go | `<package>_test.go` ข้าง source file |
| Ruby (RSpec) | `spec/unit/` + `.rspec` |

สร้าง base config ถ้ายังไม่มี แล้วดำเนินการ step 2

### กรณี B: มี unit test folder แล้ว

- อ่าน test cases ที่มีอยู่ทั้งหมด
- ระบุ gap: feature/function ไหนที่เกี่ยวข้องยังไม่มี test?
- เพิ่มเฉพาะ cases ที่ขาด ไม่แตะ test เดิมที่ผ่านอยู่แล้ว
- ถ้า test เดิมผิด/ล้าสมัย → แจ้ง user + ถามก่อนแก้

## Step 2: Test Case Planning

เขียน cases ครอบคลุม 3 หมวดสำหรับทุก function/method ที่เกี่ยวข้อง:

| หมวด | ครอบคลุม |
|------|---------|
| Happy path | input ถูกต้อง → output ที่คาดหวัง |
| Edge cases | empty, null, boundary values, max/min |
| Error cases | invalid input, exceptions, error states |

```
| ID | Function/Component | Scenario | Input | Expected | Category |
|----|-------------------|---------|-------|----------|---------|
```

## Step 3: External Skill Check

ก่อนเขียน tests ตรวจ skill ที่เหมาะสม:
- `fullstack-dev-skills:test-master` (installed) — ใช้ได้เลย
- `tdd` (installed) — review test quality

## Step 4: Run & Fix

```bash
# Node/TS
npx jest --testPathPattern=unit --coverage
# หรือ
npx vitest run --coverage

# Python
pytest tests/unit/ -v --cov

# Go
go test ./... -v
```

รายงานผลทุก 10 นาที:
```
| Suite | Total | ✅ Pass | ❌ Fail | Coverage |
|-------|-------|---------|---------|----------|
```

เมื่อมี fail → วิเคราะห์ root cause → แก้ → re-run → ห้ามข้ามหรือ skip โดยไม่ได้รับอนุมัติ

## Done

แจ้ง user ผลสรุป + coverage แล้วถามว่าต้องการต่อ `/helix:test-integration` ไหม
