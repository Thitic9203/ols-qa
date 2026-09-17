# Post-Mortem Report #0063 — Helix sync read ols-qa's index when the commit came from a linked worktree

**ระบบ:** OLS QA workspace — ตัวส่ง skill จาก ols-qa เข้าปลั๊กอิน helix (`scripts/hooks/post-commit` → `scripts/sync-skills-to-helix.sh`)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** repo ols-qa · repo helix (ปลั๊กอินที่ใช้งานจริง)
**วันที่เกิดเหตุ:** 2026-09-17
**วันที่ค้นพบ:** 2026-09-17 (ข้อความ ABORT ตอน commit)
**วันที่จัดทำรายงาน:** 2026-09-17
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — ไม่มีข้อมูลเสียหาย แต่ skill ที่แก้ไม่ถึงปลั๊กอินที่ใช้งานจริงราว 29 นาที ข้อความของด่านบอกข้อเท็จจริงผิดและสั่งให้ stash/commit helix ที่สะอาดอยู่ และถ้าด่านนี้ผ่าน คำสั่ง git ที่เหลือของสคริปต์จะทำงานกับ ols-qa แทน helix
**ประเภท:** gate ที่วัดผิดที่ (เทียบคนละ repo) · workflow ที่เราตั้งไว้ส่งงานไม่สำเร็จ
**ผิดซ้ำจาก:** #0003 · #0006

---

## สรุปสั้น (Executive Summary)

- commit `ff42766` ทำจาก linked worktree ตัวส่งเข้า helix หยุดพร้อมรายงานว่า helix มีไฟล์ค้าง 3 ไฟล์ ทั้งที่ helix สะอาด
- git ส่ง `GIT_DIR` และ `GIT_INDEX_FILE` แบบ absolute ชี้เข้า ols-qa ให้ hook เมื่อ commit มาจาก linked worktree สคริปต์ `cd "$HELIX"` โดยไม่ล้างตัวแปรเหล่านี้ `git diff` จึงเทียบไฟล์ของ helix กับ index ของ ols-qa
- repo นี้เคยแก้ปัญหาคลาสเดียวกันใน `scripts/hooks/pre-push` ตั้งแต่ 2026-09-06 (commit `8e83464`) แต่ไม่ได้ไล่แก้ต่อที่เส้นทาง post-commit และสคริปต์ sync ไม่มีเทสต์เลย
- แก้แล้วด้วยตัวล้างตัวแปรจุดเดียว (`scripts/git-env-clean.sh`) ที่ทั้ง sync และ pre-push ใช้ร่วมกัน พร้อมยืนยันว่า git ชี้ helix จริงก่อนเขียน และแยกผล "ตรวจไม่ได้" ออกจาก "มีไฟล์ค้าง" มีเทสต์ใหม่ 5 ข้อที่พิสูจน์แล้วว่าล้มกับโค้ดก่อนแก้
- ส่ง skill ของ `ff42766` เข้า helix สำเร็จด้วยสคริปต์ที่แก้แล้ว (helix `d29132c` เวอร์ชัน 1.5.91)

## 1. ปัญหา (Problem Statement)

- ข้อความจริงตอน commit:
  - `sync: ⚠️ helix has uncommitted changes in references/qa-closing-shared.md` (และอีก 2 ไฟล์ของ commit เดียวกัน)
  - `sync: ❌ helix worktree dirty on target file(s) — ABORT (commit/stash helix first). NOTHING deployed.`
- ของจริง: ไฟล์ทั้ง 3 ใน helix มี blob เท่ากับ HEAD ของ helix (`66d9c91` · `0b056fe` · `4dabd14`) ไม่ใช่เนื้อใหม่ (`4332e2d` · `27392c0` · `f0fa830`) และ `git status --porcelain` ของ helix = 0 บรรทัด

**สิ่งที่ควรจะเป็น:** commit ที่แก้ไฟล์ skill ร่วม ต้องส่งเข้า helix ได้ไม่ว่าจะทำจาก checkout หลักหรือจาก worktree และด่านไฟล์ค้างต้องรายงานเฉพาะสิ่งที่วัดได้จริงใน helix — CLAUDE.md แนะนำให้แยก `git worktree` สำหรับงานยาว เส้นทางนี้จึงเป็นเส้นทางปกติ ไม่ใช่กรณีพิเศษ

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+07) | เหตุการณ์ | หลักฐาน |
|---|---|---|
| 2026-09-06 15:07 | pre-push เริ่มล้าง `GIT_DIR` และตัวแปรพวกเดียวกันก่อนรันชุดเทสต์ เส้นทาง post-commit ไม่ได้รับการแก้ตาม | commit `8e83464` · `scripts/hooks/pre-push` คอมเมนต์เหนือบรรทัดที่รันชุดเทสต์ |
| 2026-09-17 09:31 | สร้าง worktree `.worktrees/conflict-check` จาก `origin/main` | reflog ของ branch |
| 09:38:59 | commit `ff42766` จาก worktree → post-commit เรียก sync → ABORT ด้วยข้อความในข้อ 1 | ผลของ post-commit |
| 09:39 | push ols-qa สำเร็จ (`f4d2582..ff42766`) แต่ helix ยังไม่ได้รับการเปลี่ยนแปลง | ผลของ `git push` |
| 09:41:46 | ผู้ช่วยสืบสาเหตุยืนยันว่า helix สะอาด | `helix-sync-debug.log` (โฟลเดอร์งานนอก repo) |
| 09:45:43 | ยืนยันว่า blob ใน helix เท่ากับ HEAD ของ helix ไม่ใช่ `ff42766` | log เดียวกัน · ตรวจซ้ำในเธรดหลัก |
| 09:52 | ทำซ้ำใน repo จำลองด้วยสคริปต์และ hook ตัวจริง: checkout หลักผ่าน · worktree ล้มข้อความเดียวกัน | ภาคผนวก |
| หลัง 09:56 ก่อน 10:04 | เจ้าของงานอนุมัติทางแก้ · เทสต์ใหม่รันกับโค้ดเดิม ผ่าน 1 ล้ม 4 | ผลรัน `tools/helix-sync/sync_env.test.js` |
| 10:06 | แก้แล้ว ชุดทดสอบทั้งหมดผ่าน 34 ชุด | `bash scripts/run-test-suites.sh` |
| 10:07:41 | ส่ง 3 ไฟล์ของ `ff42766` เข้า helix สำเร็จ | helix `d29132c` · blob บน HEAD และ origin ตรง `ff42766` |

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

- git ส่งตัวแปรของ repo ที่ hook ทำงานอยู่ให้ hook เสมอ วัดจริงด้วย hook ที่พิมพ์ `env` (git 2.53.0):
  - commit จาก checkout หลัก → มีแค่ `GIT_INDEX_FILE=.git/index` (relative) ซึ่งหลัง `cd "$HELIX"` ชี้ index ของ helix เอง จึงทำงานถูก
  - commit จาก linked worktree → `GIT_DIR=<ols-qa>/.git/worktrees/<name>` และ `GIT_INDEX_FILE=<ols-qa>/.git/worktrees/<name>/index` (absolute)
- `scripts/hooks/post-commit` เรียก `sync-skills-to-helix.sh` ต่อโดยไม่ล้างตัวแปร สคริปต์ `cd "$HELIX"` แล้วรัน `git` ธรรมดาทุกคำสั่งหลังจากนั้น (diff · pull · reset · checkout · add · commit · push) โดยไม่มีบรรทัดใดล้างตัวแปรหรือยืนยันว่า git ชี้ repo ไหน
- ผล: `git diff --quiet -- <file>` เทียบ index ของ ols-qa worktree (เนื้อใหม่) กับไฟล์ใน helix (เนื้อเก่า) ทุกไฟล์ที่ commit นั้นแก้และมีอยู่ใน helix จึงถูกรายงานว่า "ค้าง"
- ความผิดพลาดชั้นที่สองในด่านเดียวกัน: `2>/dev/null` ร่วมกับ `if !` ทำให้ git error ทุกชนิด (เช่นรหัส 128) ถูกนับเป็น "มีไฟล์ค้าง" ด่านจึงไม่มีสถานะ "ตรวจไม่ได้" (บทเรียนเดียวกับ #0005)

### 5 Whys

1. **ทำไม skill ไม่ถึง helix?** — ด่านไฟล์ค้างของสคริปต์ sync ยกเลิกการส่ง
2. **ทำไมด่านบอกว่าค้างทั้งที่ helix สะอาด?** — `git diff` หลัง `cd "$HELIX"` ไม่ได้อ่าน helix แต่อ่าน index ของ ols-qa ที่ hook ได้รับมาทาง `GIT_DIR`/`GIT_INDEX_FILE`
3. **ทำไมตัวแปรชี้เข้า ols-qa?** — git ส่ง path แบบ absolute ให้ hook เมื่อ commit มาจาก linked worktree และสคริปต์ไม่เคยล้างมัน เพราะเส้นทางที่เคยใช้จริงคือ checkout หลัก ซึ่งตัวแปรแบบ relative บังเอิญชี้ถูก
4. **ทำไมไม่มีอะไรจับได้ก่อน?** — สคริปต์ sync ไม่มีเทสต์เลย (ค้น `sync-skills-to-helix` ใน `tools/` ได้ 0 ไฟล์) และไม่มีอะไรทดสอบการ commit จาก linked worktree
5. **ทำไมบั๊กคลาสนี้ยังอยู่ ทั้งที่เคยแก้แล้ว?** — การแก้เมื่อ 2026-09-06 ทำเฉพาะไฟล์ที่อาการโผล่ (ตัวรันเทสต์ใน pre-push) ไม่ได้ไล่หาสคริปต์อื่นที่ hook เรียกแล้วไปรัน git ที่อื่น และสองเส้นทางไม่มีอะไรผูกให้ใช้วิธีเดียวกัน — ตรงกับบทเรียน #0003 (ปิดจุดเดียวไม่ใช่การปิดคลาส) และ #0006 (ของ 2 ชิ้นที่ทำหน้าที่เดียวกันต้องผูกกัน)

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- pre-commit (secret guard · หนี้ post-mortem) ไม่ได้ดูพฤติกรรม sync
- pre-push และ CI รันชุดเทสต์ ซึ่งไม่มีชุดไหนแตะ sync
- ตัวด่านของ sync เองทำงานแบบ fail-closed จึงหยุดได้ แต่รายงานเหตุผิด และมีคำแนะนำที่ทำให้คนไปแก้ helix ที่ไม่มีอะไรผิด

## 4. ผลกระทบ (Impact)

- skill ขั้นตรวจ ticket ที่ขัดแย้งกันขึ้น `main` ตอน 09:39 แต่ถึงปลั๊กอินที่ใช้งานจริงตอน 10:07:41 ช้าไปราว 29 นาที
- ข้อความ ABORT สั่งให้ stash/commit helix ที่สะอาด — ไม่มีใครทำตาม จึงไม่มีความเสียหาย
- ความเสี่ยงที่แฝงอยู่: ถ้าด่านนี้ผ่าน (เช่น helix มีเนื้อเดียวกันอยู่แล้ว) คำสั่ง `pull` · `add` · `commit` · `push` จะทำงานกับ ols-qa แทน helix — ทดลองกรณีนั้นใน repo จำลองแล้ว `git pull --rebase` ถูกยิงใส่ ols-qa และล้ม ไม่มีอะไรถูกเขียน **กรณีอื่นยังไม่ได้ทดลอง**
- ไม่มีข้อมูลเสียหายใน ols-qa หรือ helix — ยืนยันด้วย blob ids และ `git status` ของทั้งสอง repo

## 5. แนวทางการแก้ไข (Fix)

- `scripts/git-env-clean.sh` (ใหม่) — ฟังก์ชัน `git_env_clean` ล้างตัวแปรตามรายการที่ git ประกาศเอง (`git rev-parse --local-env-vars` 15 ตัว) คืนค่าไม่เป็นศูนย์เมื่อถาม git ไม่ได้
- `scripts/sync-skills-to-helix.sh` — source และเรียก `git_env_clean` ก่อนคำสั่ง git แรก · หลัง `cd "$HELIX"` ยืนยันว่า `git rev-parse --show-toplevel` คือ helix ก่อนเขียน ไม่ตรง = หยุด · ด่านไฟล์ค้างแยกรหัส 1 (มีความต่าง) ออกจากรหัสอื่น (ตรวจไม่ได้ = หยุดพร้อมบอกตรงๆ)
- `scripts/hooks/pre-push` — ใช้ `git_env_clean` ตัวเดียวกันแทนรายการ `env -u` ที่เขียนเอง 8 ตัว และปฏิเสธ push ถ้าล้างตัวแปรไม่ได้
- `tools/helix-sync/sync_env.test.js` (ใหม่ 5 ข้อ) และปรับข้อเดิมใน `tools/push-gate/pre_push.test.js` ให้ตรึงตัวล้างตัวเดียวกัน
- ส่ง 3 ไฟล์ของ `ff42766` เข้า helix ด้วยสคริปต์ที่แก้แล้ว

**ยืนยันแล้วด้วย:**
- `node tools/helix-sync/sync_env.test.js` → `all 5 passed`
- เทสต์ชุดเดียวกันรันกับสคริปต์ก่อนแก้ (worktree แยกที่ `ff42766`) → `4 of 5 FAILED` โดยข้อควบคุม (commit จาก checkout หลัก) ผ่าน — เทสต์แยกโค้ดถูกและผิดได้จริง
- `bash scripts/run-test-suites.sh` → `เขียวครบ 34 ชุด`
- deploy: helix `d29132c` เวอร์ชัน 1.5.91 · blob ทั้ง 3 ไฟล์บน HEAD และ origin/main ของ helix = `4332e2d` · `27392c0` · `f0fa830` ตรงกับ `ff42766` · helix dirty 0

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

- **ผูกสองเส้นทางด้วยของชิ้นเดียว** — post-commit sync และ pre-push ใช้ `git_env_clean` ตัวเดียวกัน และเทสต์ข้อ 5 ของชุดใหม่ล้มทันทีถ้าไฟล์ใดเลิกใช้
- **ยืนยันตัวตนของ repo ก่อนเขียน** — ถ้าวันหน้ามีตัวแปรหรือกลไกใหม่พาไปผิด repo อีก สคริปต์จะปฏิเสธแทนที่จะทำงานเงียบๆ
- **สถานะที่ 3 "ตรวจไม่ได้"** — git error ไม่ถูกรายงานเป็นไฟล์ค้างอีก (เทสต์ข้อ 3)
- **ไล่หาคลาสเดียวกันในรอบนี้ พร้อมตัวเลข** — ไฟล์ใน `scripts/` · `tools/` · `.claude/hooks/` ที่เรียก git มี 15 ไฟล์ · เข้าข่าย `cd`/`-C` ไปที่อื่น 4 ไฟล์ · ได้รับผลจริง 1 ไฟล์ (sync) · `scripts/list-test-suites.sh` ทดลองภายใต้ตัวแปรแบบ hook ได้ผลตรงกัน 33 ชุด (md5 เดียวกัน) · `scripts/setup-hooks.sh` และ `.claude/hooks/inject-context.sh` ไม่ได้ถูก git hook เรียก

**กฎที่เพิ่มจากเหตุนี้:** สคริปต์ใดที่ git hook เรียกแล้วไปรัน git กับ repo หรือโฟลเดอร์อื่น ต้อง source `scripts/git-env-clean.sh` และเรียก `git_env_clean` ก่อนคำสั่ง git แรก และต้องยืนยันว่า `git rev-parse --show-toplevel` คือ repo ปลายทางก่อนเขียน — ตรึงด้วย `tools/helix-sync/sync_env.test.js` · สรุปไว้ใน `CLAUDE.md` หัวข้อ Post-mortems (Report #0063) · และข้อความของด่านต้องบอกเฉพาะสิ่งที่วัดได้ ห้ามสั่งให้ผู้อ่านแก้สิ่งที่ด่านยังไม่ได้ยืนยัน

## 7. การตรวจจับปัญหา (Detection)

- ตรวจพบจากข้อความ ABORT ของ post-commit ในเทิร์นเดียวกับที่ commit
- ยืนยันว่าเป็นผลบวกลวงโดยเทียบ blob id ของ helix กับ `ff42766` (ผู้ช่วยสืบ และเธรดหลักตรวจซ้ำเอง)
- ยืนยันสาเหตุโดยทำซ้ำใน repo จำลองด้วยสคริปต์และ hook ตัวจริง และรันแบบอ่านอย่างเดียวบน repo จริงภายใต้ตัวแปรแบบ hook
- ช่องว่าง: ก่อนหน้านี้ไม่มีอะไรตรวจการ commit จาก worktree เลย ปัญหาจึงโผล่เมื่อมีคนใช้เส้นทางนั้นจริงเท่านั้น

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี

- ด่านทำงานแบบ fail-closed จึงไม่มีการเขียนผิด repo เกิดขึ้น
- ทำงานใน worktree แยก และสืบแบบอ่านอย่างเดียว ไม่แตะ helix ระหว่างสืบ
- พิสูจน์ว่าเทสต์ใหม่ล้มกับโค้ดเดิมก่อนเชื่อว่ามันจับได้

### สิ่งที่ต้องปรับปรุง

- การแก้ปัญหาคลาสหนึ่ง ต้องไล่หาทุกที่ที่เป็นคลาสเดียวกันในรอบเดียวกัน — เมื่อ 2026-09-06 แก้แค่ pre-push
- สคริปต์ที่ hook เรียกและเขียนไปที่ repo อื่น ต้องมีเทสต์ตั้งแต่วันแรก โดยเฉพาะเส้นทางจาก worktree ที่ CLAUDE.md แนะนำให้ใช้
- ข้อความของด่านต้องไม่ยืนยันข้อเท็จจริงที่ไม่ได้วัด ("helix has uncommitted changes") และไม่ควรแนะนำการกระทำจากข้อเท็จจริงนั้น

## 9. Action Items

| # | งาน | ผู้รับผิดชอบ | สถานะ |
|---|---|---|---|
| 1 | ตัวล้างตัวแปรจุดเดียว + แก้ sync + ผูก pre-push + เทสต์ | Claude | DONE (commit ที่ถือรายงานนี้) |
| 2 | ส่ง 3 ไฟล์ของ `ff42766` เข้า helix และตรวจ blob | Claude | DONE — helix `d29132c` |
| 3 | ตัดสินว่าจะตั้ง `core.hooksPath` เป็นแบบ relative (ตามที่ `scripts/setup-hooks.sh` เขียนไว้) หรือไม่ — ตอนนี้ `.git/config` เก็บ path แบบ absolute worktree ทุกตัวจึงรัน hook ของ checkout หลัก (ตรวจแล้วว่าไฟล์เหมือนกันในวันนี้) | เจ้าของงาน | OPEN |

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `scripts/git-env-clean.sh` (ใหม่)
- `scripts/sync-skills-to-helix.sh`
- `scripts/hooks/pre-push`
- `tools/helix-sync/sync_env.test.js` (ใหม่)
- `tools/push-gate/pre_push.test.js`
- `docs/post-mortem/PENDING.md` · `docs/post-mortem/README.md` · `CLAUDE.md`

**Commit:** commit ที่ถือรายงานนี้ (ต่อจาก `ff42766` บน `main`) · helix `d29132c`

**หลักฐาน:**

ตัวแปรที่ git ส่งให้ hook (repo จำลอง, path ย่อเป็น `<S>`):

```
checkout หลัก : GIT_INDEX_FILE=.git/index
linked worktree: GIT_DIR=<S>/olsqa/.git/worktrees/wt2  GIT_INDEX_FILE=<S>/olsqa/.git/worktrees/wt2/index
```

ผลทำซ้ำใน repo จำลอง (สคริปต์ sync และ post-commit ตัวจริง):

```
s1 checkout หลัก : sync: ✅ pushed helix (deployed).
s2 linked worktree: sync: ⚠️ helix has uncommitted changes in references/qa-closing-shared.md
                    sync: ❌ helix worktree dirty on target file(s) — ABORT (commit/stash helix first). NOTHING deployed.
s3 worktree + helix มีเนื้อเดียวกันอยู่แล้ว: 'git pull --rebase origin main' failed … · helix already up to date — nothing to commit
```

repo จริง อ่านอย่างเดียว (`git --no-optional-locks diff --quiet` ใน helix):

```
references/qa-closing-shared.md                        ตัวแปรแบบ hook rc=1 · สภาพแวดล้อมปกติ rc=0
skills/deprecated/retest-bug-workflow/WORKFLOW.md      ตัวแปรแบบ hook rc=1 · สภาพแวดล้อมปกติ rc=0
skills/deprecated/testing-ticket-workflow/WORKFLOW.md  ตัวแปรแบบ hook rc=1 · สภาพแวดล้อมปกติ rc=0
references/shared-must-never.md (ไฟล์ควบคุม เนื้อเท่ากัน) ตัวแปรแบบ hook rc=0 · สภาพแวดล้อมปกติ rc=0
```
