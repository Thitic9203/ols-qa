# Visual Regression Patterns Reference

## Snapshot Strategy

### What to snapshot

| Good candidates | Poor candidates |
|----------------|----------------|
| Key pages (home, dashboard, landing) | Pages with live data (charts, feeds) |
| Reusable components (buttons, modals, forms) | Pages with user-specific content |
| Critical user flows (checkout, onboarding) | Third-party embedded widgets |
| Responsive breakpoints | Animated elements (capture paused state) |
| Dark mode / theme variants | Randomly generated content |

### Granularity choices

```typescript
// Full page — catches layout shifts, header/footer regressions
await expect(page).toHaveScreenshot('home.png', { fullPage: true });

// Viewport only — faster, less noise from below-the-fold
await expect(page).toHaveScreenshot('home-viewport.png');

// Component only — most focused, least noise
const card = page.getByTestId('product-card');
await expect(card).toHaveScreenshot('product-card.png');
```

**Recommendation:** Start with full-page snapshots of key routes, add component-level snapshots for shared UI components.

---

## Handling Dynamic Content

Dynamic content (timestamps, user names, random IDs) causes false positives.

```typescript
// Method 1: Hide dynamic elements before snapshot
await page.evaluate(() => {
  const dynamic = document.querySelectorAll(
    '[data-testid="timestamp"], [data-testid="avatar"], .user-greeting'
  );
  dynamic.forEach(el => (el as HTMLElement).style.visibility = 'hidden');
});

// Method 2: Replace with fixed content via route mock
await page.route('**/api/user', route =>
  route.fulfill({ json: { name: 'Test User', avatar: '/static/avatar.png' } })
);

// Method 3: mask option (Playwright 1.35+)
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [page.getByTestId('timestamp'), page.getByTestId('live-counter')],
});
```

---

## Threshold Configuration

```typescript
// Global (playwright.config.ts)
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,       // absolute pixel count
    maxDiffPixelRatio: 0.01,  // 1% of total pixels — use one or the other
    threshold: 0.2,           // per-pixel color difference tolerance (0–1)
  },
},

// Per-test override
await expect(page).toHaveScreenshot('page.png', {
  maxDiffPixels: 50,   // stricter for critical pages
});
```

**Starting values:**
- Hero/landing pages: `maxDiffPixels: 50` (strict)
- Complex dashboards: `maxDiffPixelRatio: 0.02` (2% tolerance)
- Component tests: `maxDiffPixels: 10` (very strict)

---

## Update Workflow

```
Intentional change         Unintentional change
(new feature, redesign)    (CSS regression, side effect)
         ↓                          ↓
Review diff in report      Find root cause
         ↓                          ↓
Update baseline            Fix code
         ↓                          ↓
npx playwright test        Re-run tests
  --update-snapshots                ↓
         ↓                 Tests pass ✅
git commit snapshots
```

**Never run `--update-snapshots` without reviewing the diffs first.** This blindly accepts all current states as correct.

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run visual tests
  run: npx playwright test tests/visual/

- name: Upload diff report on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-diff-report
    path: playwright-report/
    retention-days: 7
```

**Baseline snapshots must be committed** — CI checks out the repo and compares against committed baselines. If snapshots aren't committed, every CI run fails.

---

## Multi-Platform Snapshot Consistency

Playwright generates platform-specific snapshots (`home-desktop-darwin.png` vs `home-desktop-linux.png`). This is expected — font rendering differs between macOS and Linux.

**Solutions:**
1. **Generate baselines on Linux** (match CI): `docker run --rm -v $(pwd):/work mcr.microsoft.com/playwright npx playwright test --update-snapshots`
2. **Use `--ignore-snapshots` locally** and only verify on CI
3. **Accept both platforms** — Playwright handles this automatically with OS suffix

---

## Common False Positives

| Cause | Fix |
|-------|-----|
| Fonts not loaded | `await page.waitForLoadState('networkidle')` |
| Animation in progress | `page.evaluate(() => document.getAnimations().forEach(a => a.finish()))` |
| Lazy-loaded images | `await page.evaluate(() => document.querySelectorAll('img').forEach(img => img.src = img.src))` |
| Scrollbar presence | `page.evaluate(() => document.documentElement.style.overflow = 'hidden')` |
| Date/time display | Mask or hide timestamp elements |
