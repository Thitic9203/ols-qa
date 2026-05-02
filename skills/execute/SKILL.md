---
name: execute
description: "Execute an existing development plan. Use when a plan is already approved and committed — this phase handles coding, implementation, and progress reporting every 10 minutes until complete."
---

# Dev Orchestrator — Execute Phase

ลงมือ implement ตาม plan ที่ approve แล้ว พร้อมอัปเดตทุก 10 นาที

## Input ที่ต้องการ

ถามผู้ใช้:
```
1. ทำที่ repo ใด? (ลิงก์ GitHub หรือ local path)
2. plan file อยู่ที่ path ใดใน repo?
3. จะเริ่มจาก phase ไหน หรือเริ่มต้นจาก Phase 1?
```

## Branch Setup

```bash
git checkout main
git pull origin main
git checkout -b feat/[feature-name]
```

## Execution Protocol

**ก่อนแก้ไขไฟล์ใดๆ ต้องตอบให้ได้ก่อน:**
> "การแก้นี้กระทบ file/feature อะไรบ้าง?"

- กระทบของเดิม → list ผลกระทบ + **ถาม user ก่อน** ห้ามทำทันที
- ไม่กระทบ → ทำได้เลย

**ห้ามทำเกิน scope ที่ confirm กัน** — เสนอแนะได้แต่รอ user ตัดสินใจ

**เมื่อเจอปัญหานอก scope:**
```
⚠️ พบปัญหา: [อธิบาย]
ไม่เกี่ยวกับ scope โดยตรง
→ ต้องการให้แก้เลยไหม หรือเปิด issue ไว้ก่อน?
```

## Progress Update (ทุก 10 นาที)

```
📊 Progress Update — [HH:MM]

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| Phase 2 | Component A | ✅ Done | — |
| Phase 2 | Component B | 🔄 In Progress (~70%) | — |
| Phase 2 | API endpoints | ⏳ Pending | — |

ETA: ~Xh remaining
```

## External Skill Discovery

เมื่อต้องการ skill สำหรับงาน ให้ตรวจว่ามีติดตั้งแล้วไหม ถ้าไม่มี:

```
💡 แนะนำ External Skill

งาน: [ชื่องาน]
Skill: [ชื่อ] @ [marketplace]
Trust: ⭐⭐⭐ Official / ⭐⭐ Trusted / ⭐ Community
เหตุผล: [ทำไมถึงเหมาะ]

ต้องการติดตั้งไหมคับ?
[ ] ใช่ → claude plugins install <skill>@<marketplace>
[ ] ไม่ → ใช้ [fallback] แทน
```

## Staging-First Deployment

ทุก deployment change ต้องผ่าน:
```
staging → verify → production
```
ห้าม deploy ตรงไป production

## เมื่อ Execute เสร็จ

ถามผู้ใช้ว่าต้องการต่อไป `/helix:test` ไหม
