---
name: plan
description: "Create a detailed development plan for a feature or system. Use when requirements are clear and you need a structured, reviewable plan before coding — covering setup, development, testing, and deployment phases."
---

# Dev Orchestrator — Plan Phase

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
   (เช่น docs/plans/, .claude/plans/)
```

เมื่อ approve → commit MD plan ไปที่ path ที่ระบุ แล้วถามว่าต้องการต่อไป `/helix:execute` ไหม
