---
name: plan
description: "Create a detailed development plan for a feature or system. Use when requirements are clear and you need a structured, reviewable plan before coding — covering setup, development, testing, and deployment phases."
---

# Dev Orchestrator — Plan Phase

> 📚 **Knowledge References** (loaded automatically):  
> `planning-patterns.md` — task sizing, dependency ordering, estimation  
> `review-checklist.md` — 45 review questions across 3 rounds

สร้าง development plan ที่ละเอียด ครบถ้วน พร้อม review 3 รอบก่อนนำเสนอ

## Input ที่ต้องการ

ถามผู้ใช้:
```
1. ทำที่ repo ใด? (ลิงก์ GitHub หรือ local path)
2. requirement / feature ที่ต้องการพัฒนาคืออะไร?
3. มีผลวิเคราะห์จาก /helix:analyze แล้วหรือยัง? (ถ้ามีให้แชร์มาด้วย)
```

## ดึง Template

ดึง md_template.md จาก:
```
https://<ORG_REPO_URL>/blob/main/docs/md_template.md
```
ใช้ template นี้เป็นโครงสร้างหลัก

## โครงสร้าง Plan

```markdown
# [Feature Name] — Development Plan
**Date**: YYYY-MM-DD | **Status**: Draft | **Author**: [name]

## Overview
- Objective, Scope (in/out), Timeline estimate, Key stakeholders

## Phase 1: Setup & Foundation
- [ ] Pull main ล่าสุด + create branch
- [ ] DB migrations (staging first)
- [ ] Config / secrets setup
- [ ] Environment variables ที่ต้องการ

## Phase 2: Core Development
- [ ] [Component A] — est. Xh
- [ ] [Component B] — est. Xh
- [ ] API endpoints
- [ ] Business logic
- [ ] Data layer

## Phase 3: Testing
- [ ] Unit tests (target: X% coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] Security tests

## Phase 4: Review & Bug Fix
- [ ] Code review (peer + automated)
- [ ] Bug fixes
- [ ] Security audit
- [ ] Performance tuning

## Phase 5: Deployment
- [ ] Deploy to staging → smoke test
- [ ] Deploy to production → verify
- [ ] Post-deploy monitoring (24h)

## Risk Register
| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|

## Cost Analysis
| Item | Free Tier | Paid Option | Recommendation |
|------|-----------|-------------|----------------|

## Dependencies
- External services / Other PRs / Secrets needed
```

## Three-Round Review Loop

**Round 1 — Completeness**: ครบทุก requirement? edge cases? test coverage?
**Round 2 — Technical Soundness**: สอดคล้อง tech stack? breaking changes ถูก flag? staging-first ถูกต้อง?
**Round 3 — Risk & Cost**: ทุก risk มี mitigation? ค่าใช้จ่ายซ่อนอยู่ไหม? free alternative ดีกว่าไหม?

ปรับ plan ให้สมบูรณ์หลังครบ 3 รอบ

## Plan Confirmation

ถามผู้ใช้ก่อนดำเนินการต่อ:
```
1. รายละเอียด plan โอเคไหม? มีอะไรต้องปรับแก้ไหม?
2. ต้องการให้ upload MD plan ไว้ที่ path ใดใน repo?
   (เช่น docs/plans/, .helix/plans/)
```

เมื่อ approve → commit MD plan ไปที่ path ที่ระบุ แล้วถามว่าต้องการต่อไป `/helix:execute` ไหม

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

---

## Parallel Agent Option ⚠️ ใช้ token มากขึ้น

สกิลนี้รองรับ parallel sub-agents — แยก agents ทำงานพร้อมกันเพื่อความเร็ว

> **ค่าใช้จ่าย**: Parallel mode = หลาย API calls พร้อมกัน → token เพิ่มขึ้น 2-4×  
> แบบปกติ (sequential): ทีละขั้น ใช้ token น้อยกว่า  
> แบบ parallel: เร็วขึ้น ~50% แต่ต้นทุน token สูงกว่า

**ต้องการเปิด parallel mode ไหมคับ?**  
`[ ] ใช่` → เปิด (แจ้งเมื่อใช้ token สูงกว่าปกติ)  
`[x] ไม่` → รันแบบปกติ (default)

---

## MCP Tool Integration ⚠️ เชื่อมต่อระบบภายนอก

สกิลนี้สามารถดึง template และ context จาก MCP tools ได้

> **ก่อนเชื่อมต่อ**: MCP tools จะเข้าถึงข้อมูลจาก external services ในนามของคุณ

**อนุญาตให้เชื่อมต่อ MCP tools ต่อไปนี้ไหมคับ?**

| Tool | ประโยชน์ | อนุญาต? |
|------|---------|--------|
| GitHub | อ่าน repo structure + existing plans | `[ ] ใช่ / [ ] ไม่` |
| Jira/Linear | ดึง requirements จาก tickets ไว้ใส่ plan | `[ ] ใช่ / [ ] ไม่` |
| Confluence/Notion | ดึง template + existing docs | `[ ] ใช่ / [ ] ไม่` |

ไม่อนุญาต → สร้าง plan จากข้อมูล + template ที่มีใน repo แทน
