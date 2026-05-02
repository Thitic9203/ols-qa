---
name: test-perf-frontend
description: "Frontend performance test workflow — measures Core Web Vitals (LCP, CLS, INP), bundle size, and render performance. Use before releasing UI changes or when Google ranking / user-perceived speed matters."
---

# Helix — Frontend Performance Test

> 📚 **Knowledge References** (loaded automatically):  
> `frontend-perf-patterns.md` — Core Web Vitals thresholds, Lighthouse CI setup, bundle analysis

วัด Core Web Vitals, bundle size, render performance — ส่งผลต่อ user experience และ Google ranking โดยตรง

## Step 1: Choose Measurement Approach

**ถาม user:**
```
1. ต้องการวัดอะไร? (เลือกได้หลายอย่าง)
   [ ] Core Web Vitals (LCP / CLS / INP)
   [ ] Bundle size (JS/CSS)
   [ ] Time to Interactive (TTI)
   [ ] Render performance (FPS, long tasks)

2. URL / pages ที่ต้องการวัด?
3. มี Lighthouse CI ใน pipeline แล้วไหม?
```

## Step 2: Tool Setup

**Free tools:**

| Tool | วัดอะไร | ติดตั้ง |
|------|---------|--------|
| `lighthouse-ci` | CWV + perf score | `npm i -D @lhci/cli` |
| `Playwright` | CWV in test | มีอยู่แล้ว (e2e skill) |
| `bundlesize` | JS/CSS size budget | `npm i -D bundlesize` |
| `source-map-explorer` | bundle composition | `npm i -D source-map-explorer` |
| `webpack-bundle-analyzer` | visual bundle map | `npm i -D webpack-bundle-analyzer` |

## Step 3: Core Web Vitals Thresholds

```
| Metric | Good     | Needs Work | Poor     |
|--------|----------|------------|----------|
| LCP    | < 2.5s   | 2.5–4.0s   | > 4.0s   |
| CLS    | < 0.1    | 0.1–0.25   | > 0.25   |
| INP    | < 200ms  | 200–500ms  | > 500ms  |
| TTFB   | < 800ms  | 800–1800ms | > 1800ms |
```

> **Note:** FID (First Input Delay) was officially retired by Google in March 2024 and replaced by INP (Interaction to Next Paint) as the official responsiveness Core Web Vital. Do not use FID as a target metric.

## Step 4: Lighthouse CI

```bash
# Run Lighthouse ทุก page ที่สำคัญ
npx lhci autorun --config=lighthouserc.json
```

`lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/dashboard"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift":  ["error", {"maxNumericValue": 0.1}],
        "interactive":              ["warn",  {"maxNumericValue": 3800}]
      }
    }
  }
}
```

## Step 5: Core Web Vitals via Playwright

```typescript
import { test, expect } from '@playwright/test';

test('homepage CWV', async ({ page }) => {
  // Start performance observer
  await page.goto('/', { waitUntil: 'networkidle' });

  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const result: Record<string, number> = {};
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            result.lcp = entry.startTime;
          }
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            result.cls = (result.cls || 0) + (entry as any).value;
          }
        }
        resolve(result);
      }).observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
      setTimeout(() => resolve(result), 5000);
    });
  });

  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.cls || 0).toBeLessThan(0.1);
});
```

## Step 6: Bundle Size Budget

```json
// package.json
"bundlesize": [
  { "path": "./dist/main.*.js",    "maxSize": "150 kB" },
  { "path": "./dist/vendor.*.js",  "maxSize": "300 kB" },
  { "path": "./dist/main.*.css",   "maxSize": "30 kB"  }
]
```

```bash
npx bundlesize
```

Analyze composition ถ้า budget bust:
```bash
npx source-map-explorer dist/main.*.js
```

## Step 7: Report

```
🎨 Frontend Performance Results — [timestamp]

Core Web Vitals:
| Page       | LCP    | CLS   | INP    | Score | Status |
|------------|--------|-------|--------|-------|--------|
| /          | 1.8s   | 0.04  | 120ms  | 94    | ✅ Good |
| /dashboard | 2.7s   | 0.12  | 180ms  | 71    | ⚠️ Fix  |

Bundle Size:
| Chunk    | Size   | Budget | Status |
|----------|--------|--------|--------|
| main.js  | 142KB  | 150KB  | ✅     |
| vendor   | 280KB  | 300KB  | ✅     |
| main.css | 28KB   | 30KB   | ✅     |
```

## Step 8: Fix Common Issues

| ปัญหา | สาเหตุบ่อย | วิธีแก้ |
|------|-----------|--------|
| LCP สูง | large image, render-blocking JS | lazy load, preload hint, optimize image |
| CLS สูง | image ไม่มี width/height | กำหนด aspect-ratio ให้ elements |
| INP สูง | long task > 50ms | code split, defer non-critical JS |
| Bundle ใหญ่ | unused imports | tree-shaking, dynamic import |

## Done

สรุป CWV scores + bundle status แล้วแนะนำ:
- Score < 90 → ระบุ specific optimizations
- ผ่านทั้งหมด → แนะนำเพิ่ม Lighthouse CI ใน CI pipeline

## HTML Report

```bash
# Lighthouse output HTML โดยตรง
npx lhci autorun --config=lighthouserc.json
# หรือ generate report จาก lhci JSON:
node scripts/helix-report.mjs --input=test-results/results.json --title="Frontend Performance"
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
