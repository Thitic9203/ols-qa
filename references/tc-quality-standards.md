# Manual test case quality standards (ISTQB + ISO/IEC/IEEE 29119-3)

Use during **TC FE prep** and **TC API prep** review steps before the user sees the draft table.

**Framework:** Principles from **ISTQB** (clear objectives, observable results, appropriate test techniques) aligned with **ISO/IEC/IEEE 29119-3** (*Software and systems engineering — Software testing — Part 3: Test documentation*), especially test-case documentation attributes.

This is a **practical checklist for manual TC tables**, not a certification exam summary.

---

## Required attributes per test case (29119-3-aligned)

Each row MUST be reviewable against:

| Attribute | What “good” looks like | Common fail |
|-----------|------------------------|-------------|
| **Objective / title** | States what is verified in one line | Vague title (“check page”) |
| **Traceability** | Links to AC/EC (FE) or endpoint + spec section (API) | Orphan row |
| **Preconditions** | System/data state before steps; achievable | Missing login/data setup |
| **Inputs / test data** | Concrete values, roles, payloads | “Valid data” only |
| **Steps** | Numbered, one action per step where possible | Wall of text |
| **Expected results** | Observable, numbered, match steps | “Works correctly” |
| **Priority** | High / Medium / Low with rationale implied by risk | All High |

---

## ISTQB-aligned design principles

Apply to **every** row:

1. **Observable pass/fail** — tester can decide PASS/FAIL without guessing (UI text, status code, field value).
2. **Appropriate granularity** — one logical verification per case; split if steps verify unrelated things.
3. **Independence where practical** — case can run after shared prep without hidden order dependency (note order in Preconditions if unavoidable).
4. **Positive and negative** — where AC/EC or API contract requires invalid input / error paths, include them (do not only happy path).
5. **Repeatable** — same steps + data produce same observable outcome (no “try until works”).
6. **No implementation leakage** — steps describe user/API behaviour, not internal class or DB table names unless the AC requires it.

---

## Review pass/fail (quality gate)

Before draft approval, mark each item **PASS** or **FIX** (with row IDs):

- [ ] Every row has **Test Steps** and **Expected Result** with matching numbering where used.
- [ ] Expected results are **specific** (exact message fragment, status code, field name, visibility).
- [ ] Preconditions + shared prep make the case **executable** by another tester.
- [ ] Priorities are assigned; critical paths are not all Medium.
- [ ] Language matches destination (English for Helix chat; Jira/Confluence may follow project doc language when user specifies).

If any **FIX** remains → revise table and re-run this checklist (max 2 rounds per skill-rules fix-verify).

---

## What this document does not require

- One test case per AC/EC line (FE may merge or split logically — see [ac-ec-coverage-review.md](../skills/tc-fe-prep-workflow/references/ac-ec-coverage-review.md)).
- One test case per Swagger path only (API may have multiple cases per endpoint — see [spec-coverage-review.md](../skills/tc-api-prep-workflow/references/spec-coverage-review.md)).
- Automated test scripts or Gherkin unless the user asks.
