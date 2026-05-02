---
name: test-perf-load
description: "Load test workflow — measures response time and throughput at expected concurrent users. Use to validate p95/p99 SLOs before release."
---

# Helix — Load Test

> 📚 **Knowledge References** (loaded automatically):  
> `load-patterns.md` — threshold guidelines, k6/locust templates, bottleneck patterns

วัด response time + throughput ที่ load ปกติ (expected concurrent users) เป้าหมาย: ตรวจสอบว่าระบบผ่าน SLO จริงก่อน release

## Step 1: Clarify Targets

ถาม user ก่อน:
```
1. Endpoint / flow ที่ต้องการทดสอบคืออะไร?
2. Expected concurrent users คือเท่าไร? (ถ้าไม่รู้ → ใช้ 50 VUs เป็น default)
3. SLO targets มีไหม? (เช่น p95 < 500ms, error rate < 1%)
4. App รันอยู่ที่ไหน? (local / staging)
```

## Step 2: Tool Selection

ตรวจก่อนว่ามี tool ใดติดตั้งอยู่แล้ว:

```bash
which k6 locust artillery autocannon ab 2>/dev/null
cat package.json 2>/dev/null | grep -E "k6|autocannon|artillery"
```

**Tool แนะนำ (free เท่านั้น):**

| Tool | เหมาะกับ | ติดตั้ง |
|------|---------|--------|
| `k6` | HTTP API, scripted scenarios | `brew install k6` |
| `autocannon` | Node.js HTTP | `npm i -D autocannon` |
| `locust` | Python app, UI dashboard | `pip install locust` |
| `ab` | quick spot-check | built-in macOS/Linux |

ห้ามแนะนำ k6 Cloud, BlazeMeter, LoadNinja โดยไม่แจ้ง cost ก่อน

## Step 3: Define Thresholds

กำหนด pass/fail criteria ก่อน run เสมอ:

```js
// k6 thresholds
export const options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed:   ['rate<0.01'],
    http_reqs:         ['rate>100'],   // min throughput req/s
  },
};
```

## Step 4: Write Scenarios

**Load profile:**
```
Ramp-up (1 min) → Steady state (3 min) → Ramp-down (1 min)
```

ครอบคลุม flows หลัก:
- Happy path (auth → main action → assert)
- Read-heavy endpoints ที่ใช้บ่อยที่สุด
- Write endpoints ที่ business-critical

## Step 5: Run & Report

```bash
# k6
k6 run --out json=reports/load-result.json tests/performance/load.js

# autocannon
npx autocannon -c 50 -d 300 http://localhost:3000/api/target

# locust (headless)
locust -f tests/performance/locustfile.py --headless -u 50 -r 5 -t 5m \
  --csv=reports/load
```

รายงาน metrics หลังรัน:

```
📊 Load Test Results — [timestamp]

| Metric       | Target    | Actual   | Status |
|--------------|-----------|----------|--------|
| p95 latency  | < 500ms   | ???ms    | ✅/❌  |
| p99 latency  | < 1000ms  | ???ms    | ✅/❌  |
| Error rate   | < 1%      | ???%     | ✅/❌  |
| Throughput   | > 100 r/s | ??? r/s  | ✅/❌  |
```

## Step 6: Bottleneck Analysis (ถ้า fail)

1. ดู response time distribution — spike ที่ percentile ไหน?
2. ตรวจ server logs ระหว่าง test
3. ดู CPU / memory usage ขณะรัน (ดู `test-perf-profile` ถ้า CPU spike)
4. ดู slow queries (ดู `test-perf-db` ถ้า DB เป็นตัวปัญหา)
5. แก้ไข → re-run จน pass threshold ทั้งหมด

ถ้าแก้แล้วต้องการ infra เพิ่ม → แจ้ง cost estimate ก่อน ห้ามดำเนินการเอง

## Done

สรุปผล + แนะนำ next step ต่อไปใน perf pipeline:
- ผ่านทุก threshold → แนะนำ `test-perf-stress` เพื่อหา breaking point
- มี leak สงสัย → แนะนำ `test-perf-soak`
- DB ช้า → แนะนำ `test-perf-db`

---

## Self-Evaluation Loop

ก่อนส่ง output ให้ user ทำ self-check ทุกครั้ง:

```
1. Output ครบถ้วนตาม scope ที่รับมาไหม?
2. มีจุดไหนที่ยังไม่แน่ใจ ควรถามก่อนไหม?
3. Format ถูกต้องตามที่กำหนดในสกิลไหม?
4. มีอะไรที่อาจทำให้งานพัง / เกิด side effect ที่ไม่ตั้งใจไหม?
```

ตอบ "ไม่ใช่" ข้อไหน → **แก้ก่อนส่ง** เสมอ
