---
name: execute
description: "Execute an existing development plan. Use when a plan is already approved and committed — this phase handles coding, implementation, 3-round bug-fix loop after dev, then hands off to testing."
---

# Helix — Execute Phase

> 📚 **Knowledge References** (loaded automatically):  
> `impact-analysis.md` — dependency tracing, change risk categories  
> `bug-fix-patterns.md` — 50-point bug-fix checklist, code vs test bug guide

ลงมือ implement ตาม plan ที่ approve แล้ว พร้อมอัปเดตทุก 10 นาที  
**หลัง dev เสร็จ → วนเช็คและแก้บัค 3 รอบก่อนส่งต่อไป test phase เสมอ**

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

---

## Post-Dev: Bug-Fix Loop (3 รอบ — บังคับ)

**ทำทันทีที่ implement ครบทุก task ใน plan ก่อนส่งต่อ test phase เสมอ**

### รอบที่ 1 — Logic & Correctness
ตรวจทีละ component/module ที่เพิ่งเขียน:
```
[ ] Logic ถูกต้องตาม requirement?
[ ] Edge cases ทั้งหมดที่รู้จักได้รับการ handle?
[ ] Return values / error responses ถูกต้อง?
[ ] ไม่มี off-by-one, null pointer, unhandled promise?
```
พบบัค → **แก้ทันที** แล้วเช็คต่อ ไม่ข้าม

### รอบที่ 2 — Integration & Side Effects
ตรวจการทำงานร่วมกันระหว่าง components:
```
[ ] Data flow ระหว่าง modules ถูกต้อง?
[ ] ไม่มี race condition / missing await?
[ ] DB transactions ครบถ้วน?
[ ] การเปลี่ยนแปลงนี้ไม่ทำให้ feature เดิมพัง?
[ ] API contracts ยังตรงกับ consumers?
```
พบบัค → **แก้ทันที** แล้วเช็คต่อ ไม่ข้าม

### รอบที่ 3 — Code Quality & Security
ตรวจ code ที่เขียนใหม่ทั้งหมด:
```
[ ] ไม่มี hardcoded secrets / credentials?
[ ] Input validation ครบในทุก entry point?
[ ] ไม่มี SQL injection / XSS surface ใหม่?
[ ] ไม่มี dead code / commented-out code?
[ ] Build / compile สะอาด ไม่มี warning?
```
พบบัค → **แก้ทันที** แล้วเช็คต่อ ไม่ข้าม

### สรุป Bug-Fix Loop

รายงานให้ user หลังครบ 3 รอบ:
```
🔍 Bug-Fix Loop เสร็จแล้วคับ (3/3 รอบ)

| รอบ | ตรวจ | บัคที่พบ | แก้แล้ว |
|-----|------|---------|--------|
| 1   | Logic & Correctness | X | X |
| 2   | Integration & Side Effects | X | X |
| 3   | Code Quality & Security | X | X |

พร้อมเข้า test phase แล้วคับ
```

**ห้ามข้ามไป `/helix:test` โดยไม่ผ่าน bug-fix loop ครบ 3 รอบ**

---

## Staging-First Deployment

ทุก deployment change ต้องผ่าน:
```
staging → verify → production
```
ห้าม deploy ตรงไป production

## เมื่อ Execute + Bug-Fix Loop เสร็จ

ถามผู้ใช้ว่าต้องการต่อไป `/helix:test` ไหม

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
