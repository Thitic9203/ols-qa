---
name: test-perf
description: "[Tier 3 — Non-Functional: Performance Efficiency · ISO 25010] Performance test orchestrator — choose a sub-type or run the full pipeline. Requires a running environment. Delegates to: load, stress, soak, db, frontend, profile."
---

# Helix — Performance Test Orchestrator

> 📚 **Knowledge References** (loaded automatically):  
> `perf-thresholds.md` — threshold guidelines, tool matrix, bottleneck patterns

## Choose Your Performance Test

ถามถ้าไม่มี argument:

```
🚀 Performance Testing — เลือกประเภท:

[ ] test-perf-load      — p95/p99 ที่ load ปกติ (baseline validation)
[ ] test-perf-stress    — หา breaking point + ตรวจ recovery
[ ] test-perf-soak      — จับ memory/connection leak (30-60 min)
[ ] test-perf-frontend  — Core Web Vitals, bundle size, LCP/CLS/INP
[ ] test-perf-db        — slow queries, missing index, N+1 detection
[ ] test-perf-profile   — CPU flamegraph + heap snapshot

หรือพิมพ์ "all" เพื่อรัน pipeline ทั้งหมด
```

## Recommended Pipeline Order

```
load → stress → soak → db → frontend → profile
```

| Step | เมื่อไร | Skip เมื่อ |
|------|--------|-----------|
| `test-perf-load` | เสมอ | — |
| `test-perf-stress` | หลัง load pass | ไม่สนใจ capacity limit |
| `test-perf-soak` | สงสัย leak | service รัน < 5 min |
| `test-perf-db` | API latency สูง | app ไม่มี DB |
| `test-perf-frontend` | มี web UI | backend-only service |
| `test-perf-profile` | ยังหา root cause ไม่ได้ | ใช้เมื่อ confirm ปัญหาแล้ว |

## Quick Decision Guide

```
API ช้า แต่ไม่รู้สาเหตุ?     → load → db → profile
Memory ค่อยๆ เพิ่มใน prod?   → soak → profile
ต้องการรู้ capacity limit?   → load → stress
หน้าเว็บช้า / Google ranking? → frontend
เพิ่งแก้ query / เพิ่ม index? → db → load
```

## Invoke Sub-skill

เมื่อ user เลือกแล้ว → invoke skill ที่ตรงกัน:

| เลือก | Invoke |
|-------|--------|
| load | `helix:test-perf-load` |
| stress | `helix:test-perf-stress` |
| soak | `helix:test-perf-soak` |
| frontend | `helix:test-perf-frontend` |
| db | `helix:test-perf-db` |
| profile | `helix:test-perf-profile` |
| all | รันตามลำดับ load → stress → soak → db → frontend → profile |

## Core Rules

- ห้ามแนะนำ k6 Cloud, BlazeMeter, LoadNinja โดยไม่แจ้ง cost ก่อน
- ห้าม run load/stress test บน production โดยไม่ได้รับอนุญาต
- ถ้าแก้ perf แล้วต้องใช้ infra เพิ่ม → แจ้ง cost estimate ก่อนเสมอ

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
