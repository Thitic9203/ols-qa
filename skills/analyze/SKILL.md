---
name: analyze
description: Requirements analysis and risk assessment for a software feature or system. Use when you need to deeply understand requirements, identify risks, find vulnerabilities, and assess costs before writing any code.
---

# Dev Orchestrator — Analyze Phase

วิเคราะห์ requirement และ risk อย่างละเอียดก่อนเริ่มพัฒนา

## Input ที่ต้องการ

ถามผู้ใช้ก่อน:
```
1. ทำที่ repo ใด? (ลิงก์ GitHub หรือ local path)
2. ต้องการพัฒนาอะไร? (บอกพอสังเขป)
```

## Requirement Breakdown

วิเคราะห์ใน 5 มิติ:

**Functional Requirements**
- Feature หลักที่ต้องทำ / User stories / Input-Output / Business rules

**Non-Functional Requirements**
- Performance targets / Scalability / Availability / Security

**Technical Requirements**
- Integration กับระบบเดิม / API contracts / Schema changes / Infra changes

**Constraints**
- Timeline / Budget (ฟรีหรือมีงบ?) / Team / Compliance

**Out of Scope**
- ระบุชัดเจนเพื่อป้องกัน scope creep

## Risk & Vulnerability Analysis

ตรวจสอบทุก dimension นี้เสมอ:

| Risk Area | สิ่งที่ตรวจ |
|-----------|------------|
| Security | Auth/Authz gaps, injection, data exposure, insecure defaults |
| Performance | N+1 queries, missing indexes, unbounded loops, memory leaks |
| Data integrity | Race conditions, missing transactions, cascade issues |
| Breaking changes | API contracts, DB migrations, shared state, exports |
| Cost impact | Cloud spend, API rate limits, storage growth, free-tier limits |

สรุปผลในตาราง:
```
| Risk | Severity (H/M/L) | Probability | Impact | Mitigation | Cost |
|------|-----------------|-------------|--------|------------|------|
```

## Output

นำเสนอผลวิเคราะห์ครบ 5 มิติ + risk table พร้อมแจ้ง:
- ข้อกังวลหลักที่ต้องระวัง
- แนวทาง mitigation ที่แนะนำ (เน้น free/low-cost)
- สิ่งที่ต้องถาม stakeholder เพิ่มเติมก่อนดำเนินการ

ถามผู้ใช้ว่าต้องการต่อไป `/helix:plan` เพื่อสร้าง development plan ไหม
