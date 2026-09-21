# CLAUDE.md — ols-qa (ฉบับย่อ)

> ฉบับเต็มทุกกฎ + เหตุผล + post-mortem ทุกฉบับ: [`docs/CLAUDE-ARCHIVE.md`](docs/CLAUDE-ARCHIVE.md) — ค้นด้วย grep ตามหัวข้อ ไม่ต้องอ่านทั้งไฟล์
> ทุกบรรทัดด้านล่างคือกฎบังคับ ตัดคำอธิบายออกเท่านั้น ไม่ได้ตัดกฎ

@CONTEXT.md

> ค่าคอนฟิก OLS (Jira/ชีท/Drive/env/field id/เครื่องมือ sync) อยู่ที่ [`references/ols-project-guide.md`](references/ols-project-guide.md) — ไม่ auto-load (109 KB) **ต้อง grep หัวข้อที่เกี่ยวก่อนทำงาน OLS ทุกครั้ง** และก่อนถามค่าใดๆ กับ user

## 0. ห้ามเดา (ใหญ่สุด)
- มี 3 สถานะเท่านั้น: **ตรวจแล้ว** (แนบ path:line / คำสั่ง+output / API / commit) · **ยังไม่ตรวจ** (บอกตรงๆ แล้วไปตรวจ) · **ตรวจไม่ได้** (บอกว่าติดอะไร ต้องมีอะไร แล้วหยุดถาม)
- ห้ามใช้คำกลบการเดา: manifest · canonical · by design · น่าจะ · อาจจะ · likely · should be · "ตามสเปก/Figma/AC" ที่ยังไม่เปิด · ห้ามปั้นตัวเลข/ชื่อ/id/field/hash
- memory · session context · WIP note · ผล subagent · คอมเมนต์ในโค้ด · CLAUDE.md = จริง ณ ตอนเขียน ต้อง re-verify รอบนี้
- ข้อสรุปจาก triage/ไฟล์สรุปรอบก่อน/บรรทัด ledger ของเลน ห้ามพูดเป็นข้อเท็จจริง (ต้องมี VERIFY แยก) · ตำแหน่งข้อความไม่ใช่หลักฐานว่าใครเขียน (เช็ค `model` ด้วย `replyAuthor()`)
- ข้ออ้างเชิงลบ ("ไม่มี X"/"ต้องสร้างใหม่") ต้องแนบคำสั่งค้น + ขอบเขต + จำนวน · "ตรวจแล้ว" ต้องบอกว่าวัดอะไร ผ่าน/ไม่ผ่าน/ยังไม่วัด กี่จากกี่
- ตัวเลขจากคิวรีต้องแนบคิวรี+ตัวหาร · บรรทัดสรุปของเครื่องมือไม่ใช่คำตอบจนพิสูจน์ว่าวัดสิ่งเดียวกัน · "ตรวจไม่ได้" ห้ามนับรวม "ไม่ผ่าน"
- สถานะโปรเซส/งาน: ห้ามอ่านจากรหัสจบผ่าน pipe · บรรทัดสุดท้ายที่พิมพ์ · mtime/stat · ผลว่างของ grep → ใช้ `pgrep -f`+รหัสจบ, `wc -c` สองครั้ง, ไฟล์ผลบนดิสก์
- เวลาต้องวัด (`date` / timestamp จริง) ห้ามประมาณ ห้าม `~` · ข้อความ "ข้อจำกัด" ที่สั่งให้คนทำอะไรต้องวัดแล้วเท่านั้น · สมมติฐานเขียน "สมมติฐาน: … (จะตรวจด้วย …)"
- เครื่องมือวัดที่เขียนเองต้องผ่านตัวอย่างที่รู้คำตอบ (ต้องพบ 1 · ต้องไม่พบ 1) ก่อนเชื่อ · ห้าม `fps=1/N` เพื่อถามว่าเวลานั้นมีอะไรบนจอ · ผลเราขัดคนอื่น สงสัยเครื่องมือตัวเองก่อน
- ความสามารถที่วัดบน env หนึ่ง ไม่ใช่ข้อเท็จจริงของ env อื่น (ระบุ env ในประโยค)

## 1. post-mortem — ทุกความผิดพลาดต้องมีรายงาน ห้ามผิดซ้ำ

กฎทั้งหมดอยู่ใน [`docs/POSTMORTEM_RULE.md`](docs/POSTMORTEM_RULE.md) — กติกา post-mortem ทุกความผิดพลาด · อ่านไฟล์นั้นก่อนเขียนหรืออ่าน post-mortemทุกครั้ง
- ไฟล์ ` M` ที่ไม่รู้ที่มา: รัน `bash scripts/whose-change.sh` — `STALE` = ของค้าง คืนค่าได้ · `EDITED` = มีคนพิมพ์ ห้ามแตะ (#0007)


## 2. ตรวจสอบปัญหา = `superpowers:systematic-debugging` เท่านั้น (investigation-guard)
- prompt เรื่องพัง/ค้าง/เฟล/error/ผลไม่ตรง/ทำไม → เรียกสกิล (เธรดหลักหรือ subagent) ห้ามไล่เดาก่อน · Stop hook บล็อกถ้าไม่เรียก · ธงผิดจริง: `node tools/investigation-guard/check.js --not-an-investigation "เหตุผล"`
- 5 ขั้นห้ามข้าม: (1) สืบจนมีหลักฐาน (2) รายงาน 4 หัวข้อ: ปัญหาจริง · สาเหตุจริง · ทางแก้ดีสุด · การป้องกัน (3) ถามแล้วรอ (4) ทำตามขอบเขตที่ยืนยัน (5) รีวิว+รันเทสต์ทั้งชุด
- คำขอ "แนะนำ" เรื่องความล้มเหลว = งานตรวจสอบ เริ่มขั้น 1
- เจอปัญหากลางงาน → บอก user → แยก Agent background 1 ตัว/ปัญหา สั่งเรียกสกิลนี้ prompt ครบ (อาการ verbatim · คำสั่ง+cwd · ไฟล์ · ที่ลองแล้ว · ห้ามแตะ) → main ทำต่อ → verify ผลเองก่อนเชื่อ

## 3. ถามเจ้าของงาน (ask-guard)
- ก่อนถามข้อมูลอ้างอิง (เธรด · webhook · ลิงก์ · ID · บัญชี · env · ชีท · token) ต้องค้น episodic memory ในเทิร์นนั้น + `ROUND_DECISIONS.md` ของรอบ · เจอ = ใช้+ยกเป็น memory · ไม่เจอ = ถามพร้อมบอกว่าค้นอะไร · อ่านบันทึกไม่ได้: `node tools/ask-guard/check.js --unverifiable-ok "เหตุผล"`
- ลิงก์/URL: ดู `~/.ols-qa-secrets/ols-secrets.md` → `references/ols-project-guide.md` → `references/*-guide.md` ก่อนถาม · ได้ค่าใหม่: placeholder ลง guide, ค่าจริงลง secrets
- กฎที่มีข้อยกเว้น อ่านให้จบทั้งข้อก่อนใช้ · คำตัวอย่าง (ประมาณว่า/ไรงี้/เช่น/e.g.) = template ไม่ใช่ข้อมูล ค่าที่วัดได้ต้องวัดเอง

## 4. Git / worktree ร่วม (git-staging-guard · pre-push)
- stage ระบุไฟล์ทีละตัว ห้าม `git add -A` / `.` / `<dir>/` / `commit -a` · ไฟล์ไม่ใช่ของเรา = ปล่อยไว้ (ห้ามลบ/stash/rebase ทับ)
- pre-push รันเทสต์บน commit ที่จะขึ้น · ห้าม `--no-verify` ทุกกรณี · กวาดของคนอื่นติดไป = ห้าม force-push ให้คอมมิตเสริม+เขียนเหตุในข้อความ
- งานยาว/ชนไฟล์ → `git worktree` ของตัวเองใต้ `.worktrees/` · push ตอนมีงานค้าง → worktree ชั่วคราว cherry-pick
- สคริปต์จาก git hook ที่รัน git ที่อื่น ต้อง source `scripts/git-env-clean.sh` + `git_env_clean` และยืนยัน `--show-toplevel`
- Pull main ก่อนเริ่มงาน · commit แบบ conventional (feat:/fix:/docs:) · แก้ `tools/**/*.js` ต้องเขียวก่อน commit + เพิ่ม test คู่กฎใหม่:

```bash
bash scripts/run-test-suites.sh
```

## 5. repo นี้ PUBLIC — ห้ามข้อมูลบริษัท
- ห้าม commit: password/token/key · อีเมลบัญชีจริง · host ภายใน · Sheet/Drive/Figma/Confluence/Jira-tenant id · Discord id · ชื่อลูกค้า/พนักงาน · `/Users/<name>` — รวม commit message · ใช้ `<ORG>` `{ISSUE_KEY}` `<QA_TRACKING_SHEET_ID>` ฯลฯ ค่าจริงอยู่ `~/.ols-qa-secrets/` เท่านั้น
- ลิงก์หลักฐานอยู่ในชีทเท่านั้น · secret หลุด = rewrite history + rotate + แจ้ง user ทันที · guard เป็นตาข่าย ไม่ใช่ใบอนุญาต
- `ols-qa` public · `helix` + `ols-qa-evidence` private (ถือเหมือน public) · เอกสารที่มีข้อมูลลูกค้าอยู่ `ols-qa-evidence` ห้ามย้ายกลับ
- helix sync: commit ไฟล์ร่วมใน `skills/` `references/` `commands/` → post-commit sync+deploy helix อัตโนมัติ · logic generic ลงไฟล์ร่วม โครงสร้าง OLS ลง guide เป็น placeholder · secret ใหม่: เติม `~/.helix-ols-denylist` → gen hash → `check-no-secrets.sh`

## 6. หลักฐาน / verdict
- หลักฐานต้องเป็นหน้าจอ FE จริงเท่านั้น: ห้าม JSON ดิบ · DevTools/console · terminal · โปรแกรมอื่น · หน้าว่าง/โหลดค้าง (ตรวจเฟรมสุดท้ายทุกคลิป) · แก้คลิปเดิมด้วย `cliptool.py` ก่อน ตัดเกิน 60% หรือเนื้อหาหายค่อยอัดใหม่ · ชื่อ test data แนว QA = ผ่าน · แถบ URL ที่ตัวอัดฉีด = ผ่าน (`WEB_ADDRESS` เลิกใช้ตัดสิน) · ไม่มีจอรองรับ = BLOCKED ถาม PO
- ผูกคลิปกับชีทได้ต่อเมื่อมี `<stem>.capture.json` ของตัวอัดสกิล + `verify-video.py` ผ่าน · ห้าม Playwright `recordVideo`
- รายงานสถานะจริง (BLOCKED/PWMI/FAILED/PASSED) · ปลายทางไม่มีสถานะนั้น → อ่าน dropdown จริงแล้วถาม ห้ามแมปเอง · `skipped` = `BLOCKED` ห้ามเขียนเป็นข้อจำกัด
- Priority/verdict ตาม [bug-priority-matrix](references/bug-priority-matrix.md) เท่านั้น: Lowest/Low/Medium → **PWMI** · High/Highest → **FAILED** · coverage gap ไม่ใช่ defect
- ก่อนส่งมอบ ไล่หัวข้อ "ข้อจำกัด" ทีละบรรทัด ทำเองได้ = ยังส่งไม่ได้

## 7. ห้ามเปิดบั๊กที่ไม่ใช่บั๊ก
- 🔴 **ห้ามเปิดบั๊ก/issue เองโดยอัตโนมัติ ถ้าเจ้าของงานไม่ได้สั่งก่อน เด็ดขาด** — เจอของที่คิดว่าผิด ให้รายงานในแชทพร้อมหลักฐาน แล้วถามว่าจะให้เปิดไหม ได้คำยืนยันสดจากเจ้าของงานเท่านั้นจึงเปิดได้ · ใช้กับทุกช่องทาง (Jira · GitHub issue · improvement) และทุก subagent
- บั๊ก = แอปต่างจากสเปก **ที่ยืนยันแล้ว** (Figma/PRD/AC/PO อ่าน char-exact ทั้ง 2 ฝั่ง) · ห้ามใช้คำทับศัพท์/ชื่อฟีเจอร์เป็น label · hedge ใน expected = หยุดไปยืนยัน · สเปกไม่ชัด = BLOCKED/ถาม PO
- ก่อนสรุปว่าเป็นบั๊ก ตรวจ 3 ชั้น: ticket ที่เกี่ยวข้องทุกคอมเมนต์ · ผล regression (`OLS: TC List (Lot1/Lot2)`) · โค้ดใน `ols-monorepo`
- STALE_ER (สเปกล้าสมัย) ใช้ 3 ชั้นเดียวกัน: ทุก ticket ทุกคอมเมนต์ + path:line ใน `ols-monorepo` origin/main → แก้ ER ในไฟล์ `(ALL)` ได้เลย ห้ามแตะ `(Only)` ห้ามทิ้งร่องรอย AI (ไม่มีหมายเหตุ/คำว่าแก้ไข/ชื่อเครื่องมือ) หลักฐานเก็บนอก repo · หลักฐานไม่พอ = ถาม PO · evidence ต้องมี ticket key + path:line
- เคสขัดกันเอง (guest แต่ต้อง login ฯลฯ) = แสดงจุดขัด+ข้อความเสนอ แล้วถามก่อนแก้ ห้าม PASSED · แก้ช่องใดของเคส ต้องอ่านทั้งแถว ความขัดที่เราทำให้เกิดต้องถาม
- blocker "รอ deploy" ต้องมาจาก `git tag --contains <commit>` เทียบประกาศ deploy ของ env ห้ามใช้สถานะ Jira · blocker บนบอร์ดเทียบ dossier ของเราก่อนเผยแพร่

## 8. Jira / Confluence

กฎทั้งหมดอยู่ใน [`docs/JIRA_CONFLUENCE.md`](docs/JIRA_CONFLUENCE.md) — กติกา Jira / Confluence · อ่านไฟล์นั้นก่อนแตะ Jira หรือ Confluenceทุกครั้ง

## 9. Environment / login / session

กฎทั้งหมดอยู่ใน [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — environment / login / session · อ่านไฟล์นั้นก่อนเข้าเว็บทดสอบหรือใช้บัญชีเทสทุกครั้ง

## 10. ข้อมูล / ไฟล์ที่ห้ามแตะ

กฎทั้งหมดอยู่ใน [`docs/DO_NOT_TOUCH.md`](docs/DO_NOT_TOUCH.md) — ข้อมูล/ไฟล์ที่ห้ามแตะ · อ่านไฟล์นั้นก่อนแก้หรือลบไฟล์ข้อมูลทุกครั้ง

## 11. Test data / ปก

กฎทั้งหมดอยู่ใน [`docs/TEST_DATA.md`](docs/TEST_DATA.md) — test data / ปก · อ่านไฟล์นั้นก่อนสร้างหรือแก้ test dataทุกครั้ง

## 12. Agent / เลน / บอร์ด

กฎทั้งหมดอยู่ใน [`docs/AGENT_BOARD.md`](docs/AGENT_BOARD.md) — กติกา agent / เลน / บอร์ด · อ่านไฟล์นั้นก่อน dispatch agent หรืออัปเดตบอร์ดทุกครั้ง

## 13. Discord / SFD

กฎทั้งหมดอยู่ใน [`docs/DISCORD_SFD.md`](docs/DISCORD_SFD.md) — กติกา Discord / SFD · อ่านไฟล์นั้นก่อนส่งโนติ Discord หรือแตะ SFDทุกครั้ง

## 14. โทน / ขอบเขต (global)
- คุย user ภาษาไทยสุภาพ เต็มประโยค ลงท้าย "ครับ" สั้น 2–5 บรรทัด ห้ามสั่ง/ห้าม user · ถามผ่าน AskUserQuestion ชุดละ ≤4 ข้อ ข้อแนะนำอยู่ข้อแรก
- ทำเฉพาะที่สั่ง · ติดตั้งถาวร (launchd/hook/profile/global config) หรือสร้างของใหม่ในระบบภายนอก = ถามก่อน · ห้ามใช้เงินองค์กร · staging ก่อน production
- skill/command files ภาษาอังกฤษ · link references แบบ relative ตามความลึกไฟล์ (WORKFLOW.md ใต้ deprecated ใช้ `../../../references/`)

## Architecture (ย่อ)
- `skills/helix/SKILL.md` router → `skills/<name>/SKILL.md` stub → `skills/deprecated/<name>/WORKFLOW.md` (ใช้งานจริง) · `commands/` · `references/` (routing: `skill-routing.md`; preamble; must-never; evidence gates; bug matrix)
- โค้ด: `tools/name-guard/` (scan อ่านอย่างเดียว exit 0/1/2 · write_guard · alert dedup) · `tools/retest-guard/` (กฎคอมเมนต์รีเทสอยู่ที่ `retest_rules.js` ที่เดียว) · `tools/portability/` · `scripts/check-no-secrets.sh` · CI `.github/workflows/tests.yml` · ไม่มี build, Node ≥18
- Hooks: SessionStart `inject-context.sh` · PreCompact `pre-compact.sh` · guards ใน `.claude/settings.json`

## Post-mortems
ดัชนีและสรุปทุกฉบับ (PM-001–PM-010, Report #0001 เป็นต้นไป): [`docs/post-mortem/README.md`](docs/post-mortem/README.md) และ `docs/CLAUDE-ARCHIVE.md` § Post-mortems — อ่านก่อนแตะ surface ที่เคยพลาด
