---
name: test-perf-profile
description: "[Tier 3 — Non-Functional: Performance Efficiency · ISO 25010] CPU and memory profiling workflow — flamegraphs and heap snapshots to pinpoint hot paths and memory leaks. Use after load/soak tests confirm a performance problem exists."
---

# Helix — CPU & Memory Profiling

> 📚 **Knowledge References** (loaded automatically):  
> `profile-patterns.md` — flamegraph reading guide, heap snapshot analysis, clinic.js patterns

หาต้นเหตุที่แท้จริงของ perf ปัญหาด้วย flamegraph + heap snapshot — ใช้หลังจาก load/soak test confirm ว่ามีปัญหาแล้ว

## Step 1: Confirm Problem Before Profiling

ตรวจก่อนว่า:
```
[ ] Load test หรือ soak test ยืนยันว่ามีปัญหาแล้ว (ไม่ profile แบบ speculative)
[ ] ระบุว่าเป็น CPU spike หรือ memory leak (จะเลือก profiling method ต่างกัน)
[ ] App สามารถรันได้ในสภาพแวดล้อมที่ reproduce ปัญหาได้
```

**ถาม user:**
```
1. ปัญหาที่พบคืออะไร? (CPU spike / memory leak / ทั้งคู่)
2. Runtime คืออะไร? (Node.js / Python / Go / JVM)
3. สามารถ reproduce ปัญหาใน local/staging ได้ไหม?
```

## Step 2: Node.js Profiling

### CPU Flamegraph (clinic.js — free, ดีที่สุดสำหรับ Node)

```bash
npm i -g clinic

# Doctor: overview ครอบคลุม
clinic doctor -- node app.js

# Flame: CPU flamegraph
clinic flame -- node app.js

# Bubbleprof: async bottlenecks
clinic bubbleprof -- node app.js
```

เปิด browser ดู interactive flamegraph ที่ generate ออกมา

### Built-in V8 CPU Profile

```bash
# รัน app พร้อม profiling
node --prof app.js

# ทำ load test ขณะรัน (สั้นๆ 30s พอ)
k6 run --duration 30s tests/performance/load.js

# แปลง profile เป็น text
node --prof-process isolate-*.log > profile.txt
cat profile.txt | head -100
```

### Heap Snapshot (memory leak)

```bash
# ใช้ clinic heapdump
clinic heapdump -- node app.js

# หรือ manual ผ่าน Chrome DevTools
node --inspect app.js
# เปิด chrome://inspect → Memory → Take Heap Snapshot
# ถ่าย snapshot ตอน start + หลัง load 10 min
# เปรียบเทียบ retained objects
```

## Step 3: Python Profiling

```bash
# py-spy: sampling profiler (ไม่ต้อง modify code)
pip install py-spy

# CPU flamegraph (attach to running process)
py-spy record -o flamegraph.svg --pid $(pgrep -f "python app.py")

# หรือ run จาก start
py-spy record -o flamegraph.svg -- python app.py

# Top-like view
py-spy top --pid $(pgrep -f "python app.py")
```

Memory:
```bash
pip install memray
memray run app.py
memray flamegraph memray-*.bin
```

## Step 4: Go Profiling

```go
// เพิ่ม pprof endpoint ใน Go app
import _ "net/http/pprof"
go http.ListenAndServe(":6060", nil)
```

```bash
# CPU profile 30s
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Heap
go tool pprof http://localhost:6060/debug/pprof/heap

# Flamegraph
go tool pprof -http=:8080 profile.pb.gz
```

## Step 5: Read Flamegraph

**วิธีอ่าน flamegraph:**
```
- แกน X = เวลา CPU (กว้าง = ใช้ CPU นาน)
- แกน Y = call stack (ล่าง = caller, บน = callee)
- สีแดง/ส้ม = hot path ที่ต้องสนใจ
- หาแท่งที่กว้างที่สุดใน upper half → นั่นคือ bottleneck
```

**Red flags:**
- Function เดิมปรากฏในหลาย call paths → shared bottleneck
- JSON.parse/stringify กินพื้นที่มาก → ลด serialization
- DB driver callbacks กว้างมาก → ไปดู `test-perf-db`
- GC pause ใหญ่ → memory pressure → ดู heap

## Step 6: Heap Snapshot Analysis

เปรียบเทียบ 2 snapshots (ก่อน/หลัง load):

```
Objects ที่ retain มากขึ้น = candidates สำหรับ leak
Focus ที่:
- Closures ที่ hold reference ไว้
- EventEmitter listeners ที่ไม่ถูก remove
- Caches ที่ไม่มี eviction policy
- Global state ที่เติบโตไม่หยุด
```

## Step 7: Report

```
🔥 Profile Report — [timestamp]

CPU Flamegraph:
Top hot paths:
1. processPayment() — 34% CPU — ลด JSON serialization 3× ได้
2. validateSchema() — 22% CPU — cache compiled schema

Memory:
Heap at start: 120MB
Heap after 30m load: 280MB (+133%)
Leak source: RequestContext objects not released in error handler
Fix: เพิ่ม finally block ให้ cleanup context เสมอ

Estimated improvement after fixes:
- p95 latency: 890ms → ~300ms (−66%)
- Memory growth: eliminated
```

## Done

สรุป bottlenecks ที่พบ + specific code locations + recommended fixes แล้วระบุ:
- แก้แล้ว → re-run `test-perf-load` เพื่อ verify
- ถ้า fix ต้องการ infra changes → แจ้ง cost estimate ก่อน

## HTML Report

```bash
# clinic.js / py-spy output HTML โดยตรง
clinic flame -- node app.js   # เปิด HTML อัตโนมัติ

# หรือ generate helix report จาก profiling summary:
node scripts/helix-report.mjs --input=test-results/results.json --title="CPU & Memory Profile"
open playwright-report/index.html
```

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
