---
name: test-visual
description: "Visual regression test workflow — captures baseline screenshots and compares on each run. Uses Playwright built-in snapshot comparison. Creates tests if missing, augments if exists."
---

# Helix — Visual Regression Test

> 📚 **Knowledge References** (loaded automatically):  
> `visual-patterns.md` — snapshot strategy, diff thresholds, update workflow

จับการเปลี่ยนแปลง UI ที่ตาเห็นแต่ functional test จับไม่ได้ — CSS พัง, layout แตก, font เปลี่ยน

## Step 1: Repo Structure Check

```bash
# หา visual regression test folder
find . -type d \( -name "visual" -o -name "snapshots" -o -name "screenshots" \) \
  | grep -v node_modules | grep -v .git

# ตรวจว่า Playwright ติดตั้งแล้วไหม (visual ใช้ built-in snapshot)
npx playwright --version 2>/dev/null || echo "playwright not installed"

# ตรวจ existing snapshots
find . -name "*.png" -path "*/snapshots/*" 2>/dev/null | head -10
```

### กรณี A: ยังไม่มี visual test

Visual regression ใช้ Playwright built-in — ไม่ต้องติดตั้งเพิ่ม (ฟรี)

```bash
# ถ้ายังไม่มี Playwright — แจ้ง user ก่อน (browser download ~250MB)
npm init playwright@latest
```

สร้าง structure:
```
tests/visual/
├── specs/
│   └── visual.spec.ts
└── snapshots/         ← auto-generated baseline (.gitcommit ครั้งแรก)
    ├── home-1.png
    └── dashboard-1.png
```

เพิ่มใน `.gitignore`:
```
# Keep snapshots committed (they are the baseline)
# DO NOT ignore tests/visual/snapshots/
```

### กรณี B: มี visual test แล้ว

- อ่าน snapshot files ที่มีอยู่
- ระบุ pages/components ใหม่ที่ยังไม่มี snapshot
- เพิ่ม test cases ใหม่ ไม่แตะ snapshot เดิม

## Step 2: Test Case Planning

เลือก pages/components ที่มีความสำคัญด้าน visual:

```
| Page / Component | Viewport | State | Priority |
|-----------------|---------|-------|---------|
| Home (desktop) | 1280×800 | default | High |
| Home (mobile)  | 375×812  | default | High |
| Dashboard       | 1280×800 | logged in | High |
| Login form      | 1280×800 | empty | Medium |
| Login form      | 1280×800 | error state | Medium |
| Navbar          | 1280×800 | all states | Medium |
```

## Step 3: Write Tests

```typescript
// tests/visual/specs/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('home page — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ซ่อน dynamic content ก่อน screenshot
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="timestamp"]')
        .forEach(el => (el as HTMLElement).style.visibility = 'hidden');
    });

    await expect(page).toHaveScreenshot('home-desktop.png', {
      maxDiffPixels: 100,    // อนุญาต diff เล็กน้อย
    });
  });

  test('home page — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-mobile.png');
  });

  test('dashboard — logged in state', async ({ page }) => {
    // ใช้ stored auth state (เหมือน E2E)
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
    });
  });

  // Component-level snapshot
  test('primary button — all states', async ({ page }) => {
    await page.goto('/design-system/buttons');
    const button = page.getByTestId('btn-primary');
    await expect(button).toHaveScreenshot('btn-primary-default.png');

    await button.hover();
    await expect(button).toHaveScreenshot('btn-primary-hover.png');
  });
});
```

## Step 4: First Run — Generate Baselines

```bash
# ครั้งแรก: สร้าง baseline snapshots
npx playwright test tests/visual/ --update-snapshots

# commit snapshots เป็น baseline
git add tests/visual/snapshots/
git commit -m "test: add visual regression baselines"
```

## Step 5: Run & Review Diffs

```bash
# รัน visual tests
npx playwright test tests/visual/ --reporter=html

# ดู diff report (เห็น before/after overlay)
npx playwright show-report
```

เมื่อมี diff:
1. เปิด HTML report → ดู diff overlay (แดง = เปลี่ยน)
2. ตัดสิน:
   - **เจตนาเปลี่ยน** (feature/fix ใหม่) → update baseline: `--update-snapshots`
   - **ไม่ได้ตั้งใจเปลี่ยน** → หา root cause → แก้ CSS/code → re-run

```bash
# Update baseline หลังยืนยันว่าการเปลี่ยนแปลงถูกต้อง
npx playwright test tests/visual/ --update-snapshots
git add tests/visual/snapshots/
git commit -m "test: update visual baselines after [feature/fix name]"
```

รายงานทุก 10 นาที:
```
| Page | Status | Diff pixels | Action needed |
|------|--------|------------|---------------|
```

## Done

แจ้ง user ผลสรุป pages ที่ pass/fail + diff report link  
ถามว่าต้องการต่อ `/helix:deploy` ไหม

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
