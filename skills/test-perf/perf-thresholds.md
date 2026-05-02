# Performance Thresholds Reference

## Golden Signals (require thresholds before any run)

| Signal | What it measures | Recommended starting threshold |
|--------|-----------------|--------------------------------|
| p50 latency | Median response time | < 200ms (API), < 100ms (DB query) |
| p95 latency | 95th percentile | < 500ms (API), < 300ms (DB) |
| p99 latency | Worst-case real user | < 1000ms (API) |
| Error rate | % requests failed | < 1% at load target |
| Throughput | Requests/second sustained | Baseline × 2 (headroom) |
| Concurrency | Simultaneous users | As per spec; default 50 |

## Tool Selection by Use Case (all free)

| Scenario | Tool | Install | Command |
|----------|------|---------|---------|
| HTTP API load test | k6 | `brew install k6` | `k6 run script.js` |
| Node.js HTTP benchmark | autocannon | `npm i -g autocannon` | `autocannon -c 50 -d 30 http://...` |
| Python/multiprotocol | locust | `pip install locust` | `locust -f locustfile.py` |
| Quick one-liner | ab (Apache Bench) | pre-installed macOS | `ab -n 1000 -c 50 http://...` |
| Database query perf | EXPLAIN ANALYZE | built-in SQL | `EXPLAIN ANALYZE SELECT ...` |
| Memory/CPU profiling | Node: `--prof` flag | built-in | `node --prof app.js` |

## k6 Script Template

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up
    { duration: '60s', target: 50 },   // sustained load
    { duration: '15s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // < 1% errors
    errors: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/endpoint');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time ok': (r) => r.timings.duration < 500,
  });
  errorRate.add(res.status !== 200);
  sleep(1);
}
```

## Locust Script Template

```python
from locust import HttpUser, task, between

class APIUser(HttpUser):
    wait_time = between(1, 2)

    @task(3)
    def get_main(self):
        self.client.get("/api/endpoint")

    @task(1)
    def post_data(self):
        self.client.post("/api/create", json={"key": "value"})
```

## Interpreting Results

### Normal distribution shape
- p50 ≈ average ✅
- p95 < 2.5× p50 ✅
- p99 < 5× p50 ✅ (if p99 >> p95: bimodal, investigate)

### Red flags
- p95 > 3× p50 → long-tail outliers, likely external I/O
- Error rate spikes at specific concurrency level → connection pool exhaustion
- Memory grows linearly and never drops → memory leak
- Latency degrades over time (not just at peak) → resource leak / accumulation

## Common Root Causes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| High p99 only | Slow DB query path | Add index, cache result |
| All percentiles bad | Missing connection pool | Configure pool size |
| Degrades over 5 min | Memory leak | Profile with `--inspect` |
| Error spike at N users | Too few threads/workers | Increase worker count |
| p50 ok, p95 bad | Mutex contention | Identify hot lock |

## Load Test Stages

1. **Baseline** — 1 user, 60s → establish p50/p95/p99 at zero load
2. **Ramp** — 1→target users over 30s → find degradation point
3. **Sustained** — hold at target for 5 min → detect leaks
4. **Spike** — 0→2× target instantly → test recovery
5. **Soak** — target for 30 min (optional) → long-term drift

## Before Running — Checklist

```
[ ] Thresholds defined and documented?
[ ] Baseline measurement exists?
[ ] Test environment isolated (no shared prod DB)?
[ ] Warm-up run done (JIT/cache primed)?
[ ] Monitoring attached (CPU/mem/DB connections)?
[ ] Test data seeded (not empty DB)?
[ ] Know how to kill test if something breaks?
```
