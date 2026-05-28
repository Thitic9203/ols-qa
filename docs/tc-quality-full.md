# TC quality standards — full framework explanation

Runtime checklist → [references/tc-quality-standards.md](../references/tc-quality-standards.md).

## Framework

Principles from **ISTQB** (clear objectives, observable results, appropriate test techniques) aligned with **ISO/IEC/IEEE 29119-3** (*Software and systems engineering — Software testing — Part 3: Test documentation*), especially test-case documentation attributes.

## ISTQB design principles (expanded)

1. **Observable pass/fail** — tester can decide PASS/FAIL without guessing (UI text, status code, field value).
2. **Appropriate granularity** — one logical verification per case; split if steps verify unrelated things.
3. **Independence where practical** — case can run after shared prep without hidden order dependency (note order in Preconditions if unavoidable).
4. **Positive and negative** — where AC/EC or API contract requires invalid input / error paths, include them (do not only happy path).
5. **Repeatable** — same steps + data produce same observable outcome (no "try until works").
6. **No implementation leakage** — steps describe user/API behaviour, not internal class or DB table names unless the AC requires it.

## What this standard does not require

- One test case per AC/EC line (FE may merge or split logically — see ac-ec-coverage-review.md).
- One test case per Swagger path only (API may have multiple cases per endpoint — see spec-coverage-review.md).
- Automated test scripts or Gherkin unless the user asks.
