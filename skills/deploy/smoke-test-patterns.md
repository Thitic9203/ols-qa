# Smoke Test Patterns

## What Smoke Tests Are (and Aren't)

**Are:** Rapid validation that the deployed app is alive and core flows work.  
**Not:** Comprehensive E2E tests. Run those before deploy, not after.

Target: **< 5 minutes** total. If it takes longer, it's not a smoke test.

## Smoke Test Checklist Template

```
[ ] Health check endpoint responds 200
[ ] Auth flow works (login returns token)
[ ] Main read operation succeeds
[ ] Main write operation succeeds
[ ] Critical 3rd-party integration responds
[ ] No error spikes in logs (last 2 min)
[ ] Response times within baseline (p95 < 500ms)
```

## Categories of Smoke Tests

### 1. Infrastructure Alive
```bash
# Health check
curl -f https://your-app.com/health || exit 1
curl -f https://your-app.com/api/health || exit 1

# Expected response
# {"status": "ok", "version": "1.2.3", "db": "connected"}
```

### 2. Authentication Working
```bash
# Login and get token
TOKEN=$(curl -s -X POST https://your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"smoketest123"}' \
  | jq -r '.token')

[ -n "$TOKEN" ] && echo "✅ Auth ok" || (echo "❌ Auth failed"; exit 1)
```

### 3. Core Read Operation
```bash
# Authenticated read
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  https://your-app.com/api/items)

[ "$STATUS" = "200" ] && echo "✅ Read ok" || (echo "❌ Read failed: $STATUS"; exit 1)
```

### 4. Core Write Operation
```bash
# Create a test record (delete it after)
ITEM_ID=$(curl -s -X POST https://your-app.com/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"smoke-test-item","_smoke":true}' \
  | jq -r '.id')

# Cleanup
curl -s -X DELETE "https://your-app.com/api/items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN"

[ -n "$ITEM_ID" ] && echo "✅ Write ok" || (echo "❌ Write failed"; exit 1)
```

### 5. Response Time Check
```bash
# p95 under 500ms using ab
ab -n 20 -c 5 -H "Authorization: Bearer $TOKEN" \
  https://your-app.com/api/items 2>&1 | grep "99%"

# Or with curl timing
curl -w "time_total: %{time_total}s\n" -o /dev/null -s \
  https://your-app.com/api/items
```

## Full Smoke Test Script

```bash
#!/bin/bash
# scripts/smoke-test.sh
set -e

BASE_URL="${1:-https://staging.your-app.com}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "✅ $name"
    ((PASS++))
  else
    echo "❌ $name"
    ((FAIL++))
  fi
}

echo "🔍 Smoke tests: $BASE_URL"
echo "---"

check "Health endpoint" "curl -sf $BASE_URL/health"
check "API health" "curl -sf $BASE_URL/api/health"

TOKEN=$(curl -sf -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"smoketest123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

check "Auth login" "[ -n '$TOKEN' ]"
check "List items" "curl -sf -H 'Authorization: Bearer $TOKEN' $BASE_URL/api/items"

echo "---"
echo "Result: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
```

## Smoke Test for Different Stack Types

### Next.js / React SPA
```bash
# Check page renders (not just server responds)
curl -sf https://app.com/ | grep -q "<title>" || exit 1
curl -sf https://app.com/_next/static/ -I | grep -q "200" || exit 1
```

### Firebase Hosting
```bash
# Check hosting responds
curl -sf https://your-project.web.app/ -I | grep -q "200"

# Check Firestore via REST
curl -sf \
  "https://firestore.googleapis.com/v1/projects/YOUR_ID/databases/(default)/documents/health/status" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"
```

### Docker / Kubernetes
```bash
# Readiness probe equivalent
kubectl rollout status deployment/your-app --timeout=120s
kubectl get pods -l app=your-app | grep Running
```

## Post-Deploy Log Check

```bash
# Check for error spikes in last 2 minutes
# Firebase
firebase functions:log --only errors --since 2m

# Kubernetes
kubectl logs -l app=your-app --since=2m | grep -i "error\|exception\|fatal"

# Heroku
heroku logs --tail --dyno=web --num=50 | grep "ERROR"
```

## Go / No-Go Decision

After smoke tests:

| Result | Action |
|--------|--------|
| All pass | ✅ Deployment confirmed — notify team |
| 1 non-critical fail | ⚠️ Investigate but may proceed |
| Any critical fail | ❌ Rollback immediately |
| Latency > 2× baseline | ❌ Rollback — performance regression |
| Error rate > 5% | ❌ Rollback immediately |

## Rollback Commands

```bash
# Git-based rollback
git revert HEAD --no-edit
git push origin main

# Firebase rollback  
firebase hosting:releases:rollback

# Kubernetes rollback
kubectl rollout undo deployment/your-app

# Heroku rollback
heroku rollback v[N]
```
