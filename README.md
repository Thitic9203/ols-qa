# ◈ Helix

> Full-cycle project orchestrator for Claude Code  
> วิเคราะห์ → วางแผน → ลงมือทำ → ทดสอบ → deploy → review

---

## Install

```bash
claude plugins install helix@helix
```

หรือใช้ local directory:

```bash
claude --plugin-dir /path/to/helix <command>
```

---

## Commands

| Command | ทำอะไร |
|---------|--------|
| `/helix` | แสดงเมนูเลือก phase |
| `/helix:full` | ครบทุก phase ตั้งแต่ต้นจนจบ |
| `/helix:analyze` | วิเคราะห์ requirement + risk |
| `/helix:plan` | สร้าง development plan |
| `/helix:execute` | execute plan ที่มีอยู่ |
| `/helix:test` | เขียน + รัน tests |
| `/helix:deploy` | staging → verify → production |
| `/helix:review` | code review + security audit |

---

## Principles

ดู [PRINCIPLES.md](./PRINCIPLES.md) สำหรับ philosophy และ core rules ทั้งหมด — เหมาะสำหรับแชร์ทีม

---

*Built at <ORG>*
