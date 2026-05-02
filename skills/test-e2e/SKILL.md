---
name: test-e2e
description: "E2E test workflow — checks existing E2E test structure, creates if missing, augments if exists. Tests full user flows through real browser or CLI. Recommends Playwright as primary tool."
---

# Helix — E2E Test

ทดสอบ user flows ครบวงจรผ่าน browser หรือ API จริง

## Step 1: Repo Structure Check

```bash
# หา e2e test folder และ config
find . -type d \( -name "e2e" -o -name "cypress" -o -name "playwright" \) \
  | grep -v node_modules | grep -v .git

# ตรวจ e2e framework ที่ติดตั้งแล้ว
cat package.json 2>/dev/null | grep -E "playwright|cypress|puppeteer|selenium"
ls playwright.config.* cypress.config.* 2>/dev/null
```

### กรณี A: ยังไม่มี E2E test

**แนะนำ Playwright** (free, cross-browser, official support):

```bash
# ตรวจก่อนว่า Playwright ติดตั้งแล้วไหม
npx playwright --version 2>/dev/null || echo "not installed"
```

ถ้ายังไม่ได้ติดตั้ง → แจ้ง user:
```
💡 แนะนำติดตั้ง Playwright (free)
npm init playwright@latest
→ จะสร้าง playwright.config.ts + tests/e2e/ ให้อัตโนมัติ

ต้องการติดตั้งไหมคับ?
```

สร้าง structure:
```
tests/e2e/
├── fixtures/        ← test data, auth states
├── pages/           ← Page Object Models
└── specs/           ← test files
```

### กรณี B: มี E2E framework แล้ว

- อ่าน test cases ที่มีและ map กับ user flows ปัจจุบัน
- ระบุ flows ใหม่จาก feature ที่เพิ่งพัฒนาที่ยังไม่มี test
- เพิ่ม cases ให้ครบ ไม่แตะ test เดิม

### External Skill Check

- `playwright-skill @ playwright-skill` ⭐⭐ — เหมาะมากสำหรับ E2E
- `webapp-testing @ anthropic-agent-skills` ⭐⭐⭐ — ทดสอบ web app

ถ้ายังไม่ได้ติดตั้ง → แนะนำ + ถาม user ก่อนเสมอ

## Step 2: Test Case Planning

ครอบคลุม user flows เหล่านี้:

| Flow | สิ่งที่ทดสอบ |
|------|-----------|
| Critical path | user flow หลักที่สำคัญที่สุด |
| Auth flow | login, logout, session expiry |
| Feature flow | ทุก user action ของ feature ใหม่ |
| Error states | 404, form validation errors, server errors |
| Cross-browser | Chrome, Firefox, Safari (ถ้าใช้ Playwright) |

```
| ID | User Flow | Steps | Expected Result | Priority |
|----|-----------|-------|----------------|---------|
```

## Step 3: Run & Fix

```bash
# Playwright
npx playwright test tests/e2e/ --reporter=html

# Cypress
npx cypress run --spec "cypress/e2e/**"
```

รายงานผลทุก 10 นาที — E2E มักใช้เวลานาน แจ้ง ETA ให้ user รับทราบ

## Done

แจ้ง user ผลสรุป + attach screenshot report แล้วถามว่าต้องการต่อ `/helix:test-perf` ไหม
