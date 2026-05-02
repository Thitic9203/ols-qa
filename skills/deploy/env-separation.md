# Environment Separation Reference

## The Two-Environment Rule

Every deployment artifact that affects live data or users must have:
1. A **staging** copy — throwaway, safe to break
2. A **production** copy — real users, treat as precious

They must be **separate** (different project IDs, secrets, DBs) and **in sync** (same code, same schema, same config shape).

## Separation Audit Table

Run this audit after every infra change before shipping:

| Item | Staging value | Production value | Match shape? | Notes |
|------|--------------|-----------------|--------------|-------|
| Project/App ID | staging-xxx | prod-xxx | ✅ | Different IDs, same config key |
| Database URL | staging DB | prod DB | ✅ | |
| API secrets | `*_STAGING` | `*_PROD` | ✅ | |
| Feature flags | may differ | — | — | Document intentional differences |
| Log level | debug | warn/error | — | Intentionally different |
| Service accounts | staging-sa@ | prod-sa@ | ✅ | |

**"Match shape?"** = same environment variable names, same config structure — values differ, keys match.

## Secret Naming Convention

```
# Good — clearly scoped
FIREBASE_TOKEN_STAGING
FIREBASE_TOKEN_PROD

DATABASE_URL_STAGING
DATABASE_URL_PROD

STRIPE_KEY_STAGING
STRIPE_KEY_PROD

# Bad — ambiguous
FIREBASE_TOKEN       ← which env?
DATABASE_URL         ← could accidentally hit prod from staging code
API_SECRET           ← no env signal
```

## GitHub Actions Pattern

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]      # → staging auto
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]   # production = explicit opt-in

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy.sh
        env:
          PROJECT_ID: ${{ secrets.PROJECT_ID_STAGING }}
          DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}
          API_SECRET: ${{ secrets.API_SECRET_STAGING }}

  deploy-production:
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production'
    environment: production    # requires GitHub environment approval
    needs: [verify-staging]    # staging must pass first
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy.sh
        env:
          PROJECT_ID: ${{ secrets.PROJECT_ID_PROD }}
          DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
          API_SECRET: ${{ secrets.API_SECRET_PROD }}
```

## Common Separation Failures

### 1. Staging uses production database
**Symptom:** Test data appears in production reports  
**Cause:** `DATABASE_URL` set to prod connection string in staging env  
**Fix:** Separate DB instances; staging URL must never point to prod

### 2. Workflow targets only one env
**Symptom:** Deploy workflow runs but only staging (or only prod) updates  
**Cause:** Hardcoded project ID or branch ref  
**Fix:** Use environment matrix or separate jobs with env-scoped secrets

### 3. Secret name mismatch
**Symptom:** Staging deploy fails with "missing secret" despite prod working  
**Cause:** Secret named `FOO_PROD` but code reads `FOO_STAGING`  
**Fix:** Audit all `${{ secrets.* }}` references match GitHub Secrets names exactly

### 4. Schema deployed to staging but not production
**Symptom:** Feature works on staging, fails on prod with column-not-found  
**Cause:** Migration ran against staging DB only  
**Fix:** Run migration script against both DBs; use migration tracking table

### 5. Feature flags hardcoded to staging project ID
**Symptom:** Feature flag evaluations wrong in production  
**Cause:** Flag SDK initialized with staging project ID  
**Fix:** Pass project ID via env var: `FLAG_PROJECT_ID_STAGING` / `FLAG_PROJECT_ID_PROD`

## Firebase-Specific Separation

```bash
# Check active project
firebase use

# Switch to staging
firebase use staging

# Deploy to staging only
firebase deploy --project=staging-project-id

# Deploy to production (explicit)
firebase deploy --project=prod-project-id
```

**`.firebaserc` pattern:**
```json
{
  "projects": {
    "staging": "my-app-staging",
    "production": "my-app-prod"
  }
}
```

## Verification Commands

```bash
# Verify env vars are scoped correctly (look for any staging values in prod config)
grep -r "staging" .env.production 2>/dev/null && echo "⚠️ staging reference in prod config!"

# Check GitHub Secrets exist for both envs
gh secret list --env staging
gh secret list --env production

# Diff the secret KEY NAMES (not values) between envs
diff <(gh secret list --env staging --json name -q '.[].name' | sort) \
     <(gh secret list --env production --json name -q '.[].name' | sort)
```
