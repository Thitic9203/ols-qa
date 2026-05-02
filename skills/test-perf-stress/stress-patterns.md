# Stress Test Patterns

## Ramp Strategies

### Exponential ramp (find break fast)
```js
stages: [
  { duration: '1m', target: BASELINE },
  { duration: '2m', target: BASELINE * 2 },
  { duration: '2m', target: BASELINE * 5 },
  { duration: '2m', target: BASELINE * 10 },
  { duration: '3m', target: 0 },           // recovery
  { duration: '2m', target: BASELINE },    // verify recovery
]
```

### Linear ramp (precise breakpoint detection)
```js
stages: [
  { duration: '5m', target: BASELINE * 10 },  // slow ramp
  { duration: '3m', target: 0 },
  { duration: '2m', target: BASELINE },
]
```

## Breaking Point Signals

| Signal | Meaning |
|--------|---------|
| Error rate > 10% | System under stress — approaching break |
| p99 > 10× baseline | Severely degraded |
| OOM kill in logs | Memory limit hit |
| Connection refused | Port exhausted or app crashed |
| 503 / 502 responses | Load balancer dropping requests |
| p95 stops increasing (flat) | CPU/thread saturated — queuing |

## Recovery Verification Checklist

After load drops to 0:
```
[ ] Error rate returns to < 1% within 60s?
[ ] p95 returns within 10% of baseline?
[ ] No zombie processes (check ps aux)?
[ ] DB connection count back to normal?
[ ] Log shows no lingering errors after recovery?
[ ] Memory released (heap not still at peak)?
```

Fail any: system doesn't self-heal → needs fix before production

## Spike Test (subset of stress)

```js
// Sudden spike, not gradual ramp
stages: [
  { duration: '2m', target: BASELINE },     // normal
  { duration: '30s', target: BASELINE * 10 }, // spike
  { duration: '2m', target: BASELINE },     // back to normal
  { duration: '1m', target: 0 },
]
```

Use when: testing auto-scaling, caching behavior, or rate limiter effectiveness

## What to Document

After stress test, record in RISK_REGISTER.md:
- Max safe concurrent users: ___
- Breaking point: ___ VUs / ___ req/s
- Recovery time: ___s
- Failure mode: (crash / graceful degradation / timeout)
- Scaling path if needed: (horizontal / vertical / caching)
