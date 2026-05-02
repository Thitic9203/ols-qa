---
name: qa-report
description: "[QA Process · Test Reporting] Generates a test execution report — aggregates results from all tiers, pass/fail summary, coverage, trend, and sign-off recommendation."
---

# Helix — Test Report

> 📚 **Knowledge References** (loaded automatically):
> `qa-report-patterns.md` — test report templates (IEEE 829), pass/fail metrics, trend analysis, sign-off criteria

A test report communicates the quality status of the release to stakeholders — what was tested, what passed, what failed, and whether it's safe to ship.

## Step 1: Collect Results

Scan for test result files:
```
test-results/unit-results.json
test-results/integration-results.json
test-results/e2e-results.json
test-results/security-results.json
test-results/a11y-results.json
test-results/visual-results.json
playwright-report/index.html
coverage/lcov-report/index.html
```

Ask user for any missing results or manual test outcomes.

## Step 2: Build Summary Table

```markdown
| Test Tier | Total | Passed | Failed | Skipped | Coverage | Status |
|-----------|-------|--------|--------|---------|----------|--------|
| Unit      | —     | —      | —      | —       | —%       | ✅/❌  |
| Integration | —   | —      | —      | —       | —%       | ✅/❌  |
| Contract  | —     | —      | —      | —       | —        | ✅/❌  |
| E2E       | —     | —      | —      | —       | —        | ✅/❌  |
| Security  | —     | —      | —      | —       | —        | ✅/❌  |
| A11y      | —     | —      | —      | —       | —        | ✅/❌  |
| Visual    | —     | —      | —      | —       | —        | ✅/❌  |
| **Total** | —     | —      | —      | —       | —        | —      |
```

## Step 3: Defect Summary

```markdown
| Severity | Open | Fixed | Deferred | Total |
|----------|------|-------|----------|-------|
| P0 — Critical | — | — | — | — |
| P1 — High     | — | — | — | — |
| P2 — Medium   | — | — | — | — |
| P3 — Low      | — | — | — | — |
```

**Rule:** P0/P1 open → cannot ship. P2 needs sign-off. P3 can defer.

## Step 4: Sign-off Decision

```
✅ PASS — All tiers green, P0/P1 resolved → Ready to deploy
⚠️ CONDITIONAL PASS — P2 accepted by stakeholder → Deploy with known issues documented
❌ FAIL — P0/P1 open OR Tier 1 failures → Do not deploy
```

## Step 5: Output

Save to `docs/qa/reports/qa-report-YYYY-MM-DD.md`:

```markdown
# QA Test Report — [Release] — [Date]

## Executive Summary
## Test Results by Tier
## Defect Summary
## Risk Assessment
## Sign-off Decision
## Appendix — Links to detailed reports
```

Commit to repo.

## Done

Present report path + sign-off decision.
If ❌ FAIL: list P0/P1 blockers clearly.
Suggest next step: `/helix qa-defect` to document open issues, or `/helix deploy` if ✅ PASS.

## Self-Evaluation Loop

```
1. ครอบคลุมทุก tier ที่ run ไปแล้วไหม?
2. Sign-off decision มีเหตุผลชัดเจนไหม?
3. Defect summary ตรงกับ qa-defect log ไหม?
4. Stakeholder อ่านแล้วเข้าใจได้ทันทีไหม?
```
