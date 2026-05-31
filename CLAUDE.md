# Helix — runtime context

## Auto-loaded docs (ไม่ต้องอ่านเอง AI จะได้ context อัตโนมัติ)

@docs/CONTRIBUTING.md
@docs/DOC-MAP.md
@CONTEXT.md

## Layout

| Skill | Path |
|-------|------|
| Helix (unified router) | `skills/helix/` |

Deprecated workflow skills → `skills/deprecated/`.

Commands: `commands/helix.md` (canonical menu), plus one file per workflow.

## Contributor docs

Version, CI, ship checklist, quality bar, new skill template → [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Helix-specific overrides for Rule #5

ใน Helix project — ทำได้เลยไม่ต้องถาม:
- แก้ไข .md ไฟล์ใน skills/, references/, commands/, docs/
- เพิ่ม/ลบ menu item ใน commands/helix.md
- แก้ SKILL.md / WORKFLOW.md content (ไม่ใช่ rename/delete ไฟล์)
- แก้ scripts/ ที่ไม่ใช่ install.sh (install กระทบ user ทุกคน)
- อัปเดต VERSION, README.md, CONTEXT.md
- เพิ่ม reference ใหม่ใน references/

ต้องถามก่อน (ยังคง Rule #5):
- ลบ/rename skill directory ทั้ง folder
- แก้ install.sh, helix-auto-update.sh (กระทบ user ทุกคน)
- แก้ CI workflow (.github/workflows/)
- แก้ hooks/ config (กระทบ SessionStart)
- แก้ .claude-plugin/ (กระทบ marketplace)

## Default decisions (ไม่ต้องถาม ทำเลย)

### Naming & Structure
- Skill directory: skills/{name}/ + SKILL.md
- Workflow directory: skills/deprecated/{name}-workflow/ + WORKFLOW.md
- Command file: commands/{name}.md (thin entry, frontmatter + read SKILL.md)
- Reference file: references/{descriptive-name}.md (kebab-case)
- Branch: feat/{name}, fix/{name}, chore/{name}

### Content
- Skill content: portable (no hardcoded paths/IDs) — ตาม portable-content.md
- Language ใน skill files: English only
- Language ใน chat กับ user: Thai ได้
- Version bump: อัตโนมัติโดย CI, ไม่ต้อง manual bump
- Commit: conventional commits (feat:, fix:, chore:, docs:)

### Workflow
- ถ้าแก้ skill/command/reference → CI จะ auto-bump VERSION
- ถ้าเพิ่ม skill ใหม่ → สร้าง command file ด้วยเสมอ
- ถ้าเพิ่ม reference ใหม่ → ไม่ต้องแก้ DOC-MAP.md (ยกเว้นเป็น "single source of truth" document)
- ถ้า lint/format issue → แก้เลย

## Workspace Guide Pattern (ใช้กับทุก workflow)

เมื่อ AI ต้องถามคำถามเกี่ยวกับ project-specific config:
1. ตรวจก่อนว่ามี .guide.md ที่ตอบคำถามนี้แล้วหรือยัง
2. ถ้ามี → ใช้คำตอบจาก .guide.md ไม่ต้องถาม
3. ถ้ายังไม่มี → ถาม user แล้วบันทึกลง .guide.md ทันที
4. Pattern นี้ใช้ได้กับทุก config: Jira domain, test env URL, preferred CSV format, default assignee ฯลฯ
