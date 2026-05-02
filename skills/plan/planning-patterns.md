# Development Planning Patterns

## Task Sizing — Right Size คือเท่าไหร่

**Too Big (ต้องแตกเพิ่ม)**
- ประมาณเวลาได้ > 1 วัน
- ทำเสร็จแล้วไม่รู้ว่า done หรือยัง
- ต้องแตะ > 5 files พร้อมกัน

**Just Right**
- 2-8 ชั่วโมง
- มี acceptance criteria ชัดเจน
- test ได้แยกต่างหากจาก task อื่น

**Too Small (รวมกัน)**
- < 30 นาที และ depend กันอยู่แล้ว
- เป็นแค่ sub-step ของ task อื่น

## Dependency Ordering

เรียง tasks ตาม dependency graph เสมอ:

```
Foundation first:
DB schema → Models → Services → API handlers → Frontend → Tests

ห้ามเริ่ม:
- Frontend ก่อน API พร้อม
- Service ก่อน model พร้อม
- Integration test ก่อน unit test ผ่าน
```

**วิธี detect circular dependency**: ถ้า task A รอ B และ B รอ A → แตก interface ออกมาก่อน

## Estimation Heuristics

| สถานการณ์ | คูณ estimate ด้วย |
|----------|----------------|
| ทำครั้งแรกกับ tech นี้ | 2x |
| ต้องแตะ legacy code | 1.5x |
| ต้องเขียน migration | 1.5x |
| มี external dependency | 1.5x |
| ทุกอย่างข้างต้นรวมกัน | 3x |
| estimate จาก non-dev | 2x เสมอ |

## Tasks ที่ดูง่ายแต่ไม่ง่าย

```
🕐 "แค่เปลี่ยน column name" → ต้อง migrate + update ทุก query + update tests
🕐 "แค่เพิ่ม field" → ต้อง validate + serialize + test + update API docs
🕐 "แค่เพิ่ม auth" → ต้อง middleware + token + refresh + logout + test ทุก route
🕐 "แค่ optimize query" → ต้อง profile + index + test + benchmark before/after
🕐 "แค่ update dependency" → ต้อง read changelog + test regression ทั้งหมด
```

## Task Description Template

```markdown
### [Task Name]

**What**: [อธิบายสิ่งที่ต้องทำ 1-2 ประโยค]
**Why**: [เหตุผลว่าทำไมต้องทำ]
**Acceptance**: [เงื่อนไขที่ถือว่า done — testable]
**Files**: [ไฟล์หลักที่ต้องแตะ]
**Estimate**: [Xh]
**Depends on**: [task ที่ต้องเสร็จก่อน]
```
