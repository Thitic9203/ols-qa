# Load Test Patterns

## Default Thresholds by App Type

| App Type | p95 target | p99 target | Error rate | Min throughput |
|----------|-----------|-----------|------------|----------------|
| Public web (consumer) | < 300ms | < 600ms | < 0.5% | — |
| Internal API | < 500ms | < 1000ms | < 1% | — |
| Payment / checkout | < 1000ms | < 2000ms | < 0.1% | — |
| Search / autocomplete | < 150ms | < 300ms | < 0.1% | — |
| File upload | < 5000ms | < 10000ms | < 1% | — |

## k6 Load Profile Templates

### Standard 5-min load test
```js
export const options = {
  stages: [
    { duration: '1m', target: VUS },   // ramp-up
    { duration: '3m', target: VUS },   // steady
    { duration: '1m', target: 0 },     // ramp-down
  ],
};
```

### Smoke test (quick sanity check, 1-2 VUs)
```js
export const options = {
  vus: 2,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};
```

## Bottleneck Signals

| Symptom | Likely cause | Investigation |
|---------|-------------|---------------|
| p99 >> p95 (large gap) | Occasional slow outliers | Check for GC pauses, DB lock waits |
| Error rate climbs with load | Threadpool/connection pool saturation | Check pool settings |
| Latency climbs linearly with VUs | Single-threaded bottleneck | CPU profiling |
| Latency stable then sudden spike | Cache miss at scale | Check cache hit rate |
| Errors start at exact VU count | Connection pool size limit | Raise pool max |

## Locust Template

```python
from locust import HttpUser, task, between

class ApiUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })

    @task(3)
    def get_list(self):
        self.client.get("/api/items")

    @task(1)
    def create_item(self):
        self.client.post("/api/items", json={"name": "test"})
```

## autocannon Template (Node.js)

```js
const autocannon = require('autocannon');

autocannon({
  url: 'http://localhost:3000/api/target',
  connections: 50,
  duration: 300,   // 5 min
  headers: { Authorization: 'Bearer <token>' },
  requests: [{ method: 'GET', path: '/api/items' }],
}, console.log);
```
