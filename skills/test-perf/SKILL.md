---
name: test-perf
description: "Performance test workflow — checks existing perf test structure, creates if missing, augments if exists. Measures response time, throughput, and resource usage. Free tools only unless user approves paid."
---

# Helix — Performance Test

วัด response time, throughput, และ resource usage — เน้น free tools ก่อนเสมอ

## Step 1: Repo Structure Check

```bash
# หา performance test folder
find . -type d \( -name "perf" -o -name "performance" -o -name "load" -o -name "benchmark" \) \
  | grep -v node_modules | grep -v .git

# ตรวจ perf tool ที่มีอยู่
cat package.json 2>/dev/null | grep -E "k6|autocannon|artillery|locust|ab"
which k6 ab wrk locust artillery 2>/dev/null
```

### กรณี A: ยังไม่มี performance test

**Free tools แนะนำ (เรียงตามความเหมาะสม):**

| Tool | เหมาะกับ | ติดตั้ง | Cost |
|------|---------|--------|------|
| `k6` | HTTP APIs, scripted scenarios | `brew install k6` | Free (OSS) |
| `autocannon` | Node.js HTTP benchmarks | `npm i -D autocannon` | Free |
| `artillery` | HTTP + WebSocket + complex flows | `npm i -D artillery` | Free tier |
| `locust` | Python projects | `pip install locust` | Free |
| `ab` (Apache Bench) | quick spot-checks | built-in macOS/Linux | Free |

สร้าง structure:
```
tests/performance/
├── scenarios/       ← k6/artillery scripts
├── thresholds.js    ← pass/fail criteria
└── reports/         ← .gitignore'd output
```

**ห้ามแนะนำ k6 Cloud, BlazeMeter, LoadNinja** โดยไม่แจ้ง cost ก่อน

### กรณี B: มี perf test แล้ว

- อ่าน scenarios และ thresholds ที่มีอยู่
- ระบุ endpoints/flows ใหม่ที่ยังไม่มี test
- เพิ่ม scenarios ใหม่ + ตรวจว่า thresholds ยังเหมาะสมไหม

## Step 2: Test Case Planning

กำหนด thresholds ก่อน run:

```
| Metric | Target | Failing Threshold |
|--------|--------|-----------------|
| p95 response time | < 500ms | > 1000ms |
| p99 response time | < 1000ms | > 2000ms |
| Error rate | < 1% | > 5% |
| Throughput | > X req/s | < Y req/s |
| CPU usage | < 70% | > 90% |
```

ครอบคลุม scenarios:
| Scenario | Load | Duration |
|---------|------|---------|
| Smoke test | 1-5 VUs | 1 min |
| Average load | expected concurrent users | 5 min |
| Spike test | 10x normal | 2 min |
| Soak test | sustained load | 30 min (optional) |

## Step 3: Run & Fix

```bash
# k6
k6 run --out json=reports/result.json tests/performance/scenarios/main.js

# autocannon
npx autocannon -c 100 -d 30 http://localhost:3000/api/target

# locust
locust -f tests/performance/locustfile.py --headless -u 100 -r 10 -t 5m
```

รายงานทุก 10 นาที ถ้า threshold ไม่ผ่าน → วิเคราะห์ bottleneck → แก้ → re-run

**ถ้าแก้แล้วต้องการ infra เพิ่ม → แจ้ง cost estimate ก่อน ห้ามดำเนินการเองเด็ดขาด**

## Done

แจ้ง user ผลสรุป + metrics report แล้วถามว่าต้องการต่อ `/helix:test-security` ไหม
