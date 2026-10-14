# Skill Authoring Alignment (ols-qa + helix) — Master Plan

> Owner: @<owner> · Updated: 2026-10-14 · Scope: ปรับ `skills/` `references/` `commands/` ของ ols-qa ให้ตรงแนวทาง skill authoring ของ Anthropic — helix ได้รับผ่าน `scripts/sync-skills-to-helix.sh` (ไฟล์ร่วมเท่านั้น) · ไม่แตะ env ทดสอบใดๆ

---

## Implementation Progress

| No. | Topic | Status | PR/Commit |
| :---: | :--- | :---: | :--- |
| 1 | แผนนี้ (map + decision tickets) | ✅ | — |
| 2 | รีวิวแผนแบบหาจุดอ่อน — แก้ 6 จุด | ✅ | — |
| 3 | D10 — eval: baseline ✅ · after ✅ · R1 multisample n=6/ฝั่ง: guard error baseline 8.3 (2–17) vs after 8.5 (4–12) = ความแปรปรวน · ร่าง 0/13 รัน guard → แก้ใน #30 (ตัวเลขจากสรุปในแชท — ไฟล์ผลหายจาก scratchpad หลังเครื่องรีบูต · post-mortem PM-2026-10-14-03) | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/30" target="_blank" rel="noopener noreferrer">#30 ↗</a> |
| 4 | D12 — ไฟล์ที่ Claude โหลดจริง | ✅ | ดู Decisions so far |
| 5 | D13 — พิสูจน์เครื่องมือวัด + baseline ใหม่ | ✅ | ดู Decisions so far |
| 6 | D11 lint gate + Contents (31 → 0) + D3 description + D4 ป้าย freedom | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/20" target="_blank" rel="noopener noreferrer">#20 ↗</a> · merge เข้า main (<code>8640211</code>) |
| 7 | จุดขัด skill ↔ guard: testing-ticket | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/21" target="_blank" rel="noopener noreferrer">#21 ↗</a> · merge เข้า branch ของ #20 (<code>178c954</code>) |
| 8 | จุดขัด skill ↔ guard: tc-fe-prep (CSV Integration/System) | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/22" target="_blank" rel="noopener noreferrer">#22 ↗</a> · merge เข้า branch ของ #20 (<code>88a1015</code>) |
| 9 | จุดขัด skill ↔ guard: retest-bug (S1 S3 S4 S5) | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/23" target="_blank" rel="noopener noreferrer">#23 ↗</a> · merge เข้า branch ของ #20 (<code>aec5874</code>) |
| 10 | helix sync ส่งเฉพาะจาก main | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/24" target="_blank" rel="noopener noreferrer">#24 ↗</a> · <code>526491e</code> |
| 11 | D7 template 4 ชนิด + D2 แยก WORKFLOW ตาม phase (ใหญ่สุด 499 บรรทัด) + มติเจ้าของงาน 14/10 | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/25" target="_blank" rel="noopener noreferrer">#25 ↗</a> · merge เข้า branch ของ #20 (<code>6686155</code>) |
| 12 | แยก fixture ของ sync_env test ออกจาก HELIX_* ของผู้เรียก | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/26" target="_blank" rel="noopener noreferrer">#26 ↗</a> · <code>a448977</code> |
| 13 | verify-on-origin + helix-parity (post-mortem #0190 #0191) | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/27" target="_blank" rel="noopener noreferrer">#27 ↗</a> · <code>39f81be</code> |
| 14 | D5 checklist 11 workflow · go-back 64 บรรทัด | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/28" target="_blank" rel="noopener noreferrer">#28 ↗</a> · merge เข้า branch ของ #25 (<code>726cb77</code>) |
| 15 | D1 must-read depth 565 → 20 + D8 dependencies 71 รายการ ใน 11 stub | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/29" target="_blank" rel="noopener noreferrer">#29 ↗</a> · merge เข้า branch ของ #25 (<code>726cb77</code>) |
| 16 | ปิดช่องว่างสุดท้าย: smoke-test contents/deps · path เครื่อง → placeholder · retest_guard ก่อนส่งร่าง (<code>786ccbc</code>) · lint 0/0/0/0 | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/30" target="_blank" rel="noopener noreferrer">#30 ↗</a> · merge เข้า branch ของ #25 (<code>8e38384</code>) |
| 17 | helix: run-hook.cmd ไม่มี exec bit → v1.5.120 | ✅ | <a href="https://github.com/Thitic9203/helix/pull/10" target="_blank" rel="noopener noreferrer">helix #10 ↗</a> |
| 18 | helix: sync จาก branch ที่ยังไม่ merge → revert <code>500cfe1</code> → v1.5.123 · post-mortem #0190 #0191 (<code>2679cdf</code>) | ✅ | — |
| 19 | final eval + helix sync (หลัง #25 → #20 ขึ้น main) | ✅ | final eval BASE 44/46 = FINAL 44/46 ไม่มี regression · helix-parity 0 จาก 131 ไฟล์ร่วมต่างกัน · ติดตั้ง = helix main v1.5.125 |
| 20 | catch-ai audit ของแผนนี้ | ✅ | ดูหัวข้อ Audit (catch-ai) |
| 21 | helix-parity: fetch ค้างไม่มีกำหนด → จำกัดเวลา + CANNOT-VERIFY | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/32" target="_blank" rel="noopener noreferrer">#32 ↗</a> · <code>3eafecd</code> |
| 22 | follow-up: เมนู helix 11 skill · description "Use when" · regex CSV ไม่ลบ placeholder · lint `description-use-when` | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/33" target="_blank" rel="noopener noreferrer">#33 ↗</a> · <code>5c23d3a</code> · helix v1.5.126 |
| 23 | ตัวตรวจลิงก์ภายใน (`tools/link-check`) | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/34" target="_blank" rel="noopener noreferrer">#34 ↗</a> · <code>dcdb91f</code> |
| 24 | skill เฉพาะ OLS เป็นข้อความ "ols-qa workspace only" ไม่มีลิงก์ · แก้ anchor publish-options | ✅ | <a href="https://github.com/Thitic9203/ols-qa/pull/35" target="_blank" rel="noopener noreferrer">#35 ↗</a> · <code>b1e8213</code> · helix v1.5.127 · LINK-CHECK OK |

> **Status legend:** ✅ Done · 🟡 In progress · ⬜ To Do · ❌ Failed · 🚫 Blocked
>
> **Updated:** 14/10/2026, 23:28 (Bangkok)

**สถานะสรุป:** ✅ จบแผน — D1–D13 + follow-up ขึ้น main ครบ (#20–#35) · Success Criteria 9/9 · lint 0 ทุกกฎ · helix v1.5.127 parity 0/131 · LINK-CHECK OK · eval ไม่มี regression

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
- **มติเจ้าของงาน 14/10 (รอบ 2):** D1 stub = Contents ลิงก์ 1 ชั้น · D4 3 ระดับ ป้ายท้ายหัวข้อ · D10 eval ใน Claude Code · D2 แยกตาม phase · D7 template 4 ชนิด · retest ที่ทุกเคสเป็น BLOCKED = "ยังไม่ได้วัด" · ตัดขั้น "ยืนยัน defect" เมื่อ ER ถูกแทนแล้ว · ร่างทำงานของ tc-fe-prep เก็บนอก repo · โหมดร่างอย่างเดียว = ADF JSON + พรีวิว · ทำให้จบโดยไม่ถาม
- **D5** (#28): checklist 11 ชุด (8 WORKFLOW + smoke-test · tc-review · catch-ai SKILL) · go-back 64 บรรทัด · จุดย้อนกลับมาจากข้อความเดิมของ workflow เท่านั้น ไม่เพิ่มกฎใหม่
- **D1/D8** (#29 #30): must-read depth 565 → 20 → 0 · stub 11 ใบมี `## Dependencies` รวม 71 รายการ · path เครื่องและ URL ส่วนตัวเปลี่ยนเป็น placeholder ตาม `portable-content.md`
- **D10 R1:** multisample ไม่พบว่าแย่ลง (ช่วงทับกัน) · ปัญหาจริงคือร่างไม่รัน retest_guard → เพิ่มบรรทัดบังคับใน #30 (<code>786ccbc</code>)
- **helix:** หลัง incident sync จาก branch ที่ยังไม่ merge (revert <code>500cfe1</code>, v1.5.123) sync ส่งเฉพาะจาก main (#24) และมี helix-parity ตรวจ (#27)

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

> ติ๊กเมื่อพิสูจน์บน `main` แล้วเท่านั้น · ค่าในวงเล็บวัดใหม่ 14/10 22:0x บน `main` @ <code>13e527b</code> ด้วย `node tools/skill-lint/lint.js --no-baseline` + `wc -l` (catch-ai audit)

- [x] ไฟล์ SKILL.md / WORKFLOW.md ที่เกิน 500 บรรทัด = 0 (baseline 3 · main: 0 — ใหญ่สุด 499 `retest-bug-workflow/WORKFLOW.md`)
- [x] references > 100 บรรทัดที่มี ToC บนสุด = ทุกไฟล์ (main: lint toc 0 violation)
- [x] ทุก reference "ต้องอ่าน" ห่างจาก skill file ที่ถูกโหลด 1 ชั้น ตามรูปแบบที่ D1 ตัดสิน (main: must-read-depth 0 · baseline ว่าง)
- [x] description 12/12 ไม่ใช้ I/You และมีทั้ง "ทำอะไร" + "Use when…" · routing test ผ่าน (main @ <code>b1e8213</code>: description-person 0 · description-use-when 0 (กฎใหม่ใน <a href="https://github.com/Thitic9203/ols-qa/pull/33" target="_blank" rel="noopener noreferrer">#33 ↗</a>) · "Use when" 12/12 · `routing.test.js` 18/0)
- [x] lint gate (D11) อยู่ใน `run-test-suites.sh` และเขียว (main: `tools/skill-lint/skill_lint.test.js` อยู่ในรายชื่อของ `scripts/list-test-suites.sh` · lint `OK — no new violations`)
- [x] eval ของ 3 skill หลักไม่แย่ลงเทียบ baseline ที่วัดก่อนแก้ (D10) (final: BASE <code>5755557</code> 44/46 = FINAL <code>32a1f6a</code> 44/46 · FAIL 0 ทั้งสองฝั่ง · TT-1/TT-2 ข้อ E1 ตัดสินไม่ได้ทั้งสองฝั่ง (คลิป offline ต่ำกว่าเกณฑ์วิดีโอ) · rerun FE-2 บน main <code>948ac94</code> หลัง #33/#35 = 6/6 · placeholder 17 ตัวครบ HTML tag 0 · ผลอยู่ใน repo หลักฐาน `evals/skill-authoring-2026-10-14/RESULTS.md` commit <code>6925c72</code>) — วิธีวัด: รันบน worktree ของ ols-qa main · ไฟล์ที่ติดตั้งใน `~/.helix/tc-fe-prep` = helix main <code>7d3890a</code> และ `HELIX-PARITY OK 0 of 131` ยืนยันว่าไฟล์ร่วมเนื้อหาเดียวกัน
- [x] helix ได้ไฟล์ร่วมและไฟล์ใหม่ที่แยกออกมาครบ — ไม่มีลิงก์ใน helix ที่ชี้ไปไฟล์ที่ไม่มี (`scripts/helix-link-check.sh` จาก <a href="https://github.com/Thitic9203/ols-qa/pull/34" target="_blank" rel="noopener noreferrer">#34 ↗</a>: `LINK-CHECK OK 1581 links in 171 files` หลัง <a href="https://github.com/Thitic9203/ols-qa/pull/35" target="_blank" rel="noopener noreferrer">#35 ↗</a> · `HELIX-PARITY OK 0 of 131 shared files differ`)
- [x] เวอร์ชันใน `~/.helix/tc-fe-prep` = helix main หลัง deploy (D12) (ติดตั้ง `VERSION` 1.5.127 · HEAD <code>7d3890a</code> = helix origin/main <code>7d3890a</code> · ต้อง restart Claude Code จึงมีผล)
- [x] ค่าใช้จ่ายใหม่: NO · แตะ repo อื่นนอกจาก helix sync: NO (เจ้าของงานยืนยัน 14/10/2026 ผ่าน AskUserQuestion · eval รันเป็น subagent ใน Claude Code ตามมติ D10 · repo หลักฐาน private ใช้เก็บผล eval ตามกฎ §5)


---

## Audit (catch-ai) 14/Oct/2026

> วัด 14/10/2026 22:0x (Bangkok) บน ols-qa `main` @ <code>13e527b</code> · ledger ต่อข้อ (claim · source · command · actual · class) อยู่ใน private evidence repo `evals/skill-authoring-2026-10-14/catch-ai-ledger.jsonl`

**Verdict:** FAILED ก่อนแก้ (สถานะ PR ผิด 5 แถว = Major) → แก้ในไฟล์นี้แล้วทุกข้อ · หลังแก้ไม่มี Defect ค้าง เหลือ Questions 3 ข้อ

**ตรวจแล้ว 37 ข้ออ้าง** (ทุกข้อที่เป็นสถานะ · PR · commit · ตัวเลข lint · helix · post-mortem · eval · Success Criteria) — ไม่ได้ตรวจ: ตัวเลขในตาราง "ที่มา" และ Baseline (วัดก่อน D13 และเป็นค่าประวัติ) · ตัวเลขใน Decisions so far ของ D3 D6 D9 D12 D13 · D5 checklist 11 / go-back 64 · D8 71 dependencies (ตัวนับของ audit ยังไม่ผ่านตัวอย่างที่รู้คำตอบ จึงไม่ใช้ตัดสิน)

| ข้ออ้าง | แหล่งที่ใช้ตัดสิน | ผล |
| :--- | :--- | :---: |
| PR #20–#31 + helix #10 สถานะ/merge commit | `gh pr view <n> --json state,mergeCommit` | 13/13 MERGED |
| commit ที่อ้างในแผน 14 ตัว (ols-qa) + <code>500cfe1</code> (helix) | `git merge-base --is-ancestor <sha> origin/main` · helix `git show 500cfe1:VERSION` = 1.5.123 · `eb005bd:VERSION` = 1.5.120 | ตรง |
| lint 0 ทุกเกณฑ์ · baseline ว่าง | `node tools/skill-lint/lint.js --no-baseline` · `tools/skill-lint/baseline.json` | ตรง |
| lint gate อยู่ในชุดเทสต์ | `scripts/list-test-suites.sh` มี `tools/skill-lint/skill_lint.test.js` | ตรง |
| ไฟล์ใหญ่สุด 499 | `wc -l` ทุก SKILL.md/WORKFLOW.md | ตรง |
| PM-2026-10-14-01/02/03 → #0190/#0191/#0192 | `docs/post-mortem/PENDING.md:25-27` DONE ทั้ง 3 · `node tools/postmortem-guard/check.js` 192 รายงาน 0 open | ตรง |
| helix ติดตั้ง = main | `~/.helix/tc-fe-prep/VERSION` 1.5.125 · HEAD = origin/main <code>c92d9e0</code> | ตรง |
| final eval | `RESULTS.md` (evidence repo commit <code>a1c4635</code> บน origin/main) บรรทัด 15-16, 21-23, 31-38 | ตรง |

### Defects (แก้แล้วในไฟล์นี้)

| # | Severity | Expected (แหล่ง) | Actual ก่อนแก้ | Root cause / การป้องกัน |
| :---: | :---: | :--- | :--- | :--- |
| 1 | Major | #20 MERGED เข้า main <code>8640211</code> · #21 #22 #23 #25 MERGED เข้า `feat/skill-lint` (`gh pr view`) | แถว 6–9, 11 และสถานะสรุป = "เปิดอยู่" | ข้อเท็จจริง: แผนลง Updated 21:34 · #20 merge 21:34:44 (14:34:44Z) · commit แผน <code>492a50e</code> 21:54:55 — สถานะไม่ได้วัดใหม่ก่อน commit — Judgment: วัดสถานะ PR ใหม่ด้วย `gh pr view` ในคำสั่งเดียวกับ commit แผน (ยังเป็นแค่ข้อตกลง ไม่มี gate) |
| 2 | Major | `~/.helix/tc-fe-prep` = helix main (VERSION + rev-parse) | Success Criteria ข้อ helix version ไม่ติ๊ก "(ยังไม่ deploy)" | เหตุเดียวกับข้อ 1 — ติ๊กแล้วพร้อมหลักฐาน |
| 3 | Minor | merit `docs/md_template.md` บรรทัด 3: `Updated: YYYY-MM-DD` | `Updated: 14/10/2026` | แก้เป็น 2026-10-14 |

### Questions

1. helix-parity ครั้งแรก: `git fetch` ของ ols-qa ใน `scripts/helix-parity.sh:37` ค้างเกิน 3 นาที 40 วินาทีจึงหยุด · รันซ้ำด้วย `GIT_TERMINAL_PROMPT=0` จบ exit 0 — ผลไม่คงที่ (CLAUDE.md global ข้อ 21) ยังไม่ได้สืบหาสาเหตุ · สคริปต์ไม่มี timeout ของ fetch → ปิดแล้ว: หาสาเหตุ (fetch ไม่มี timeout บน ssh ผ่าน VPN) และแก้ใน #32 + เทสต์เคสค้าง
2. R1 multisample (แถว 3: 8.3 vs 8.5) ไม่มีไฟล์ผลให้ตรวจ (หายตาม #0192) — ใช้เป็นประวัติได้ ห้ามใช้ตัดสิน
3. ~~Success Criteria "ค่าใช้จ่ายใหม่: NO"~~ — ปิดแล้ว: เจ้าของงานยืนยัน 14/10/2026

### Coverage gaps

- ~~ไม่มีตัวตรวจลิงก์ทุกไฟล์ใน helix~~ → ปิดแล้ว: `tools/link-check` (#34) · helix LINK-CHECK OK
- eval วัดบน worktree ของ ols-qa ไม่ใช่ไฟล์ที่ติดตั้งใน `~/.helix/…` · n=1 ต่อฝั่ง
- ~~routing test ไม่ได้ตรวจคำ "Use when"~~ → ปิดแล้ว: lint `description-use-when` + routing A5 (#33)

### Follow-ups — แก้แล้วใน #33 #35 (เหลือข้อสุดท้าย)

- ✅ เมนู helix 11 skill (#33) · 4 skill เฉพาะ OLS เป็นข้อความ "ols-qa workspace only" (#35, มติเจ้าของงาน 14/10)
- ✅ description ใช้ "Use when" ครบ 12/12 (#33)
- ✅ regex CSV ลบเฉพาะแท็ก HTML ที่อยู่ในรายการ เก็บ placeholder (#33)
- ⬜ ไฟล์ร่วมฝั่ง ols-qa มีลิงก์ที่ชี้ไปไฟล์ที่มีเฉพาะใน helix 6 จุด (`agent-entry.md:3` · `csv-export-rules.md:213` · `proactive-qa-triggers.md:52` · `test-md-format.md:5,94`) — ฝั่ง helix ไม่พัง · ฝั่ง ols-qa ยังพัง (รายชื่อเต็มใน repo หลักฐาน `evals/skill-authoring-2026-10-14/lane-K-olsqa.txt`) — งานถัดไป ไม่อยู่ในเกณฑ์ของแผนนี้

---

## References

- <a href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices" target="_blank" rel="noopener noreferrer">Anthropic — Skill authoring best practices ↗</a>
- <a href="https://docs.claude.com/en/docs/claude-code/hooks" target="_blank" rel="noopener noreferrer">Claude Code — Hooks ↗</a>
- `references/skill-routing.md` · `references/portable-content.md` · `scripts/sync-skills-to-helix.sh`
