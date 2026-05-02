# E2E Patterns Reference (Playwright)

## Core Philosophy

E2E tests verify complete user journeys — not individual functions. Test what users actually do, not how the code works internally.

**E2E tests are appropriate for:**
- Full user flows (auth → action → result)
- Cross-page interactions
- Browser-specific behavior (forms, navigation, back button)
- Visual regressions in critical paths

**Not appropriate for:**
- Unit-level logic (use unit tests)
- API contracts (use integration tests)
- Exhaustive permutations (too slow)

---

## Page Object Model (POM)

Every page/component gets its own class. Tests import POMs, not raw locators.

### Base Page Pattern

```typescript
// pages/BasePage.ts
import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
```

### Feature Page Pattern

```typescript
// pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly createButton: Locator;
  readonly itemList: Locator;

  constructor(page: Page) {
    super(page);
    this.createButton = page.getByTestId('dashboard-create');
    this.itemList = page.getByTestId('item-list');
  }

  async createItem(name: string) {
    await this.createButton.click();
    await this.page.getByTestId('item-name-input').fill(name);
    await this.page.getByTestId('item-save').click();
  }

  async getItemCount(): Promise<number> {
    return await this.itemList.locator('[data-testid^="item-"]').count();
  }
}
```

---

## data-testid Convention

Never couple tests to CSS classes or structure. Use `data-testid` attributes.

```html
<!-- ✅ Good — stable, intent is clear -->
<button data-testid="checkout-submit">Checkout</button>
<input data-testid="login-email" type="email" />
<div data-testid="item-list">

<!-- ❌ Bad — breaks on styling changes -->
<button class="btn btn-primary checkout-btn">Checkout</button>
```

**Naming format:** `{page/component}-{element}`
```
login-email          login-password       login-submit
dashboard-create     dashboard-search
item-name            item-edit            item-delete
modal-confirm        modal-cancel
nav-home             nav-profile
```

**Add to source code when writing tests:**
```typescript
// Tell source-code developers which test IDs are needed
// and add them in the PR together with tests
```

---

## Selector Priority

Use in this order (most stable → least stable):

| Priority | Selector | Example |
|----------|----------|---------|
| 1 ✅ | `getByTestId()` | `page.getByTestId('submit-btn')` |
| 2 ✅ | `getByRole()` | `page.getByRole('button', { name: 'Submit' })` |
| 3 ✅ | `getByLabel()` | `page.getByLabel('Email address')` |
| 4 ✅ | `getByPlaceholder()` | `page.getByPlaceholder('Search...')` |
| 5 ⚠️ | `getByText()` | `page.getByText('Submit')` — breaks on copy changes |
| 6 ❌ | CSS selector | `page.locator('.btn-primary')` — avoid |
| 7 ❌ | XPath | `page.locator('//button[1]')` — avoid |

---

## Critical User Flows (Must Have)

Every app has these — test all of them:

```typescript
// 1. Authentication
test.describe('Auth', () => {
  test('login with valid credentials', async ({ page }) => { ... });
  test('login fails with wrong password', async ({ page }) => { ... });
  test('logout clears session', async ({ page }) => { ... });
});

// 2. Core CRUD
test.describe('Core feature', () => {
  test('create new item', async ({ page }) => { ... });
  test('edit existing item', async ({ page }) => { ... });
  test('delete item', async ({ page }) => { ... });
  test('list shows updated data', async ({ page }) => { ... });
});

// 3. Error states
test.describe('Error handling', () => {
  test('shows error on network failure', async ({ page }) => { ... });
  test('form validation shows inline errors', async ({ page }) => { ... });
  test('404 page is handled gracefully', async ({ page }) => { ... });
});
```

---

## Playwright Config Template

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Add firefox/webkit when needed
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Flaky Test Prevention

### Problem: Race conditions
```typescript
// ❌ Flaky — hardcoded wait
await page.waitForTimeout(2000);

// ✅ Wait for specific condition
await page.waitForSelector('[data-testid="item-list"]');
await expect(page.getByTestId('save-success')).toBeVisible();
await page.waitForResponse('**/api/items');
```

### Problem: Order-dependent tests
```typescript
// ✅ Each test is independent — set up its own state
test.beforeEach(async ({ page }) => {
  // Fresh state per test
  await page.goto('/');
});

// ✅ Use fixtures for shared setup
const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByTestId('email').fill('test@example.com');
    await page.getByTestId('password').fill('password');
    await page.getByTestId('submit').click();
    await use(page);
  },
});
```

### Problem: Test data collisions
```typescript
// ✅ Unique test data per run
const uniqueEmail = `test-${Date.now()}@example.com`;
const uniqueName = `Test Item ${Date.now()}`;
```

### Problem: Auth overhead on every test
```typescript
// ✅ Store auth state and reuse
// playwright.config.ts
use: {
  storageState: 'tests/e2e/.auth/user.json',
}

// tests/e2e/setup/auth.setup.ts
import { test as setup } from '@playwright/test';
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email').fill('test@example.com');
  await page.getByTestId('password').fill('password');
  await page.getByTestId('submit').click();
  await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
});
```

---

## Debugging Failed Tests

```bash
# Run with trace recording
npx playwright test --trace on

# View trace (visual timeline)
npx playwright show-trace test-results/trace.zip

# Run in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test auth.spec.ts --debug

# See HTML report
npx playwright show-report
```

The trace viewer shows: DOM snapshots, network requests, console logs, action timeline — use it to understand exactly what happened before failure.
