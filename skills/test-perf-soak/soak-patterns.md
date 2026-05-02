# Soak Test Patterns

## Healthy vs. Leak Signatures

### Memory (Node.js heap)
```
✅ Healthy:  120MB → 128MB → 121MB → 125MB  (GC cycles back)
⚠️ Growing:  120MB → 135MB → 148MB → 160MB  (slow leak)
❌ Leaking:  120MB → 200MB → 280MB → 360MB  (fast leak)
```

### Connection pool (PostgreSQL)
```
✅ Healthy:  8 → 10 → 9 → 10  (stable under load)
❌ Leaking:  8 → 15 → 22 → 30  (new conns, none released)
```

### File descriptors
```bash
# Check per process
lsof -p $(pgrep -f "node app") | wc -l
# Should stay stable; growing = fd leak
```

## Common Leak Sources

| Pattern | Language | Typical fix |
|---------|---------|------------|
| EventEmitter never removed | Node.js | `emitter.removeListener()` or `once()` |
| setInterval never cleared | JS | `clearInterval()` in cleanup |
| DB connection not released | Any | ensure `finally { conn.release() }` |
| Large object in module cache | Node.js | Use WeakRef or bounded cache |
| Closure over request object | Node.js | Don't store req/res in outer scope |
| Growing in-memory cache | Any | Add TTL + max size eviction |
| Redis client per request | Node.js | Use single global client |

## Monitoring Script Templates

### Node.js memory poller
```bash
#!/bin/bash
# Run alongside soak test
while true; do
  echo -n "$(date '+%H:%M:%S') heap: "
  node -e "const m=process.memoryUsage(); \
    console.log(Math.round(m.heapUsed/1e6)+'MB used / '+\
    Math.round(m.heapTotal/1e6)+'MB total')" 2>/dev/null || echo "app not running"
  sleep 60
done
```

### PostgreSQL connection monitor
```sql
-- Run every 5 min during soak
SELECT NOW()::time(0) AS time,
       state,
       COUNT(*) AS count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY count DESC;
```

## Soak Duration Guide

| App type | Minimum | Ideal |
|----------|---------|-------|
| Short-lived requests (API) | 30 min | 60 min |
| Long-running connections (WS) | 60 min | 120 min |
| Batch jobs | 1 run + 2 repeat | 3 runs |
| Cron-based | 24h | 48h |

## clinic.js heapdump Workflow

```bash
# 1. Start with heapdump
clinic heapdump -- node app.js

# 2. Run load test for 30 min (in another terminal)
k6 run --duration 30m tests/performance/load.js

# 3. Stop app (Ctrl+C) — clinic auto-generates report
# 4. Browser opens with heap timeline
# Look for: objects that increase and never decrease
```
