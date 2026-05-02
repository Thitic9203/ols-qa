---
name: qa-ci
description: "[QA Technical · CI/CD Integration] Sets up GitHub Actions workflows for all 3 test tiers — pre-commit hooks, PR pipelines, pre-merge gates, staging gates, and weekly performance schedules."
---

# Helix — CI Pipeline Setup

> 📚 **Knowledge References** (loaded automatically):
> `qa-ci-patterns.md` — GitHub Actions workflow templates, test tier scheduling, matrix strategies, caching patterns

A well-structured CI pipeline runs the right tests at the right time — fast feedback on commits, thorough gates before merge, full quality check before deploy.

## Step 1: Detect Stack

Scan for:
- Package manager: `package.json` → npm/yarn/pnpm, `pyproject.toml` → pip/poetry
- Test frameworks: Jest, Vitest, pytest, Go test
- Existing workflows: `.github/workflows/`

## Step 2: 5-Stage Pipeline Architecture

```
Stage 1 — Pre-commit (local, < 30s)
  → unit tests only

Stage 2 — Pull Request (CI, < 5 min)
  → unit + integration + contract + security

Stage 3 — Pre-merge to main (CI, < 15 min)
  → + e2e + a11y

Stage 4 — Pre-deploy to staging (CI, < 20 min)
  → + visual regression

Stage 5 — Weekly schedule (CI, 60-120 min)
  → full Tier 3 performance pipeline
```

## Step 3: Generate Workflows

### `.github/workflows/pr.yml` (Stage 2)
```yaml
name: PR — Functional + Security Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: postgres }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:contract
      - run: npx semgrep --config=auto --error
```

### `.github/workflows/pre-merge.yml` (Stage 3)
```yaml
name: Pre-merge — E2E + Accessibility
on:
  push:
    branches: [main]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright install --with-deps
      - run: npm run test:e2e
      - run: npm run test:a11y
```

### `.github/workflows/perf.yml` (Stage 5 — weekly)
```yaml
name: Weekly Performance Pipeline
on:
  schedule:
    - cron: '0 2 * * 1'  # Monday 02:00 UTC
jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:perf:load
      - run: npm run test:perf:stress
      - run: npm run test:perf:frontend
```

## Step 4: Pre-commit Hook (local)

```bash
# .husky/pre-commit
npx jest --testPathPattern=unit --passWithNoTests
```

```json
// package.json
"scripts": {
  "prepare": "husky install"
}
```

## Step 5: Output

Generate all workflow files under `.github/workflows/` + `.husky/`.
Commit to repo.

## Done

Present: workflows created, stages mapped, estimated run times per stage.

## Self-Evaluation Loop

```
1. ทุก stage มี timeout ที่เหมาะสมไหม?
2. Secrets ถูก reference ผ่าน GitHub Secrets ไหม (ไม่ hardcode)?
3. Caching ถูก setup ไหม (npm, pip, gradle)?
4. Performance workflow ใช้ schedule ไม่ใช่ push trigger ไหม?
```
