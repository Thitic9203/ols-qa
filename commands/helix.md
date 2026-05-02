---
description: Full-cycle project orchestrator — choose a phase or run the complete workflow
argument-hint: "phase (optional): full | analyze | plan | execute | test | deploy | review"
---

# Helix

สวัสดีคับ! Helix พร้อมช่วยจัดการงานครบวงจรแล้ว

ถ้ามี argument (`$ARGUMENTS`) → ข้ามเมนูและ invoke skill นั้นทันที
ถ้าไม่มี → แสดงเมนูด้านล่าง

---

## เลือก Phase ที่ต้องการ

```
┌─────────────────────────────────────────────────────────────────┐
│  ◈  Helix — เลือก phase ที่ต้องการ                           │
├────┬───────────────────┬───────────────────────────────────────┤
│ #  │ Command           │ ทำอะไร                               │
├────┼───────────────────┼───────────────────────────────────────┤
│ 1  │ /helix:full       │ ครบทุก phase ตั้งแต่ต้นจนจบ         │
├────┼───────────────────┼───────────────────────────────────────┤
│ 2  │ /helix:analyze    │ วิเคราะห์ requirement + risk         │
├────┼───────────────────┼───────────────────────────────────────┤
│ 3  │ /helix:plan       │ สร้าง development plan               │
├────┼───────────────────┼───────────────────────────────────────┤
│ 4  │ /helix:execute    │ execute plan ที่มีอยู่แล้ว          │
├────┼───────────────────┼───────────────────────────────────────┤
│ 5  │ /helix:test       │ เขียน + รัน tests                   │
├────┼───────────────────┼───────────────────────────────────────┤
│ 6  │ /helix:deploy     │ staging → verify → production        │
├────┼───────────────────┼───────────────────────────────────────┤
│ 7  │ /helix:review     │ code review + security audit         │
└────┴───────────────────┴───────────────────────────────────────┘
```

พิมพ์ตัวเลข (1-7) หรือชื่อ command ได้เลยคับ

---

Argument mapping:
- `full` → `helix:full`
- `analyze` → `helix:analyze`
- `plan` → `helix:plan`
- `execute` → `helix:execute`
- `test` → `helix:test`
- `deploy` → `helix:deploy`
- `review` → `helix:review`
