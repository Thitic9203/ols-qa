# Skill Authoring Alignment (ols-qa + helix) — Master Plan

> Owner: @<owner> · Updated: 2026-10-14 · Scope: ปรับ `skills/` `references/` `commands/` ของ ols-qa ให้ตรงแนวทาง skill authoring ของ Anthropic — helix ได้รับผ่าน `scripts/sync-skills-to-helix.sh` (ไฟล์ร่วมเท่านั้น) · ไม่แตะ env ทดสอบใดๆ

---

## Implementation Progress

| No. | Topic | Status | PR/Commit |
| :---: | :--- | :---: | :--- |
| 1 | แผนนี้ (map + decision tickets) | ✅ | — |
| 2 | D1 — โครงสร้างลิงก์ 1 ชั้น (stub → WORKFLOW → references) | ⬜ | — |
| 3 | D2 — แยก WORKFLOW 3 ไฟล์ที่เกิน 500 บรรทัด | 🚫 | รอ D1 |
| 4 | D3 — เขียน description ใหม่เป็นบุรุษที่ 3 | ⬜ | — |
| 5 | D4 — กำหนด degrees of freedom รายขั้นตอน | ⬜ | — |
| 6 | D5 — checklist + go-back line | 🚫 | รอ D2 |
| 7 | D6 — feedback loop / validator ของ output แต่ละชนิด | ⬜ | — |
| 8 | D7 — template + ตัวอย่าง input/output | 🚫 | รอ D4 |
| 9 | D8 — inventory dependencies ต่อ skill (research) | ⬜ | — |
| 10 | D9 — audit กฎ 🔴 ที่ยังไม่มี hook (research) | ⬜ | — |
| 11 | D10 — eval scenarios + โมเดลที่ใช้ทดสอบ | ⬜ | — |
| 12 | D11 — lint gate กันถอยหลัง (500 / ToC / depth / description) | 🚫 | รอ D1, D3 |
| 13 | ใส่ ToC ใน references ที่ยาวเกิน 100 บรรทัด (14 ไฟล์) | ⬜ | — |

> **Status legend:** ✅ Done · 🟡 In progress · ⬜ To Do · ❌ Failed · 🚫 Blocked
>
> **Updated:** 14/10/2026, 15:23 (Bangkok)

**สถานะสรุป:** ⬜ วางแผนเสร็จ ยังไม่แตะไฟล์ skill — 11 decision ticket รอตัดสิน (D1, D3, D4, D6, D8, D9, D10 เริ่มได้ทันที)

---

## Goal / Objectives

- ปรับทุก skill ให้ผ่านเกณฑ์ที่วัดได้ใน Success Criteria โดยไม่เปลี่ยนพฤติกรรมของ skill (กฎเดิมอยู่ครบ แค่ย้ายที่/จัดโครง)
- ทุก decision ที่กระทบโครงสร้าง (ย้ายไฟล์ · rename · เปลี่ยน description ที่ใช้ route) ต้องได้คำยืนยันจากเจ้าของงานก่อนลงมือ — CLAUDE.md global ข้อ 5
- มี lint gate ใน `scripts/run-test-suites.sh` เพื่อไม่ให้เกณฑ์ถอยหลังหลังปรับเสร็จ

> ทำ: โครงสร้างไฟล์ · ToC · description · checklist · validator · dependencies · hook audit
> ไม่ทำ: เปลี่ยนเนื้อกฎ QA / verdict / evidence gate · เพิ่ม skill ใหม่ · ติดตั้ง hook ใหม่โดยไม่ถาม (global ข้อ 23)

---

## ที่มา — ตรวจข้อกล่าวอ้างของบทความกับเอกสาร Anthropic

บทความต้นทาง (โพสต์ TrendTech, Facebook) สรุป 10 ข้อ ตรวจเทียบ <a href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices" target="_blank" rel="noopener noreferrer">Skill authoring best practices ↗</a> เมื่อ 14/10/2026:

| ข้อ | ในบทความ | ในเอกสาร Anthropic | ผล |
| :---: | :--- | :--- | :---: |
| 1 | SKILL.md ≤ 500 บรรทัด · ลิงก์ลึก 1 ชั้น | "Keep SKILL.md body under 500 lines" · "Keep references one level deep from SKILL.md" | ✅ ตรง |
| 1 | "Claude 5.5 อ่านพรีวิวแค่ 100 บรรทัด" | เอกสารบอกว่าเมื่อเจอ nested reference อาจใช้ `head -100` — ไม่ได้ระบุรุ่นโมเดล | ⚠️ ตัดเลขรุ่นออก |
| 2 | ไฟล์ > 100 บรรทัดต้องมี ToC บนสุด | "For reference files longer than 100 lines, include a table of contents" | ✅ ตรง |
| 3 | Degrees of freedom High/Medium/Low | หัวข้อ "Set appropriate degrees of freedom" | ✅ ตรง |
| 4 | ทดสอบกับ Haiku/Sonnet/Opus/Fable | "Test with all models you plan to use" — ระบุ Haiku/Sonnet/Opus | ⚠️ Fable ไม่อยู่ในเอกสาร |
| 5 | กระชับ · description บุรุษที่ 3 | "Concise is key" · "Always write in third person" | ✅ ตรง |
| 6 | checklist + go-back line | checklist ให้คัดลอกลงคำตอบ · "If citations are incomplete, return to Step 3" | ✅ ตรง |
| 7 | feedback loop | หัวข้อ "Workflows and feedback loops" | ✅ ตรง |
| 8 | template · examples · conditional | progressive disclosure pattern / conditional details | ✅ ตรง |
| 9 | ระบุ dependency + คำสั่งติดตั้ง | "Avoid assuming tools are installed" | ✅ ตรง |
| 10 | กฎเหล็กทำเป็น hook | ไม่พบในเอกสารนี้ (ค้นคำว่า hooks ไม่เจอหัวข้อ) — เป็นความสามารถของ Claude Code hooks | ⚠️ ใช้ได้ แต่ที่มาไม่ใช่เอกสารนี้ |

ข้อเพิ่มจากเอกสารที่บทความไม่ได้พูด: **"Build evaluations first"** (สร้าง eval 3 สถานการณ์ก่อนเขียนเพิ่ม) — รวมไว้ใน D10

---

## Baseline (วัด 14/10/2026 บน `main` @ eb71fbb)

คำสั่งวัด: `git ls-files 'skills/**/*.md' 'references/*.md'` + `wc -l` + `grep`

| เกณฑ์ | ค่าที่วัดได้ |
| :--- | :--- |
| ไฟล์ skill ที่เกิน 500 บรรทัด | 3 จาก 20 — `retest-bug-workflow/WORKFLOW.md` 1233 · `testing-ticket-workflow/WORKFLOW.md` 883 · `tc-fe-prep-workflow/WORKFLOW.md` 882 |
| ไฟล์ skill 100–500 บรรทัด | 8 — review-result 357 · smoke-test SKILL 320 · tc-api-prep 303 · create-bug 255 · tc-review SKILL 252 · content-takedown 218 · test-data-prep 175 · catch-ai SKILL 135 |
| references > 100 บรรทัดที่มี ToC ใน 15 บรรทัดแรก | 0 จาก 14 (ใหญ่สุด `ols-project-guide.md` 962 · `qa-evidence-gates.md` 420) |
| ความลึกลิงก์ | stub SKILL.md → WORKFLOW.md → references (2 ชั้น) · references ที่ลิงก์ไป reference อื่น 44 จาก 60 (ชั้นที่ 3) · WORKFLOW อ้าง `references/…` 69 path ไม่ซ้ำ |
| description | 12 จาก 12 เขียนแบบคำสั่ง ("Retest a Jira bug…", "Run a post-deployment…") — ไม่ใช่บุรุษที่ 3 ("Retests…") |
| ไม่มี checklist `- [ ]` เลย | 11 จาก 20 — stub SKILL.md 8 ใบ · smoke-test SKILL · content-takedown WORKFLOW · test-data-prep WORKFLOW |
| go-back line | พบใน 3 จาก 20 ไฟล์ (retest-bug 2 · tc-fe-prep 1 · testing-ticket 1) |
| hooks ที่มีอยู่ | 20 รายการใน `.claude/settings.json` — เช่น ask-guard · git-staging-guard · issue-creation-guard · jira-ticket-guard · discord-notify-guard · investigation-gate |

---

## Architecture & Tech Stack

- **โครงสร้างปัจจุบัน**: `skills/helix/SKILL.md` (router) → `skills/<name>/SKILL.md` (stub) → `skills/procedures/<name>/WORKFLOW.md` → `references/*.md`
- **helix sync**: post-commit → `scripts/sync-skills-to-helix.sh` sync เฉพาะไฟล์ที่มีอยู่ใน helix แล้ว · ไฟล์ใหม่ไม่ sync อัตโนมัติ (ต้องตัดสินใน D2 ว่าไฟล์ที่แยกออกมาจะเข้า helix อย่างไร) · ไฟล์ OLS เฉพาะ (`ols-project-guide.md`) ไม่เคย sync
- **Gate**: `bash scripts/run-test-suites.sh` + pre-push · `scripts/check-no-secrets.sh` (repo public)
- **Routing**: `references/skill-routing.md` + description ใน frontmatter — เปลี่ยน description = เปลี่ยนการเลือก skill

---

## Decision tickets

ทุกใบ = 1 คำถาม 1 session · HITL = ต้องตัดสินกับเจ้าของงาน · AFK = agent ทำเองได้

| ID | ประเภท | คำถาม | ขึ้นกับ |
| :---: | :---: | :--- | :---: |
| D1 | Grilling (HITL) | จะทำให้ทุก reference อยู่ห่างจาก SKILL.md ที่ถูกโหลด 1 ชั้นอย่างไร — (ก) stub SKILL.md กลายเป็นสารบัญที่ลิงก์ WORKFLOW และ references ตรง (ข) รวม stub กับ WORKFLOW เป็นไฟล์เดียว (ค) คงโครงเดิม ใส่ ToC อย่างเดียว · และ references 44 ไฟล์ที่ลิงก์ต่อกันจะจัดการอย่างไร | — |
| D2 | Grilling (HITL) | แยก 3 WORKFLOW ที่เกิน 500 บรรทัดตามรอยต่อไหน (ต่อ phase / ต่อชนิด bug FE-API / ต่อ gate) และไฟล์ใหม่ต้องเพิ่มเข้า helix อย่างไร | D1 |
| D3 | Grilling (HITL) | เขียน description 12 ใบเป็นบุรุษที่ 3 + "Use when…" — ต้องคง trigger words และ "Do NOT use for…" เดิมไว้ครบ · ตรวจผลกับ `skill-routing.md` | — |
| D4 | Grilling (HITL) | ขั้นไหนเป็น Low freedom (ล็อกสคริปต์: โพสต์ Jira · เขียนชีท · verdict matrix · ลบ/คืนค่าข้อมูล) ขั้นไหน High (ถ้อยคำคอมเมนต์ · สรุปแชท) — ติดป้ายในหัวข้อขั้นตอน | — |
| D5 | Grilling (HITL) | workflow ไหนต้องมี checklist ให้คัดลอกลงคำตอบ และ go-back line ของแต่ละ gate ย้อนไปขั้นไหน | D2 |
| D6 | Research (AFK) | output แต่ละชนิด (คอมเมนต์ Jira · แถวชีท · คลิป · CSV · โนติ Discord) มี validator อะไรแล้ว (`verify-video.py`, `retest_rules.js` ฯลฯ) ชนิดไหนยังไม่มี loop ตรวจ-แก้-ตรวจ | — |
| D7 | Prototype (HITL) | output ไหนควรมีตัวอย่าง input/output คู่ และเป็น template แบบเคร่ง หรือแนวทาง | D4 |
| D8 | Research (AFK) | inventory dependency ต่อ skill (Node ≥18 · Python + แพ็กเกจ · ffmpeg · Playwright · MCP ที่ต้องมี) + คำสั่งตรวจ/ติดตั้งที่ portable ตาม `references/portable-content.md` | — |
| D9 | Research (AFK) | กฎ 🔴 ใน CLAUDE.md / docs ข้อไหนยังพึ่งตัวอักษรอย่างเดียว เทียบกับ post-mortem ที่เคยพลาดจริง → รายการ hook ที่ควรเพิ่ม (ติดตั้งจริงต้องถามก่อน) | — |
| D10 | Grilling (HITL) | eval 3 สถานการณ์ต่อ skill หลัก (retest-bug · testing-ticket · tc-fe-prep) วัด before/after และทดสอบกับโมเดลไหน (โมเดลที่ skill รันจริง vs ทุกโมเดล) — ประเมิน token ก่อนรัน | — |
| D11 | Task (AFK) | เพิ่ม lint ใน `run-test-suites.sh`: ไฟล์ skill ≤ 500 · ToC เมื่อ > 100 · ความลึกลิงก์ · description บุรุษที่ 3 · พร้อม test ที่ต้องพบ 1 / ต้องไม่พบ 1 | D1, D3 |

---

## Not yet specified

- `CLAUDE.md` และ `docs/*.md` ของ repo (ไม่ใช่ skill) ควรใช้เกณฑ์ ToC เดียวกันไหม — รอดูผล D1
- `commands/*.md` มีโครงคล้าย stub — อาจเข้าเกณฑ์เดียวกันหลัง D1
- ลำดับ rollout ต่อ helix (ทีละ skill หรือรวดเดียว) — รอ D2

## Out of scope

- เปลี่ยนเนื้อกฎ QA, verdict, evidence gate, bug priority matrix — แผนนี้จัดโครง ไม่แก้กฎ
- skill ที่อยู่นอก repo (plugin marketplace, `~/.claude/skills`)
- ไฟล์ที่มีเฉพาะใน helix (ไม่มีคู่ใน ols-qa)

---

## Success Criteria

- [ ] ไฟล์ SKILL.md / WORKFLOW.md ที่เกิน 500 บรรทัด = 0 (baseline 3)
- [ ] references > 100 บรรทัดที่มี ToC บนสุด = 14/14 (baseline 0/14)
- [ ] ทุก reference ห่างจาก skill file ที่ถูกโหลด 1 ชั้น ตามรูปแบบที่ D1 ตัดสิน
- [ ] description บุรุษที่ 3 = 12/12 (baseline 0/12) และ routing test ผ่าน
- [ ] lint gate (D11) อยู่ใน `run-test-suites.sh` และเขียว
- [ ] eval ของ 3 skill หลักไม่แย่ลงเทียบ baseline (D10)
- [ ] helix ได้ไฟล์ร่วมครบหลัง sync — เทียบ diff ไฟล์ร่วม helix ↔ ols-qa = 0
- [ ] ค่าใช้จ่ายใหม่: NO · แตะ repo อื่นนอกจาก helix sync: NO

---

## References

- <a href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices" target="_blank" rel="noopener noreferrer">Anthropic — Skill authoring best practices ↗</a>
- <a href="https://docs.claude.com/en/docs/claude-code/hooks" target="_blank" rel="noopener noreferrer">Claude Code — Hooks ↗</a>
- `references/skill-routing.md` · `references/portable-content.md` · `scripts/sync-skills-to-helix.sh`
