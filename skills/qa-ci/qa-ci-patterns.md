# CI Pipeline Patterns for QA

## Knowledge Sources
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Testing Blog — CI/CD](https://testing.googleblog.com/)
- [Martin Fowler — Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)

## 5-Stage Pipeline — Time Targets

| Stage | Trigger | Max Time | Tests |
|-------|---------|----------|-------|
| Pre-commit | `git commit` | 30s | unit only |
| PR | `pull_request` | 5 min | unit + integration + contract + security |
| Pre-merge | `push` to main | 15 min | + e2e + a11y |
| Pre-deploy | deployment trigger | 20 min | + visual |
| Weekly | cron Monday 02:00 | 120 min | Tier 3 performance |

## Caching Patterns

```yaml
# Node.js
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Python
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}

# Playwright browsers
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('**/package-lock.json') }}
```

## Database Service Pattern

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_PASSWORD: testpassword
      POSTGRES_DB: testdb
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports: ['5432:5432']
```

## Secrets Management

```yaml
# ✅ Use GitHub Secrets
env:
  DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

# ❌ Never hardcode
env:
  DATABASE_URL: postgres://user:password@localhost/db
```

## Fail-Fast vs Fail-Safe

```yaml
# Fail-fast (default) — stop on first failure, fast feedback
strategy:
  fail-fast: true

# Continue-on-error — collect all failures, useful for test reporting
- run: npm test
  continue-on-error: true
```

**Rule:** Use fail-fast for PR pipelines (fast feedback). Use continue-on-error for report generation.

## Playwright in CI

```yaml
- run: npx playwright install --with-deps chromium
- run: npx playwright test
  env:
    CI: true
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```
