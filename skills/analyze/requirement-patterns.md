# Requirement Analysis Patterns

## 5 วิธีที่ Requirement มักไม่ครบและวิธีค้นหา

| Symptom | วิธีค้นหา | คำถามที่ใช้ |
|---------|----------|-----------|
| Assumption-laden | ขอ example จริง | "ช่วยยก use case จริงให้ดู 1 ตัวอย่างได้ไหม?" |
| Missing actor | ถามว่าใครทำ | "ใครเป็นคนเรียก action นี้ — user, admin, หรือ system?" |
| Undefined success | ขอ acceptance criteria | "งานนี้จะถือว่า done เมื่อไหร่?" |
| Scope ambiguity | ถาม boundary | "X รวมถึง Y ด้วยไหม หรือแยกทีหลัง?" |
| Conflicting rules | ถาม priority | "ถ้า rule A และ B ขัดกัน ให้ยึดอะไร?" |

## คำถามต้องถามตาม Requirement Type

**Functional**
- Input validation: "ค่าไหนที่ไม่ valid? ระบบทำอะไรเมื่อได้ค่านั้น?"
- State transitions: "object นี้เปลี่ยน state ได้กี่แบบ? reverse ได้ไหม?"
- Concurrency: "ถ้า 2 user ทำสิ่งเดียวกันพร้อมกัน ผลลัพธ์ควรเป็นอะไร?"
- Data ownership: "ข้อมูลนี้ใครเป็น owner? ใครแก้ได้บ้าง?"

**Non-Functional**
- Performance: "response time ที่ยอมรับได้คือกี่ ms? ที่ load เท่าไหร่?"
- Volume: "ข้อมูลจะมีกี่ records ใน 1 ปี? peak concurrent users คือเท่าไหร่?"
- Availability: "ถ้า system down 5 นาที impact คืออะไร? มี SLA ไหม?"
- Consistency: "ยอมรับ eventual consistency ได้ไหม หรือต้องการ strong?"

**Technical**
- Integration: "ระบบ X ส่ง/รับ format อะไร? มี rate limit ไหม?"
- Auth: "ใช้ auth ระบบเดิมหรือสร้างใหม่? token lifetime เท่าไหร่?"
- Migration: "ข้อมูลเดิมต้อง migrate ไหม? ทำ zero-downtime ได้ไหม?"

## Red Flags ที่บ่งบอก Scope Creep Risk

```
🚩 "ระหว่างทำก็เพิ่ม X ไปด้วยเลยนะ" → ต้องเป็น separate ticket
🚩 "ทำให้ generic ไว้เผื่อใช้ในอนาคต" → YAGNI — ทำแค่ที่ต้องใช้ตอนนี้
🚩 "เดี๋ยวค่อยมาคุย spec ทีหลัง" → ต้อง spec ก่อน code ทุกครั้ง
🚩 requirement เปลี่ยนหลัง plan approve → ต้อง re-plan + re-estimate
🚩 "น่าจะไม่นาน" จาก non-technical stakeholder → ขอ estimate จาก dev เสมอ
```

## Must Have vs Nice to Have vs Out of Scope

**Must Have**: ถ้าไม่มีสิ่งนี้ feature ใช้งานไม่ได้เลย
**Nice to Have**: เพิ่ม value แต่ทำทีหลังได้ → ย้ายออกจาก current scope
**Out of Scope**: ระบุชัดเจนป้องกันความเข้าใจผิด

ตัวอย่าง acceptance criteria ที่ดี:
```
GIVEN user กรอก email ที่มีอยู่แล้วในระบบ
WHEN กด submit
THEN แสดง error "Email นี้ถูกใช้แล้ว" และ field ยัง focus อยู่
AND ไม่มีการส่ง email ใดๆ
AND ข้อมูลอื่นที่กรอกไว้ยังคงอยู่ใน form
```
