# Manual test case quality standards (ISTQB + ISO/IEC/IEEE 29119-3)

Practical checklist for TC FE/API prep review steps. Full framework explanation → [docs/tc-quality-full.md](../docs/tc-quality-full.md).

## Required attributes per test case

Each row MUST have:

| Attribute | Good | Fail |
|-----------|------|------|
| **Objective / title** | One-line what-is-verified | Vague ("check page") |
| **Traceability** | Links to AC/EC or endpoint + spec | Orphan row |
| **Preconditions** | System/data state before steps | Missing login/data |
| **Inputs / test data** | Concrete values, roles, payloads | "Valid data" only |
| **Steps** | Numbered, one action per step | Wall of text |
| **Expected results** | Observable, match steps | "Works correctly" |
| **Priority** | High / Medium / Low | All High |

## Design principles

1. **Observable pass/fail** — tester decides without guessing.
2. **Appropriate granularity** — one logical verification per case.
3. **Independence** — no hidden order dependency (note in Preconditions if unavoidable).
4. **Positive and negative** — include error paths from AC/EC or API contract.
5. **Repeatable** — same steps + data = same outcome.
6. **No implementation leakage** — user/API behaviour, not internal names.

## Review gate

Before draft approval, check:

- [ ] Every row has **Test Steps** and **Expected Result** with matching numbering.
- [ ] Expected results are **specific** (message fragment, status code, field name).
- [ ] Preconditions make the case **executable** by another tester.
- [ ] Priorities assigned; critical paths are not all Medium.

If any **FIX** remains → revise and re-check (max 2 rounds).
