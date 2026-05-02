# QA Plan Patterns

## Knowledge Sources
- [IEEE 829 — Test Plan Standard](https://standards.ieee.org/ieee/829/1689/)
- [ISTQB CTFL v4.0 — Test Planning](https://www.istqb.org/certifications/certified-tester-foundation-level)

## IEEE 829 Test Plan Structure

1. Test plan identifier
2. Introduction / scope
3. Test items (features under test)
4. Features to be tested
5. Features not to be tested
6. Approach
7. Item pass/fail criteria
8. Suspension criteria and resumption requirements
9. Test deliverables
10. Testing tasks
11. Environmental needs
12. Responsibilities
13. Staffing and training needs
14. Schedule
15. Risks and contingencies
16. Approvals

## Entry/Exit Criteria Templates

### Entry Criteria
- Build successfully deployed to test environment
- Unit tests pass with ≥ coverage targets
- Test data seeded and verified
- No blocking infrastructure issues

### Exit Criteria
- All in-scope test cases executed
- Pass rate ≥ 95%
- P0/P1 defects = 0
- Test report signed off

## Schedule Buffers

| Phase Duration | Buffer to Add |
|---------------|--------------|
| < 1 week | 20% |
| 1–2 weeks | 15% |
| 2–4 weeks | 10% |

**Rule:** Always add defect-fix-and-retest time (≥ 20% of test execution time).

## Resource Planning Matrix

| Role | Tier 1 | Tier 2 | Exploratory | Reporting |
|------|--------|--------|-------------|-----------|
| QA Engineer | ✅ | ✅ | ✅ | ✅ |
| Developer | ✅ | Support | — | — |
| DevOps | — | Support | — | CI setup |
| Product Owner | — | Review | — | Sign-off |
