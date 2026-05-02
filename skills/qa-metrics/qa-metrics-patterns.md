# QA Metrics Patterns

## Knowledge Sources
- [GQM Framework — Basili & Weiss](https://en.wikipedia.org/wiki/GQM)
- [ISTQB CTFL v4.0 — Test Monitoring and Control](https://www.istqb.org/certifications/certified-tester-foundation-level)
- [chart.js Documentation](https://www.chartjs.org/docs/latest/)

## Core Metrics Formulas

```
Test Pass Rate            = Passed / Total × 100%
                            Target: ≥ 95%

Defect Density            = Defects / KLOC
                            Target: < 5 defects/KLOC

Defect Removal Efficiency = Testing defects / (Testing + Prod defects) × 100%
                            Target: ≥ 85%

Automation Coverage       = Automated tests / Total test cases × 100%
                            Target: ≥ 70%

Mean Time to Detect       = Avg(defect found date - commit date)
                            Target: < 24 hours

Escaped Defects           = Defects found in production
                            Target: 0 P0/P1 escapes
```

## GQM — Goal-Question-Metric

Define metrics top-down:
1. **Goal** — "Improve release quality"
2. **Questions** — "How many defects escape to production?"
3. **Metrics** — "Escaped defect count per release"

## Chart.js Templates

### Bar Chart — Tests by Tier
```javascript
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Unit', 'Integration', 'Contract', 'E2E', 'Security', 'A11y', 'Visual'],
    datasets: [
      { label: 'Passed', data: [...], backgroundColor: '#22c55e' },
      { label: 'Failed', data: [...], backgroundColor: '#ef4444' },
      { label: 'Skipped', data: [...], backgroundColor: '#94a3b8' }
    ]
  }
});
```

### Line Chart — Coverage Trend
```javascript
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['v1.0', 'v1.1', 'v1.2', 'v1.3', 'v1.4'],
    datasets: [{ label: 'Unit Coverage %', data: [...], borderColor: '#3b82f6' }]
  }
});
```

### Doughnut Chart — Defects by Severity
```javascript
new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['P0 Critical', 'P1 High', 'P2 Medium', 'P3 Low'],
    datasets: [{ data: [...], backgroundColor: ['#dc2626','#f97316','#eab308','#22c55e'] }]
  }
});
```

## Metric Interpretation

| Metric | Good | Warning | Action Needed |
|--------|------|---------|--------------|
| Pass Rate | ≥ 95% | 85–95% | < 85% |
| Unit Coverage | ≥ 80% | 60–80% | < 60% |
| DRE | ≥ 85% | 70–85% | < 70% |
| Escaped Defects (P0/P1) | 0 | — | ≥ 1 |
| Automation Coverage | ≥ 70% | 40–70% | < 40% |
