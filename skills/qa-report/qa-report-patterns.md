# Test Report Patterns

## Knowledge Sources
- [IEEE 829 — Test Summary Report](https://standards.ieee.org/ieee/829/1689/)
- [ISTQB CTFL v4.0 — Test Completion](https://www.istqb.org/certifications/certified-tester-foundation-level)

## Report Audience Types

| Audience | Focus | Detail Level |
|----------|-------|-------------|
| Executive | Go/No-go decision, risk, timeline | Low — 1 page |
| QA Lead | Full metrics, trend, defect breakdown | Medium |
| Development team | Specific failures, root cause | High |
| Product Owner | Feature coverage, sign-off | Low-Medium |

## Sign-off Decision Matrix

| Condition | Decision |
|-----------|----------|
| All tiers green + 0 P0/P1 | ✅ PASS — Deploy |
| Tier 1 green + P2 accepted by PO | ⚠️ CONDITIONAL PASS — Deploy with docs |
| Any P0/P1 open | ❌ FAIL — Do not deploy |
| Tier 1 failure | ❌ FAIL — Do not deploy |
| Only Tier 2/3 failure (non-critical) | ⚠️ RISK ACCEPTED — PO decision |

## Trend Analysis

Compare these across last 5 releases:
- Pass rate trend (target: ≥ 95% and improving)
- Open P0/P1 at release (target: 0)
- Escaped defects to production (target: decreasing)
- Mean time from defect report to fix

## Test Report Sections (IEEE 829)

1. **Test report identifier**
2. **Summary** — what was tested, overall result
3. **Variances** — deviations from test plan
4. **Comprehensive assessment** — quality assessment
5. **Summary of results** — stats table
6. **Evaluation** — readiness recommendation
7. **Summary of activities** — effort spent
8. **Approvals** — sign-off section

## Defect Classification at Report Time

- **Resolved** — fixed and verified in this release
- **Deferred** — accepted by PO for future sprint
- **Won't fix** — product decision, documented
- **Open** — must be addressed before deployment (P0/P1)
