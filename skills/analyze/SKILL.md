---
name: analyze
description: Requirements analysis and risk assessment for a software feature or system. Use when you need to deeply understand requirements, identify risks, find vulnerabilities, and assess costs before writing any code.
---

# Dev Orchestrator — Analyze Phase

> 📚 **Knowledge References** (loaded automatically):  
> `requirement-patterns.md` — underspecification patterns, clarification questions  
> `risk-patterns.md` — risk severity matrix, cost trap patterns

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

สกิลนี้สามารถดึงข้อมูล requirement จากระบบที่เชื่อมต่อผ่าน MCP ได้

> **ก่อนเชื่อมต่อ**: MCP tools จะเข้าถึงข้อมูลจาก external services ในนามของคุณ

**อนุญาตให้เชื่อมต่อ MCP tools ต่อไปนี้ไหมคับ?**

| Tool | ประโยชน์ | อนุญาต? |
|------|---------|--------|
| Jira/Linear | ดึง requirements จาก tickets | `[ ] ใช่ / [ ] ไม่` |
| GitHub | อ่าน issues, PR descriptions, README | `[ ] ใช่ / [ ] ไม่` |
| Confluence/Notion | ดึง spec/design docs | `[ ] ใช่ / [ ] ไม่` |

ไม่อนุญาต → วิเคราะห์จากข้อมูลที่ user ระบุใน chat แทน
