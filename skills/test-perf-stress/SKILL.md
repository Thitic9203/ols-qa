---
name: test-perf-stress
description: "Stress test workflow — ramps load beyond capacity to find breaking point and verify recovery. Use to discover system limits before they hit production."
---

# Helix — Stress Test

> 📚 **Knowledge References** (loaded automatically):  
> `stress-patterns.md` — ramp strategies, breaking point detection, recovery verification

หา breaking point ของระบบ + ตรวจสอบว่า recover ได้หลังจาก overload

## Step 1: Pre-Conditions

ต้องมีก่อน:
```
[ ] Load test ผ่านแล้ว (รู้ baseline p95/p99 แล้ว)
[ ] App รันบน staging (ห้าม stress test production โดยไม่แจ้ง user ก่อน)
[ ] Rollback plan พร้อม
```

ถาม user:
```
1. Baseline load คือเท่าไร? (จาก load test)
2. ต้องการ ramp ถึง VUs เท่าไรสูงสุด? (default: 10× baseline)
3. ตรวจ recovery หลัง overload ด้วยไหม? (แนะนำ: ✅)
```

## Step 2: Stress Profile Design

**Ramp strategy:**
```
Stage 1: baseline load (2 min)   — verify normal behavior
Stage 2: 2× baseline (2 min)     — warm up
Stage 3: 5× baseline (2 min)     — stress zone
Stage 4: 10× baseline (2 min)    — find break
Stage 5: 0 VUs (3 min)           — recovery window
Stage 6: baseline load (2 min)   — verify full recovery
```

**k6 template:**
```js
export const options = {
  stages: [
    { duration: '2m', target: BASELINE },
    { duration: '2m', target: BASELINE * 2 },
    { duration: '2m', target: BASELINE * 5 },
    { duration: '2m', target: BASELINE * 10 },
    { duration: '3m', target: 0 },        // recovery
    { duration: '2m', target: BASELINE }, // verify recovery
  ],
  thresholds: {
    // ผ่อนปรน threshold กว่า load test เพราะเราตั้งใจ stress
    http_req_failed: ['rate<0.10'],  // ยอม error ได้ 10% ใน peak
  },
};
```

## Step 3: Run

```bash
k6 run --out json=reports/stress-result.json tests/performance/stress.js
```

## Step 4: Analyze Results

สิ่งที่ต้องดู:

```
Breaking Point Analysis:
[ ] ที่ VUs เท่าไรที่ error rate เริ่มพุ่ง?
[ ] ที่ VUs เท่าไรที่ p99 latency > 5s?
[ ] มี OOM / crash / restart ไหม? (ดู server logs)
[ ] Recovery time หลัง overload หมดใช้นานเท่าไร?
[ ] หลัง recovery แล้ว latency กลับมา normal ไหม?
```

รายงาน:

```
🔥 Stress Test Results — [timestamp]

| Stage     | VUs  | p95     | Error Rate | Status    |
|-----------|------|---------|------------|-----------|
| Baseline  |  50  | 210ms   | 0.1%       | ✅ Normal |
| 2×        | 100  | 380ms   | 0.3%       | ✅ OK     |
| 5×        | 250  | 890ms   | 2.1%       | ⚠️ Stress |
| 10×       | 500  | 4200ms  | 15%        | ❌ Break  |
| Recovery  |   0  | —       | —          | ✅ 45s    |
| Post-rec  |  50  | 220ms   | 0.2%       | ✅ Normal |

Breaking point: ~300 VUs (6× baseline)
Recovery time: 45 seconds
```

## Step 5: Document Capacity Limits

บันทึกผลใน `RISK_REGISTER.md` หรือ perf doc:
- Max safe load: _VUs / _req/s ก่อนถึง breaking point
- Breaking point: _VUs
- Recovery time: _s
- ถ้าต้องการรองรับ load สูงกว่านี้ → list scaling options พร้อม cost estimate

## Done

สรุป breaking point + recovery status แล้วแนะนำ next step:
- ต้องการทดสอบ leak ระยะยาว → `test-perf-soak`
- มี DB timeout ใน stress → `test-perf-db`
- CPU spike ชัดเจน → `test-perf-profile`

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
