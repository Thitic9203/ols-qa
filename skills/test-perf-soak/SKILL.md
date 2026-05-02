---
name: test-perf-soak
description: "Soak test workflow — runs sustained load for 30-60 min to detect memory leaks and connection pool exhaustion. Use when suspecting gradual degradation in long-running services."
---

# Helix — Soak Test

> 📚 **Knowledge References** (loaded automatically):  
> `soak-patterns.md` — leak detection patterns, connection pool signals, heap monitoring

ตรวจ memory leak, connection leak, และ gradual degradation ด้วย sustained load ระยะยาว

## Step 1: When to Run Soak

**Run เมื่อ:**
- Load + stress test ผ่านแล้ว แต่สงสัย memory/connection leak
- App รันนาน (> 30 min) แล้ว response time ค่อยๆ ช้าขึ้น
- มี OOM ใน production แต่ reproduce ใน short test ไม่ได้
- ใช้ connection pool (DB, Redis, external APIs)

**ถาม user:**
```
1. Soak duration: 30 min (default) หรือนานกว่า?
2. ต้องการ monitor metrics ใด? (memory / CPU / DB connections / all)
3. App รันอยู่ที่ staging ใช่ไหม? (ห้ามรันบน production)
```

## Step 2: Soak Profile

Load ต่ำ, รันนาน — เป้าหมายคือจับ gradual change ไม่ใช่ stress:

```js
export const options = {
  vus: BASELINE,          // ใช้ load ปกติ ไม่ต้อง spike
  duration: '30m',        // 30 min minimum, 60 min ideal
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
  },
};
```

## Step 3: Monitor While Running

รัน test + เปิด monitoring พร้อมกัน:

**Memory (Node.js):**
```bash
# ดู heap ทุก 30s ระหว่าง soak
watch -n 30 'node -e "
  const u = process.memoryUsage();
  console.log(new Date().toISOString(),
    \"heap:\", Math.round(u.heapUsed/1024/1024)+\"MB\",
    \"rss:\",  Math.round(u.rss/1024/1024)+\"MB\"
  )"'
```

**Database connections:**
```sql
-- PostgreSQL — รันทุก 5 min ระหว่าง test
SELECT count(*), state
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;
```

**Redis:**
```bash
redis-cli info clients | grep connected_clients
```

**System resources:**
```bash
# CPU + memory ทุก 10s
vmstat 10 | awk 'NR>2 {print strftime("%H:%M:%S"), $13"% cpu", $4"KB free"}'
```

## Step 4: Leak Detection Checklist

บันทึก metrics ทุก 5 นาที และดูว่า:

```
[ ] Heap memory: เพิ่มขึ้น monotonically ไหม? (leak signal)
[ ] DB connections: เพิ่มขึ้นไม่ลง ไหม? (pool leak)
[ ] p95 latency: drift ขึ้น 20%+ จากค่าเริ่มต้นไหม?
[ ] Error rate: เพิ่มขึ้นตามเวลาไหม?
[ ] File descriptors: เพิ่มขึ้นไหม? (fd leak)
```

สัญญาณ leak:
```
Healthy:   heap 120MB → 125MB → 121MB  (GC คืน)
Leak:      heap 120MB → 135MB → 148MB  (เพิ่มขึ้นทุก cycle)
```

## Step 5: Heap Snapshot (ถ้าสงสัย memory leak)

```bash
# Node.js — ดึง heap snapshot ต้นและปลาย soak
node --inspect app.js
# ใน Chrome DevTools → Memory → Take Heap Snapshot
# เปรียบเทียบ snapshot ก่อน/หลัง
```

หรือใช้ `clinic.js`:
```bash
npm i -g clinic
clinic heapdump -- node app.js
```

## Step 6: Report

```
🌊 Soak Test Results — [timestamp] (Duration: 30 min)

| Time    | Heap (MB) | DB Conns | p95 (ms) | Errors |
|---------|-----------|----------|----------|--------|
| 0:00    | 120       | 10       | 210      | 0.1%   |
| 10:00   | 128       | 10       | 215      | 0.1%   |
| 20:00   | 127       | 11       | 218      | 0.1%   |
| 30:00   | 129       | 10       | 222      | 0.1%   |

Verdict: ✅ No leak detected (heap stable ±10MB, latency drift <10%)
```

หรือถ้า leak:
```
⚠️ Memory leak detected: heap grew 120MB → 280MB (+133%) in 30 min
Root cause investigation needed before deploy
```

## Done

สรุปผล soak + ระบุ leaks ที่พบ (ถ้ามี) แล้วแนะนำ:
- มี heap leak → `test-perf-profile` สำหรับ flamegraph/heap analysis
- มี DB connection leak → `test-perf-db` ตรวจ query patterns

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
