# OLS QA Workspace — runtime context

## Auto-loaded docs

@CONTEXT.md
@references/ols-project-guide.md

## Layout

| Skill | Path |
|-------|------|
| Helix (unified router) | `skills/helix/` |
| Workflow skills | `skills/deprecated/` |

Commands: `commands/helix.md` (canonical menu), plus one file per workflow.

## OLS QA workspace rules (ทำได้เลยไม่ต้องถาม)

- แก้ไข .md ไฟล์ใน `skills/`, `references/`, `commands/`
- แก้ SKILL.md / WORKFLOW.md content (ไม่ใช่ rename/delete ไฟล์)
- อัปเดต `references/ols-project-guide.md` เมื่อได้ข้อมูลใหม่จาก user
- เพิ่ม reference ใหม่ใน `references/`

ต้องถามก่อน:
- ลบ/rename skill directory ทั้ง folder
- แก้ hooks/ config

## Default decisions (ไม่ต้องถาม)

- Language ใน skill/command files: English only
- Language ใน chat กับ user: Thai ได้
- Commit style: conventional commits (feat:, fix:, docs:)

## Workspace Guide Pattern

เมื่อ AI ต้องถามคำถามเกี่ยวกับ project-specific config:
1. ตรวจก่อนว่ามี guide ใน `references/ols-project-guide.md` ที่ตอบได้แล้วหรือยัง
2. ถ้ามี → ใช้คำตอบจาก guide ไม่ต้องถาม
3. ถ้ายังไม่มี → ถาม user แล้วเพิ่มลง guide ทันที
