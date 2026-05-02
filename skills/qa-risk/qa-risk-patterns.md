# QA Risk Patterns

## Knowledge Sources
- [ISO 31000:2018 — Risk Management](https://www.iso.org/standard/65694.html)
- [ISTQB CTFL v4.0 — Risk-Based Testing](https://www.istqb.org/certifications/certified-tester-foundation-level)
- [James Bach — Risk-Based Testing](https://www.satisfice.com/download/heuristic-risk-based-testing)

## Risk Identification Heuristics

Ask these questions to find risks:
- Where is the most complex code? (cyclomatic complexity)
- What changed most in this release? (git diff --stat)
- What broke in previous releases? (defect log history)
- What has the lowest test coverage? (coverage report)
- What has third-party dependencies? (package.json, requirements.txt)
- What handles money, PII, or critical data?
- What is new to the team (unfamiliar code)?

## Likelihood Scoring

| Score | Likelihood | Criteria |
|-------|-----------|----------|
| 1 | Rare | Changed rarely, well-tested, simple code |
| 2 | Unlikely | Changed occasionally, some test coverage |
| 3 | Possible | Changed this release, moderate complexity |
| 4 | Likely | High change frequency, complex, low coverage |

## Impact Scoring

| Score | Impact | Criteria |
|-------|--------|----------|
| 1 | Negligible | Cosmetic, no user/business impact |
| 2 | Minor | Minor degradation, workaround available |
| 3 | Significant | Core feature degraded, some user impact |
| 4 | Critical | Data loss, security breach, system down |

## Risk Score → Test Priority

| Score Range | Priority | Action |
|-------------|----------|--------|
| 12–16 | 🔴 Critical | Test every release, automate, add to Tier 3 perf if high load |
| 8–11 | 🔴 High | Test every release, automate |
| 4–7 | 🟡 Medium | Test on change, partial automation |
| 1–3 | 🟢 Low | Test on major releases, manual ok |

## Common High-Risk Areas

- Authentication & authorization flows
- Payment processing
- Data persistence and migration
- Third-party API integrations
- File upload/download
- Concurrent user operations
- Error handling and recovery
- Search and filtering with large datasets
