---
name: qa-metrics
description: "[QA Process · Quality Metrics] Generates quality metrics dashboard — defect density, test effectiveness, coverage trend. Outputs HTML dashboard (chart.js) + Markdown summary committed to repo."
---

# Helix — QA Metrics Dashboard

> 📚 **Knowledge References** (loaded automatically):
> `qa-metrics-patterns.md` — GQM framework, defect density formulas, test effectiveness metrics, chart.js templates

Quality metrics make the invisible visible — they show whether testing is improving or degrading over time, and where investment should go.

## Step 1: Collect Data

Gather from existing reports:
```
- Test results per tier (pass/fail counts, durations)
- Coverage reports (unit %, integration %)
- Defect log: docs/qa/defect-log.md
- Previous metrics: docs/qa/reports/qa-metrics-*.md (for trend)
```

## Step 2: Calculate Core Metrics

### Defect Metrics
```
Defect Density       = Total defects / KLOC (or story points)
Defect Removal Eff.  = Defects found in testing / (found in testing + found in prod) × 100%
Defect Fix Rate      = Fixed defects / Total defects × 100%
Escaped Defects      = Defects found in production after release
```

### Test Effectiveness
```
Test Pass Rate        = Passed tests / Total tests × 100%
Test Coverage         = Lines covered / Total lines × 100% (per tier)
Automation Coverage   = Automated tests / Total test cases × 100%
Mean Time to Detect   = Avg time from code commit to defect found
```

### Trend Indicators
Compare current vs previous release:
- Coverage trend: ↑ improving / ↓ declining
- Defect density trend: ↓ improving / ↑ concerning
- P0/P1 defect count trend

## Step 3: Generate HTML Dashboard

Create `qa-reports/metrics-YYYY-MM-DD.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>QA Metrics — [Release]</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <!-- Summary cards: Pass Rate, Coverage, Defect Density, DRE -->
  <!-- Bar chart: Tests by tier (passed/failed/skipped) -->
  <!-- Line chart: Coverage trend over last 5 releases -->
  <!-- Doughnut chart: Defects by severity -->
  <!-- Table: Top 5 defect-prone areas -->
</body>
</html>
```

## Step 4: Generate Markdown Summary

Create `qa-reports/metrics-YYYY-MM-DD.md`:

```markdown
# QA Metrics — [Release] — [Date]

## Summary
| Metric | Current | Previous | Trend |
|--------|---------|----------|-------|
| Test Pass Rate | —% | —% | ↑/↓ |
| Unit Coverage | —% | —% | ↑/↓ |
| Defect Density | — | — | ↑/↓ |
| Defect Removal Efficiency | —% | —% | ↑/↓ |
| Escaped Defects | — | — | ↑/↓ |

## Test Results by Tier
[Table per tier]

## Defect Summary
[Severity breakdown]

## Recommendations
[Top 3 actionable improvements based on metrics]
```

Commit both files to repo.

## Step 5: Interpret and Recommend

Automatically flag:
- Pass rate < 95% → investigate failing tests
- Coverage declining → coverage debt accumulating
- DRE < 80% → too many defects escaping to production
- Escaped defects increasing → test coverage gap in production-like scenarios

## Done

Present: dashboard path (HTML) + summary path (MD) + top 3 recommendations.

## Self-Evaluation Loop

```
1. ทุก metric มีนิยามชัดเจน วัดได้จริงไหม?
2. Trend มีข้อมูลเปรียบเทียบ release ก่อนหน้าไหม?
3. HTML dashboard เปิด browser ได้โดยไม่ต้องมี server ไหม?
4. Recommendations actionable และ specific ไหม?
```
