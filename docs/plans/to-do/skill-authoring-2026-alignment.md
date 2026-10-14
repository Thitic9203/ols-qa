# Skill Authoring Alignment (ols-qa + helix) — Master Plan

> Owner: @<owner> · Updated: 2026-10-14 · Scope: ปรับ `skills/` `references/` `commands/` ของ ols-qa ให้ตรงแนวทาง skill authoring ของ Anthropic — helix ได้รับผ่าน `scripts/sync-skills-to-helix.sh` (ไฟล์ร่วมเท่านั้น) · ไม่แตะ env ทดสอบใดๆ

---

## Implementation Progress

| No. | Topic | Status | PR/Commit |
| :---: | :--- | :---: | :--- |
| 1 | แผนนี้ (map + decision tickets) | ✅ | — |
| 2 | รีวิวแผนแบบหาจุดอ่อน — แก้ 6 จุด | ✅ | — |
| 3 | D10 — eval: ร่าง 9 scenario ✅ · รัน baseline | 🟡 | — |
| 4 | D12 — ไฟล์ที่ Claude โหลดจริง | ✅ | ดู Decisions so far |
| 5 | D13 — พิสูจน์เครื่องมือวัด + baseline ใหม่ | ✅ | ดู Decisions so far |
| 6 | D1 — โครงสร้างลิงก์ 1 ชั้น | ✅ ตัดสินแล้ว · ร่าง patch 🟡 | — |
| 7 | D2 — แยก WORKFLOW 3 ไฟล์ที่เกิน 500 บรรทัด + ส่งไฟล์ใหม่เข้า helix | 🚫 | รอ D10 baseline, แก้ helix auto-update |
| 8 | D3 — ตรวจ description: ผ่าน 8/12 · ร่าง patch 4 ใบ | 🟡 | — |
| 9 | D4 — degrees of freedom | ✅ ตัดสินแล้ว · ร่าง patch 🟡 | — |
| 10 | D5 — checklist + go-back line | 🚫 | รอ D2, D10 |
| 11 | D6 — feedback loop / validator | ✅ | ดู Decisions so far |
| 12 | D7 — template + ตัวอย่าง input/output | ⬜ | — |
| 13 | D8 — inventory dependencies | ✅ | ดู Decisions so far |
| 14 | D9 — audit hook + อัตราติดธงผิด | ✅ | ดู Decisions so far |
| 15 | D11 — lint gate กันถอยหลัง | 🟡 | branch `feat/skill-lint` |
| 16 | ใส่ ToC ในไฟล์ที่ยาวเกิน 100 บรรทัด | 🟡 ร่าง patch | — |
| 17 | แก้ helix auto-update ที่ค้างตั้งแต่ 8/10 | 🟡 สืบสาเหตุ | — |

> **Status legend:** ✅ Done · 🟡 In progress · ⬜ To Do · ❌ Failed · 🚫 Blocked
>
> **Updated:** 14/10/2026, 15:51 (Bangkok)

**สถานะสรุป:** 🟡 research ครบ 7 ใบ · ตัดสินแล้ว D1 D4 D10 · กำลังรัน eval baseline + ร่าง patch (ยังไม่แก้ไฟล์ skill) · พบ helix บนเครื่องค้าง v1.5.107 กำลังสืบ

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
| 5 | กระชับ · description บุรุษที่ 3 | "Concise is key" · "Always write in third person" — สิ่งที่ห้ามคือ "I can help…" / "You can use…" · ตัวอย่างที่ดีในเอกสารเองเขียนแบบ "Extract text and tables from PDF files… Use when…" | ✅ ตรง (ห้ามแค่ I/You) |
| 6 | checklist + go-back line | checklist ให้คัดลอกลงคำตอบ · "If citations are incomplete, return to Step 3" | ✅ ตรง |
| 7 | feedback loop | หัวข้อ "Workflows and feedback loops" | ✅ ตรง |
| 8 | template · examples · conditional | progressive disclosure pattern / conditional details | ✅ ตรง |
| 9 | ระบุ dependency + คำสั่งติดตั้ง | "Avoid assuming tools are installed" | ✅ ตรง |
| 10 | กฎเหล็กทำเป็น hook | ไม่พบในเอกสารนี้ (ค้นคำว่า hooks ไม่เจอหัวข้อ) — เป็นความสามารถของ Claude Code hooks | ⚠️ ใช้ได้ แต่ที่มาไม่ใช่เอกสารนี้ |

ข้อเพิ่มจากเอกสารที่บทความไม่ได้พูด: **"Build evaluations first"** (สร้าง eval 3 สถานการณ์ก่อนเขียนเพิ่ม) — รวมไว้ใน D10

---

## Baseline (วัด 14/10/2026 บน `main` @ eb71fbb)

คำสั่งวัด: `git ls-files 'skills/**/*.md' 'references/*.md'` + `wc -l` + `grep`

> ⚠️ แถว ToC, ความลึกลิงก์ และ checklist วัดด้วย grep ที่ยังไม่ผ่านตัวอย่างที่รู้คำตอบ (CLAUDE.md §0) — ใช้เป็นค่าตั้งต้นได้ แต่ห้ามใช้เป็นเกณฑ์ผ่านจนกว่า D13 จะพิสูจน์เครื่องมือ · ตัวเลข 44/60 นับทุกลิงก์ `.md` รวมลิงก์แบบ "see also" ด้วย

| เกณฑ์ | ค่าที่วัดได้ |
| :--- | :--- |
| ไฟล์ skill ที่เกิน 500 บรรทัด | 3 จาก 20 — `retest-bug-workflow/WORKFLOW.md` 1233 · `testing-ticket-workflow/WORKFLOW.md` 883 · `tc-fe-prep-workflow/WORKFLOW.md` 882 |
| ไฟล์ skill 100–500 บรรทัด | 8 — review-result 357 · smoke-test SKILL 320 · tc-api-prep 303 · create-bug 255 · tc-review SKILL 252 · content-takedown 218 · test-data-prep 175 · catch-ai SKILL 135 |
| references > 100 บรรทัดที่มี ToC ใน 15 บรรทัดแรก | 0 จาก 14 (ใหญ่สุด `ols-project-guide.md` 962 · `qa-evidence-gates.md` 420) |
| ความลึกลิงก์ | stub SKILL.md → WORKFLOW.md → references (2 ชั้น) · references ที่ลิงก์ไป reference อื่น 44 จาก 60 (ชั้นที่ 3) · WORKFLOW อ้าง `references/…` 69 path ไม่ซ้ำ |
| description | 12 จาก 12 เขียนแบบคำสั่ง ("Retest a Jira bug…") ซึ่งเป็นรูปเดียวกับตัวอย่างที่ดีของ Anthropic · ไม่พบ "I " / "You " ขึ้นต้น (grep ได้ 0) → ผ่านเกณฑ์อยู่แล้ว |
| ไฟล์ที่ Claude โหลดจริง | `~/.claude/skills/<name>` เป็น symlink ไป `~/.helix/tc-fe-prep/skills/<name>` (ตรวจด้วย `ls -la ~/.claude/skills`) — ไม่ได้อ่านจาก ols-qa โดยตรง |
| ไม่มี checklist `- [ ]` เลย | 11 จาก 20 — stub SKILL.md 8 ใบ · smoke-test SKILL · content-takedown WORKFLOW · test-data-prep WORKFLOW |
| go-back line | พบใน 3 จาก 20 ไฟล์ (retest-bug 2 · tc-fe-prep 1 · testing-ticket 1) |
| hooks ที่มีอยู่ | 20 รายการใน `.claude/settings.json` — เช่น ask-guard · git-staging-guard · issue-creation-guard · jira-ticket-guard · discord-notify-guard · investigation-gate |

---

## Architecture & Tech Stack

- **โครงสร้างปัจจุบัน**: `skills/helix/SKILL.md` (router) → `skills/<name>/SKILL.md` (stub) → `skills/procedures/<name>/WORKFLOW.md` → `references/*.md`
- **helix sync**: post-commit → `scripts/sync-skills-to-helix.sh` sync เฉพาะไฟล์ที่มีอยู่ใน helix แล้ว · **ไฟล์ใหม่ไม่ sync อัตโนมัติ** → ถ้า D2 แยก WORKFLOW แล้ว helix ได้แค่ WORKFLOW ที่ลิงก์ไปไฟล์ที่ไม่มี = ลิงก์พัง · ไฟล์ OLS เฉพาะ (`ols-project-guide.md`) ไม่เคย sync
- **ทางที่ skill ถึง Claude**: ols-qa commit → sync helix repo → deploy ลง `~/.helix/tc-fe-prep/skills/` → symlink ใน `~/.claude/skills/` · การวัดผลทุกครั้งต้องยืนยันว่าไฟล์ที่ติดตั้งเป็นเวอร์ชันที่แก้แล้ว (D12)
- **Gate**: `bash scripts/run-test-suites.sh` + pre-push · `scripts/check-no-secrets.sh` (repo public)
- **Routing**: `references/skill-routing.md` + description ใน frontmatter — เปลี่ยน description = เปลี่ยนการเลือก skill

---

## Decision tickets

ทุกใบ = 1 คำถาม 1 session · HITL = ต้องตัดสินกับเจ้าของงาน · AFK = agent ทำเองได้

| ID | ประเภท | คำถาม | ขึ้นกับ |
| :---: | :---: | :--- | :---: |
| D10 | Grilling (HITL) | **ทำก่อน** — eval 3 สถานการณ์ต่อ skill หลัก (retest-bug · testing-ticket · tc-fe-prep) วัด baseline ก่อนแก้ไฟล์ และทดสอบกับโมเดลไหน (โมเดลที่ skill รันจริง vs ทุกโมเดล) — ประเมิน token ก่อนรัน | — |
| D12 | Task (AFK) | ยืนยันทางที่ skill ถึง Claude: เวอร์ชันใน `~/.helix/tc-fe-prep` ตรงกับ helix main / ols-qa main ไหม · ขั้น deploy ต้องรันอะไร · ใส่ขั้นนี้ในทุก PR ของแผน | — |
| D13 | Task (AFK) | พิสูจน์เครื่องมือวัด ToC / ความลึกลิงก์ / checklist ด้วยตัวอย่างที่ต้องพบ 1 และต้องไม่พบ 1 แล้ววัด baseline ใหม่ · แยกลิงก์ "ต้องอ่าน" ออกจาก "see also" | — |
| D1 | Grilling (HITL) | จะทำให้ทุก reference อยู่ห่างจาก SKILL.md ที่ถูกโหลด 1 ชั้นอย่างไร — (ก) stub SKILL.md กลายเป็นสารบัญที่ลิงก์ WORKFLOW และ references ตรง (ข) รวม stub กับ WORKFLOW เป็นไฟล์เดียว (ค) คงโครงเดิม ใส่ ToC อย่างเดียว · และ references 44 ไฟล์ที่ลิงก์ต่อกันจะจัดการอย่างไร | — |
| D2 | Grilling (HITL) | แยก 3 WORKFLOW ที่เกิน 500 บรรทัดตามรอยต่อไหน (ต่อ phase / ต่อชนิด bug FE-API / ต่อ gate) และไฟล์ใหม่ต้องเพิ่มเข้า helix อย่างไรไม่ให้ลิงก์พัง (sync ไม่ส่งไฟล์ใหม่) | D1, D10, D12 |
| D3 | Research (AFK) | description ผ่านเกณฑ์ "ไม่ใช้ I/You" อยู่แล้ว — ตรวจเฉพาะว่าทุกใบมีทั้ง "ทำอะไร" และ "Use when…" ครบ · ไม่เขียนใหม่ทั้งชุด เพราะเปลี่ยน description = เปลี่ยน routing | — |
| D4 | Grilling (HITL) | ขั้นไหนเป็น Low freedom (ล็อกสคริปต์: โพสต์ Jira · เขียนชีท · verdict matrix · ลบ/คืนค่าข้อมูล) ขั้นไหน High (ถ้อยคำคอมเมนต์ · สรุปแชท) — ติดป้ายในหัวข้อขั้นตอน | — |
| D5 | Grilling (HITL) | workflow ไหนต้องมี checklist ให้คัดลอกลงคำตอบ และ go-back line ของแต่ละ gate ย้อนไปขั้นไหน | D2, D10 |
| D6 | Research (AFK) | output แต่ละชนิด (คอมเมนต์ Jira · แถวชีท · คลิป · CSV · โนติ Discord) มี validator อะไรแล้ว (`verify-video.py`, `retest_rules.js` ฯลฯ) ชนิดไหนยังไม่มี loop ตรวจ-แก้-ตรวจ | — |
| D7 | Prototype (HITL) | output ไหนควรมีตัวอย่าง input/output คู่ และเป็น template แบบเคร่ง หรือแนวทาง | D4 |
| D8 | Research (AFK) | inventory dependency ต่อ skill (Node ≥18 · Python + แพ็กเกจ · ffmpeg · Playwright · MCP ที่ต้องมี) + คำสั่งตรวจ/ติดตั้งที่ portable ตาม `references/portable-content.md` | — |
| D9 | Research (AFK) | สองด้าน: (1) กฎ 🔴 ข้อไหนยังพึ่งตัวอักษรอย่างเดียว เทียบ post-mortem ที่เคยพลาดจริง → รายการ hook ที่ควรเพิ่ม (ติดตั้งจริงต้องถามก่อน) (2) อัตราติดธงผิดของ guard เดิม — ตัวอย่างจาก session 14/10: investigation-guard จับคำว่า "ค้าง" ในบทความที่ user วาง · ask-guard บล็อกคำถาม scope เพราะคำว่า "destination"/"token" | — |
| D11 | Task (AFK) | เพิ่ม lint ใน `run-test-suites.sh`: ไฟล์ skill ≤ 500 · ToC เมื่อ > 100 · ความลึกลิงก์ "ต้องอ่าน" · พร้อม test ที่ต้องพบ 1 / ต้องไม่พบ 1 | D1, D13 |

---

## Decisions so far

- **D1** (เจ้าของงาน 14/10): stub `skills/<name>/SKILL.md` เป็นสารบัญลิงก์ WORKFLOW + reference ที่ต้องอ่านทุกไฟล์ตรง 1 ชั้น · ไม่ย้ายไฟล์
- **D4** (เจ้าของงาน 14/10): 3 ระดับตามความเสี่ยง — Low = เขียนออกระบบนอก + verdict · Medium = ร่างตามเทมเพลต · High = สรุปแชท/วิธีสืบ · ป้ายท้ายหัวข้อขั้นตอน เช่น `## Step 5 — Post comment [low freedom]`
- **D10** (เจ้าของงาน 14/10): รัน eval เป็น subagent ใน Claude Code (ไม่เรียก API แยก) · 9 scenario อิง post-mortem จริง · ห้ามแก้ไฟล์ skill ก่อนมี baseline · ต้นทุนประมาณ input 18k–117k token/รอบ (bytes/4)
- **D12**: ไฟล์ที่โหลดจริงของ 8 skill มาจาก helix ที่ติดตั้งบนเครื่อง ซึ่งค้างที่ v1.5.107 (helix main ไปถึง v1.5.119) — 4 skill + 3 reference ต่างจาก main · อีก 4 skill (content-takedown, review-result, smoke-test, test-data-prep) ลิงก์ตรงเข้า working tree ของ ols-qa (branch ไหนก็ไปถึง Claude ทันที) · symlink `test-data-prep` ชี้ไปโฟลเดอร์ที่ไม่มี · sync ไม่ส่งไฟล์ใหม่ใน `references/` เลย และ `skills/` ใหม่ต้องตั้ง `HELIX_SYNC_NEW=1`
- **D13**: เครื่องมือวัดผ่าน fixture ต้องพบ/ต้องไม่พบทุกตัว · ToC 0/14 references และ 0/17 ไฟล์ skill ที่ยาวเกิน 100 บรรทัด · references ลิงก์ต่อกัน 43/60 (ไม่ใช่ 44) · go-back 3/20 · ลิงก์ "ต้องอ่าน" จาก SKILL.md: 1 ชั้น 24 · 2 ชั้น 37 · 3 ชั้น 8 ไฟล์
- **D3**: ผ่าน 8/12 · ไม่ผ่าน: catch-ai ใช้ "your/you" · helix ระบุ 5 skill แต่ routing มี 9 · smoke-test ไม่มี "Do NOT use for…" · smoke-test และ test-data-prep ไม่อยู่ใน `skill-routing.md`
- **D6**: output ที่ไม่มีทั้งตัวตรวจและ loop: Qase CSV (tc-fe-prep) · CSV/Excel (tc-api-prep) · Playwright report (smoke) · รายงาน tc-review · `tools/result-gate/check.js` มีแต่ไม่มี workflow เรียกตรง
- **D8**: 67 dependency ไม่มีคำสั่งตรวจ/ติดตั้ง · repo ไม่มีไฟล์ pin เวอร์ชัน (มีแค่ CI node 20) · `superpowers:systematic-debugging` ถูกอ้าง 9/12 skill ไม่มีวิธีตรวจ · smoke-test SKILL.md และ test-data-prep มี path เครื่องผิดกฎ `portable-content.md`
- **D9**: hook ที่ควรเพิ่มอันดับ 1 = ตรวจหลักฐาน ณ วินาทีก่อนกระทำการย้อนไม่ได้ (~14 incident) · อันดับ 2 = "ถูกปฏิเสธ/เงียบ ≠ ผ่าน" ใน content-takedown (~7) · อัตราติดธงผิด: investigation-guard 263/1,080 (24.4%, 30 วัน) · ask-guard ใช้ override 35/156 (22%) คำที่จับกว้างเกิน (account/sheet/token/destination) · issue-creation-guard 9/43 (21%) — ตัวเลข incident มาจาก keyword + อ่านหัวเรื่อง ยังไม่ได้อ่านทุกฉบับเต็ม

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
- [ ] references > 100 บรรทัดที่มี ToC บนสุด = ทุกไฟล์ (นับด้วยเครื่องมือที่ผ่าน D13)
- [ ] ทุก reference "ต้องอ่าน" ห่างจาก skill file ที่ถูกโหลด 1 ชั้น ตามรูปแบบที่ D1 ตัดสิน
- [ ] description 12/12 ไม่ใช้ I/You และมีทั้ง "ทำอะไร" + "Use when…" · routing test ผ่าน
- [ ] lint gate (D11) อยู่ใน `run-test-suites.sh` และเขียว
- [ ] eval ของ 3 skill หลักไม่แย่ลงเทียบ baseline ที่วัดก่อนแก้ (D10) — วัดบนไฟล์ที่ติดตั้งจริงใน `~/.helix/…`
- [ ] helix ได้ไฟล์ร่วมและไฟล์ใหม่ที่แยกออกมาครบ — ไม่มีลิงก์ใน helix ที่ชี้ไปไฟล์ที่ไม่มี (ตรวจลิงก์ทุกไฟล์ใน helix = 0 พัง)
- [ ] เวอร์ชันใน `~/.helix/tc-fe-prep` = helix main หลัง deploy (D12)
- [ ] ค่าใช้จ่ายใหม่: NO · แตะ repo อื่นนอกจาก helix sync: NO

---

## References

- <a href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices" target="_blank" rel="noopener noreferrer">Anthropic — Skill authoring best practices ↗</a>
- <a href="https://docs.claude.com/en/docs/claude-code/hooks" target="_blank" rel="noopener noreferrer">Claude Code — Hooks ↗</a>
- `references/skill-routing.md` · `references/portable-content.md` · `scripts/sync-skills-to-helix.sh`
