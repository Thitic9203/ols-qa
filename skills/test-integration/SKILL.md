---
name: test-integration
description: "Integration test workflow — checks existing integration test structure, creates if missing, augments if exists. Tests interactions between modules, services, and databases with real dependencies."
---

# Helix — Integration Test

> 📚 **Knowledge References** (loaded automatically):  
> `integration-patterns.md` — what to test, DB patterns, API integration structure

ทดสอบการทำงานร่วมกันของ modules, services, APIs, และ databases

## Step 1: Repo Structure Check

```bash
# หา integration test folder
find . -type d -name "integration" -o -name "e2e" \
  | grep -v node_modules | grep -v .git | grep -v "e2e$"

# หา DB/service config ที่ใช้ใน test
ls docker-compose*.yml docker-compose*.yaml 2>/dev/null
cat .env.test .env.testing 2>/dev/null | head -20
```

### กรณี A: ยังไม่มี integration test folder

สร้าง structure ตาม tech stack:

| Stack | Structure ที่สร้าง |
|-------|-----------------|
| Node/TS | `tests/integration/` + `jest.integration.config.ts` |
| Python | `tests/integration/` + `conftest.py` (DB fixtures) |
| Go | `integration/` + build tag `//go:build integration` |
| Rails | `spec/integration/` |

ถ้า test ต้องการ DB/service จริง → ตรวจว่ามี `docker-compose.test.yml` ไหม ถ้าไม่มี → แนะนำสร้าง (ฟรี)

### กรณี B: มี integration test folder แล้ว

- อ่านและ map test cases ที่มีกับ features ที่เกี่ยวข้อง
- ระบุ integration paths ที่ยังไม่มี test
- เพิ่ม cases ที่ขาด ไม่แตะ test เดิม

## Step 2: Test Case Planning

ครอบคลุม integration points เหล่านี้:

| จุดที่ต้องทดสอบ | ตัวอย่าง |
|---------------|---------|
| Module A → Module B | service calls another service |
| API → Database | CRUD operations with real DB |
| API → External service | HTTP calls (use test doubles) |
| Event → Handler | message queue, webhooks |
| Auth flow | login → token → protected route |

```
| ID | Integration Point | Scenario | Pre-condition | Expected | Category |
|----|------------------|---------|---------------|----------|---------|
```

## Step 3: External Skill Check

ถ้าต้องการ skill เพิ่ม:
- `fullstack-dev-skills:database-optimizer` (installed) — DB query review
- ถ้าใช้ API mocking → ตรวจว่ามี mock library พร้อมแล้วก่อน

## Step 4: Run & Fix

```bash
# Node/TS (แยก config)
npx jest --config jest.integration.config.ts

# Python
pytest tests/integration/ -v --cov

# Go (ใช้ build tag)
go test -tags integration ./...
```

รายงานผลทุก 10 นาที เมื่อมี fail → แก้จนผ่านทั้งหมด

## Done

แจ้ง user ผลสรุป แล้วถามว่าต้องการต่อ `/helix:test-e2e` ไหม

## HTML Report

```bash
npx jest --config jest.integration.config.ts --json --outputFile=test-results/results-raw.json
# แปลง Jest JSON → helix normalized format → generate
node scripts/helix-report.mjs --input=test-results/results.json --title="Integration Tests"
open playwright-report/index.html
```

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
