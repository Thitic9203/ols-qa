# QA Strategy Patterns

## Knowledge Sources
- [ISTQB CTFL v4.0 Syllabus](https://www.istqb.org/certifications/certified-tester-foundation-level)
- [ISO/IEC 25010:2011 SQuaRE](https://www.iso.org/standard/35733.html)
- [Google Testing Blog — Test Strategy](https://testing.googleblog.com/)

## Strategy Types (ISTQB)

| Type | When to Use |
|------|-------------|
| **Analytical** (risk-based) | Risk appetite known, coverage driven by risk matrix |
| **Model-based** | Complex state machines, workflow-heavy systems |
| **Methodical** | Regulated industries (healthcare, finance) — checklist-driven |
| **Process-compliant** | Standards compliance (ISO, GDPR, HIPAA) |
| **Reactive** | Exploratory-first, respond to findings dynamically |
| **Consultative** | Stakeholder-driven, coverage decided by business owners |

## Coverage Goals by Quality Characteristic (ISO 25010)

| Characteristic | Minimum Coverage | Key Test Types |
|----------------|-----------------|----------------|
| Functional Suitability | All critical paths | Unit, Integration, E2E, Contract |
| Security | OWASP Top 10 + CVE scan | test-security |
| Usability | WCAG 2.1 AA + visual consistency | test-a11y, test-visual |
| Performance Efficiency | p95 < SLO at peak load | test-perf-load |
| Reliability | Error handling + recovery | Integration, E2E |

## Exit Criteria Templates

### Sprint Exit Criteria
- All Tier 1 tests passing
- Zero P0/P1 open defects
- Unit coverage ≥ 80% on new code

### Release Exit Criteria
- All Tier 1 + Tier 2 tests passing
- Zero P0/P1 open defects
- P2 defects accepted by Product Owner
- Performance SLOs met (if applicable)
- Sign-off document approved

## Risk Appetite Levels

| Level | Description | Example Industry |
|-------|-------------|-----------------|
| **Conservative** | Zero tolerance for P0/P1 | Healthcare, Finance, Legal |
| **Moderate** | P0 = blocker, P1 = must fix this sprint | E-commerce, SaaS |
| **Aggressive** | Ship fast, fix in next sprint | Early-stage startup |
