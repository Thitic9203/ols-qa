# Deny the OLS worker the credential folder: plan

Spec: [spec.md](spec.md)

| File | Change | Rules |
|---|---|---|
| `.claude/settings.json` | append the R1 entries to `permissions.deny` | R1, R2 |
| `tools/secrets-deny/secrets_deny.test.js` (picked up by `scripts/list-test-suites.sh`, run by `.github/workflows/tests.yml`) | new: asserts every R1 entry, valid JSON | R3 |

No dependency, no cost (New cost: NO). What may break: nothing at runtime; a session in this repo can no
longer read `~/.ols-qa-secrets` through these tools, which is the intent.
