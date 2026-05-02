---
name: test-e2e
description: "E2E test workflow using Playwright — checks existing E2E structure, creates if missing, augments if exists. Tests full user flows through real browser."
---

# Helix — E2E Test (Playwright)

> 📚 **Knowledge References** (loaded automatically):  
> `e2e-patterns.md` — Page Object Model, data-testid, critical flows, flaky prevention

ทดสอบ user flows ครบวงจรผ่าน browser จริง — **ใช้ Playwright เสมอ**

## Step 1: Repo Structure Check

```bash
# หา e2e test folder และ Playwright config
find . -type d \( -name "e2e" -o -name "playwright" \) \
  | grep -v node_modules | grep -v .git

# ตรวจว่า Playwright ติดตั้งแล้วไหม
cat package.json 2>/dev/null | grep playwright
npx playwright --version 2>/dev/null || echo "not installed"
ls playwright.config.* 2>/dev/null
```

### กรณี A: ยังไม่มี E2E test

ติดตั้ง Playwright (free, official):

```bash
# แจ้ง user ก่อน
# Playwright จะติดตั้ง browsers (~250MB) ครั้งเดียว
npm init playwright@latest
# → เลือก: TypeScript, tests/e2e/, ไม่ต้องเพิ่ม GitHub Actions ก่อน
```

**⚠️ แจ้ง user ก่อน** — `npm init playwright@latest` จะ download browser binaries (~250MB)  
รอ confirm แล้วค่อยรัน

สร้าง structure (ถ้า init สร้างไม่ครบ):
```
tests/e2e/
├── fixtures/        ← test data, auth state files
├── pages/           ← Page Object Models (POM)
│   └── BasePage.ts  ← base class
└── specs/           ← test files
    └── example.spec.ts
```

### กรณี B: มี Playwright แล้ว

- อ่าน `playwright.config.ts` — ตรวจ baseURL, browsers, timeouts
- อ่าน test cases ที่มีและ map กับ user flows ปัจจุบัน
- ระบุ flows ใหม่จาก feature ที่เพิ่งพัฒนาที่ยังไม่มี test
- เพิ่ม cases ให้ครบ ไม่แตะ test เดิม

### External Skill Check

- `playwright-skill @ playwright-skill` ⭐⭐ — specialized Playwright guidance

ถ้ายังไม่ได้ติดตั้ง → แนะนำ + ถาม user ก่อนเสมอ

## Step 2: Test Case Planning

ครอบคลุม user flows เหล่านี้:

| Flow | สิ่งที่ทดสอบ |
|------|-----------|
| Auth flow | login, logout, session expiry |
| Feature flow | ทุก user action ของ feature ใหม่ |
| Error states | form validation errors, 404, server errors |
| Critical path | user flow สำคัญที่สุด (happy path) |

```
| ID | User Flow | Steps | Expected Result | Priority |
|----|-----------|-------|----------------|---------|
```

## Step 3: Write Tests (Playwright Pattern)

ใช้ Page Object Model เสมอ — ดู `e2e-patterns.md` สำหรับ template

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByTestId('login-email');
    this.passwordInput = page.getByTestId('login-password');
    this.submitButton = page.getByTestId('login-submit');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// specs/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('user can log in successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login('user@test.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

**Selector priority** (เรียงจาก stable → brittle):
1. `getByTestId('...')` ✅ best
2. `getByRole('button', { name: 'Submit' })` ✅ good
3. `getByLabel('Email')` ✅ good
4. `getByText('exact text')` ⚠️ fragile
5. CSS selectors / XPath ❌ avoid

## Step 4: Run & Fix

```bash
# รัน tests ทั้งหมด
npx playwright test tests/e2e/

# รัน พร้อม HTML report
npx playwright test --reporter=html

# รัน เฉพาะ spec
npx playwright test tests/e2e/specs/auth.spec.ts

# Debug mode (เห็น browser)
npx playwright test --debug

# ดู report
npx playwright show-report
```

รายงานผลทุก 10 นาที — E2E มักใช้เวลานาน แจ้ง ETA ให้ user รับทราบ

เมื่อมี fail:
1. เปิด Playwright trace: `npx playwright test --trace on`
2. วิเคราะห์ใน trace viewer: `npx playwright show-trace trace.zip`
3. แก้ flaky tests ก่อน (timeout, race condition) — ดู `e2e-patterns.md`
4. แก้ logic bug ถ้า test ถูกต้อง

```
| Suite | Total | ✅ Pass | ❌ Fail | Flaky |
|-------|-------|---------|---------|-------|
```

## Done

แจ้ง user ผลสรุป + link HTML report แล้วถามว่าต้องการต่อ `/helix:test-perf` ไหม

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
