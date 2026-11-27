# {PROJECT} test data prep recipe (template)

Copy to the **project's own repo** as `references/{PROJECT}-data-prep.md` (never into Helix). `test-data-prep-workflow`
finds it there and takes every value from it. Leave a slot as `not configured` until the team supplies it — the
workflow then asks once and saves the answer here. Never write a password or token into this file; store only
where the secret lives (for example a local secrets folder path or a vault entry name).

| Slot | Value for {PROJECT} | Source (doc, decision, or who said it) |
|------|---------------------|----------------------------------------|
| Source documents to read first | not configured | |
| Environments the workflow may touch (and which it must never touch) | not configured | |
| Network / VPN notes per environment | not configured | |
| Roles and test accounts (names only) | not configured | |
| Where secrets live (`{SECRETS_DIR}`) | not configured | |
| Data types | not configured | |
| Allowed target statuses per data type | not configured | |
| List endpoint or UI path per data type (reuse check) | not configured | |
| Create recipe + status-transition chain per data type | not configured | |
| Tracking label (for example the ticket key) and the field it goes in | not configured | |
| Naming language, tone, and forbidden markers | not configured | |
| Style buckets / themes | not configured | |
| Cover pipeline, its rules, cover gate, approved reference lot | none (no covers) | |
| Video spec | none (no videos) | |
| Tools root (`{QA_TOOLS_ROOT}`) and scripts to reuse | not configured | |
| Readback / publish-chain gates | not configured | |
| Clean-up policy | not configured | |

## Corrections log

Record every user correction here with its date, so the next run does not repeat the mistake.
