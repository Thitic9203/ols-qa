# Post-Mortem Report #0051 — CI ของ repo แดงต่อเนื่อง 5 วันเพราะเทสต์สร้าง commit โดยไม่ตั้ง git identity

**ระบบ:** OLS QA workspace — `.github/workflows/tests.yml` (job `node-tests`) และ `tools/push-gate/pre_push.test.js`
**สภาพแวดล้อมที่ได้รับผลกระทบ:** GitHub Actions CI ของ repo `ols-qa` เอง — ไม่กระทบ OLS environment ใดๆ
**วันที่เกิดเหตุ:** 2026-09-06 (คอมมิต `8e83464`, 08:08:45 UTC — รันแรกที่แดงหลังคอมมิตนี้)
**วันที่ค้นพบ:** 2026-09-11
**วันที่จัดทำรายงาน:** 2026-09-11
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** High — CI ของทั้ง repo แดงต่อเนื่อง 28 จาก 30 รอบล่าสุด (ประมาณ 5 วัน) โดยไม่มีใครรู้ตัว ทำให้ PR ทุกใบที่เปิดในช่วงนี้ขึ้นสถานะ check ล้มเหลว รวมถึง PR ที่กำลังส่งงานจริงของ session นี้ด้วย
**ประเภท:** เฟลเงียบ — gate ที่ตั้งใจป้องกัน (`.github/workflows/tests.yml`) แดงเองแล้วไม่มีใครสังเกต
**ผิดซ้ำจาก:** ไม่ตรงกับรายงานฉบับใดตรงๆ แต่เป็นคลาสเดียวกับ #0002/#0003 (โค้ดที่ทำงานถูกในสภาพแวดล้อมหนึ่งแล้วเงียบ/พังในอีกสภาพแวดล้อมหนึ่งโดยไม่มีใครสังเกต) — ที่นี่คือ "เครื่อง dev มี global git config เสมอ กับ CI runner สดไม่มี"

---

## สรุปสั้น (Executive Summary)

ระหว่างตรวจสถานะ PR #2 (งานแก้บั๊ก post-mortem ledger parser ของ session นี้เอง) พบว่า GitHub Actions job `node-tests` ขึ้น `FAILURE` ทั้งที่รันชุดเทสต์ในเครื่องแล้วผ่านครบ 31/31 ก่อนพุช ไล่ดูประวัติ workflow บน `main` พบว่า**แดงต่อเนื่องมาตั้งแต่คอมมิต `8e83464` (2026-09-06)** คือ 28 จาก 30 รอบล่าสุด ไม่เกี่ยวกับ diff ของ session นี้เลย สาเหตุคือฟังก์ชัน `commitWithNoSuites()` ใน `tools/push-gate/pre_push.test.js` เรียก `git commit-tree` สร้าง commit ชั่วคราวสำหรับทดสอบ โดยไม่เคยระบุ `user.name`/`user.email` — พึ่งพา global git config ที่มีอยู่บนเครื่อง dev ทุกเครื่องแต่ไม่มีบน GitHub Actions runner ที่เป็นเครื่องสดทุกครั้ง ทำซ้ำยืนยันได้ตรงกันเป๊ะในเครื่องตัวเองด้วยการรันคำสั่งเดียวกันโดยลบ `HOME` แก้แล้วด้วยการระบุ identity แบบ `-c` เฉพาะการเรียกครั้งนั้น ไม่แตะ config ของใครเลย ยืนยันผ่านทั้งในสภาพแวดล้อมปกติและสภาพแวดล้อมจำลองแบบ CI (ไม่มี global git config)

---

## 1. ปัญหา (Problem Statement)

- PR #2 (`https://github.com/Thitic9203/ols-qa/pull/2`) ขึ้น `mergeStateStatus: UNSTABLE`, `statusCheckRollup` ของ `node-tests` = `FAILURE`
- log ของ job แสดง `FAIL  the hook refuses a commit whose tree contains no test file at all -> Command failed: git commit-tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904 -p 06d87a829ead0c66f71a1d3f18e1a734cfc1b531 -m fixture: a tree with no test suite` พร้อมข้อความ `fatal: empty ident name (for <runner@runnervm...internal.cloudapp.net>) not allowed`
- ประวัติ `gh run list --branch main --workflow tests.yml --limit 30`: **30 รอบล่าสุด มี 28 รอบ conclusion = failure, 2 รอบ conclusion = success** — 2 รอบที่ผ่านคือ 2 รอบแรกสุด (`e455061`, `12fdccb`, 2026-09-06 07:27/07:44 UTC) ก่อนคอมมิต `8e83464` (08:08:45 UTC) ซึ่งเป็นรอบแรกที่แดง และแดงต่อเนื่องทุกรอบนับจากนั้นจนถึงตอนตรวจ (2026-09-11)
- `git show 8e83464 -- tools/push-gate/pre_push.test.js` ยืนยันว่าคอมมิตนี้คือคอมมิตที่เปลี่ยน `commitWithNoSuites()` จากการอ้างอิง historical sha คงที่ (ซึ่งข้ามตัวเองเมื่อ clone แบบ shallow) มาเป็นสร้าง commit สดด้วย `git commit-tree` โดยใช้ `git rev-parse HEAD` เป็น parent — **แก้ปัญหา shallow-clone ได้จริง แต่ไม่เคยเพิ่ม identity ให้ commit ที่สร้างขึ้นมาใหม่**

**สิ่งที่ควรจะเป็น:** `.github/workflows/tests.yml` ต้องเขียว (หรือถ้าแดงต้องมีคนเห็นและแก้ทันที) — ตรงตามที่คอมเมนต์หัวไฟล์ของ workflow เองเขียนไว้ว่า "A gate whose tests only run by hand is a gate that erodes quietly" ซึ่งกลายเป็นคำทำนายที่เกิดขึ้นจริงกับตัว workflow เอง

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-09-06 07:27–07:44 UTC | `node-tests` เขียว 2 รอบสุดท้าย (`e455061`, `12fdccb`) |
| 2026-09-06 08:08:45 UTC (คอมมิต `8e83464`) | `commitWithNoSuites()` เปลี่ยนมาสร้าง commit สดผ่าน `git commit-tree` โดยไม่ใส่ identity — **รอบนี้คือรอบแรกที่แดง** |
| 2026-09-06 ถึง 2026-09-11 | แดงต่อเนื่อง 28 จาก 30 รอบ ไม่มีใครสังเกต (ไม่มีการแจ้งเตือนใดๆ ผูกกับ workflow นี้ในตอนนั้น) |
| 2026-09-11 | Session นี้เปิด PR #2 (งานอื่น ไม่เกี่ยวกับบั๊กนี้) แล้วเข้าไปเช็คสถานะสดของ PR พบ `FAILURE` |
| 2026-09-11 | เรียก `superpowers:systematic-debugging` ดึง log job เต็ม หา test/บรรทัดที่ล้มจริง อ่านซอร์ส `commitWithNoSuites()` |
| 2026-09-11 | ทำซ้ำสาเหตุในเครื่องตัวเอง (`HOME` ว่าง + ไม่มี env identity) ได้ error message ตรงกับ CI เป๊ะ |
| 2026-09-11 | ยืนยันด้วย `gh run list` ว่าแดงมาแล้ว 28/30 รอบ ตั้งแต่ `8e83464` — ไม่เกี่ยวกับ diff ของ session นี้ |
| 2026-09-11 | รายงานเจ้าของงาน 4 หัวข้อ ได้รับคำสั่งให้แก้ใน PR เดียวกัน + log เป็น post-mortem |
| 2026-09-11 | แก้ `commitWithNoSuites()` ให้ระบุ identity แบบ `-c` เฉพาะการเรียกครั้งนั้น ยืนยันผ่านทั้งสภาพแวดล้อมปกติและสภาพแวดล้อมจำลอง CI |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไม CI ถึงแดง?** — เพราะ `git commit-tree` ใน `commitWithNoSuites()` ล้มด้วย `fatal: empty ident name … not allowed`
2. **ทำไม `git commit-tree` ถึงล้ม?** — เพราะไม่มีการระบุ `user.name`/`user.email` ให้คำสั่งนี้เลย ไม่ว่าจะผ่าน `-c` flag, env var, หรือ local git config ของ repo — คำสั่งจึงต้องพึ่ง **global** git config ของเครื่องที่รันอยู่
3. **ทำไมพึ่ง global config ถึงพังเฉพาะบน CI?** — เพราะเครื่อง dev ทุกเครื่อง (รวมเครื่องของทุกคนที่เคยรันเทสต์นี้ก่อนหน้า) มี `~/.gitconfig` ตั้ง identity ไว้อยู่แล้วโดยธรรมชาติ (จำเป็นสำหรับการทำงาน git ทั่วไปทุกวัน) แต่ runner ของ GitHub Actions (`ubuntu-latest`) เป็นเครื่องที่สร้างใหม่ทุกครั้งไม่มี `~/.gitconfig` ใดๆ เลย เว้นแต่ workflow จะตั้งเอง — `.github/workflows/tests.yml` ไม่เคยตั้ง global git identity ไว้เลย
4. **ทำไมไม่มีใครทดสอบเงื่อนไขนี้ก่อนคอมมิต `8e83464`?** — เพราะการแก้ครั้งนั้นมีเป้าหมายเฉพาะเจาะจงคือแก้ปัญหา shallow-clone (บทเรียนที่คอมเมนต์ในไฟล์เขียนไว้เองว่า "the one behavioural case pinning report #0006 printed (skipped — shallow clone) and the suite went green in the exact environment it was meant to protect") — แก้ปัญหานั้นได้จริง แต่การแก้ (เปลี่ยนจาก sha คงที่ มาเป็นสร้าง commit สดด้วยมือ) เปิดช่องใหม่ (ต้องมี identity) ที่ไม่เคยมีมาก่อน (การอ้างอิง sha คงที่แบบเดิมไม่เคยต้องสร้าง object ใหม่ จึงไม่เคยต้องมี identity) และไม่มีใครทดสอบเงื่อนไข "รันบนเครื่องที่ไม่มี global git config" ซึ่งเป็นเงื่อนไขเดียวกับที่การแก้ครั้งนั้นตั้งใจจะจำลอง (CI) แต่กลับทดสอบแค่ "clone แบบ shallow" อย่างเดียว ไม่ได้ทดสอบ "ไม่มี git identity" ไปด้วย
5. **root cause จริง — การแก้บั๊กหนึ่ง (shallow clone) ไม่ได้ตรวจสอบเงื่อนไขแวดล้อมอื่นๆ ที่ CI ต่างจากเครื่อง dev ไปด้วยพร้อมกัน** ทั้งที่ทั้งสองเงื่อนไข (ไม่มีประวัติเต็ม / ไม่มี git identity) เป็นความต่างแบบเดียวกันระหว่าง "เครื่อง dev ที่ตั้งค่าไว้นานแล้ว" กับ "CI runner ที่เกิดใหม่ทุกครั้ง" — แก้อย่างหนึ่งแล้วไม่ได้ถามว่า "ยังมีอะไรอีกที่ CI ไม่มีแต่เครื่อง dev มี"

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** ไม่มีกลไกใดใน repo แจ้งเตือนเมื่อ GitHub Actions workflow แดง — `.github/workflows/tests.yml` เป็นเพียง CI check ที่แสดงผลบนหน้า PR/commit เท่านั้น ไม่มีการแจ้งเตือนเชิงรุก (ไม่มี Discord notify, ไม่มี SFD-style watcher) ผูกกับ workflow run status ของ GitHub Actions เอง ต่างจาก workflow อื่นๆ ที่เกี่ยวกับ OLS QA (bugmirror, session-keepalive ฯลฯ) ที่มี SFD (Silent-Failure Defense) 8 ชั้นครอบอยู่ — `.github/workflows/tests.yml` **ไม่เคยถูกนับเป็นส่วนหนึ่งของระบบ SFD เลย** ทั้งที่มันคือ workflow ตามตารางเช่นกัน (ทุก push/PR) และเป็นตัวอย่างตรงเป้าที่สุดของสิ่งที่ SFD มีไว้ป้องกัน

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — เป็น CI ภายใน repo เท่านั้น |
| เจ้าของงาน | ทุก PR ที่เปิดในช่วง 2026-09-06 ถึง 2026-09-11 (รวม PR #2 ของ session นี้) ขึ้นสถานะ check ล้มเหลวบนหน้า GitHub โดยไม่มีเหตุผลที่แท้จริงเกี่ยวกับเนื้องาน — สร้างความสับสนว่า diff มีปัญหาทั้งที่ไม่มี |
| ข้อมูล / ระบบ | ไม่มีข้อมูลเสียหาย เป็นแค่สถานะ check บน GitHub |
| ความเชื่อถือของงานรอบนั้น | ทุก PR ที่ถูกสร้างในช่วง 5 วันนี้ต้องถูกพิจารณาว่า CI check ของมันไม่ได้สะท้อนคุณภาพ diff จริง — ต้องแยกแยะว่าล้มเพราะ `pre_push.test.js` เคสนี้ หรือล้มเพราะปัญหาจริงในโค้ดของ PR นั้นๆ (ยังไม่ได้ไล่ตรวจ PR อื่นทั้งหมดในช่วงนี้ — อยู่นอกขอบเขตงานที่ได้รับอนุมัติให้แก้ในรอบนี้) |

---

## 5. แนวทางการแก้ไข (Fix)

- `tools/push-gate/pre_push.test.js` — `commitWithNoSuites()` เพิ่ม `-c user.email=... -c user.name=...` เฉพาะการเรียก `git commit-tree` ครั้งนั้น ไม่แตะ config ของ repo จริงทั้ง local และ global เลย
- ตรวจสอบแล้วว่าเป็นจุดเดียวในทั้ง `tools/` ที่มีปัญหานี้: `grep -rn "commit-tree" tools/` เจอไฟล์นี้ไฟล์เดียว และไฟล์อื่นที่เรียก `git commit` (เช่น `pre_commit.test.js`, `whose_change.test.js`) ทำงานภายใน sandbox ของตัวเอง (`cwd: dir`) ที่ตั้ง `user.email`/`user.name` ไว้แล้วตั้งแต่ `git init` — ยืนยันว่าทั้ง 2 ไฟล์นั้นผ่าน CI จริงในรันเดียวกันที่ `pre_push.test.js` ล้ม
- **ยืนยันแล้วด้วย:**
  - รัน `node tools/push-gate/pre_push.test.js` ปกติ → ผ่านครบ
  - จำลองสภาพแวดล้อม CI ในเครื่องตัวเอง (`HOME` ชี้ไปโฟลเดอร์ว่าง + ลบ env identity ทั้งหมด) แล้วรันไฟล์เดิม → **ผ่านครบทุกเคสรวมเคสที่เคยล้ม** (ก่อนแก้เคสนี้ล้มด้วยข้อความ error เดียวกับที่ CI แสดงเป๊ะ)
  - `bash scripts/run-test-suites.sh` → เขียวครบ 31 ชุด
  - `node tools/postmortem-guard/check.js` → `structure clean — 50 report(s), 51 ledger row(s), 1 open.`

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | `commitWithNoSuites()` ระบุ git identity แบบ scoped ต่อคำสั่ง ไม่พึ่ง global config | เครื่องมือ (เทสต์) | ทำแล้ว |
| P2 | ไล่ตรวจว่ามีจุดอื่นในโค้ดเทสต์ที่เรียก `git commit-tree`/`git commit` แบบพึ่ง global config หรือไม่ (ไม่ใช้ sandbox ของตัวเอง) — พบแค่จุดนี้จุดเดียว | ตรวจสอบ | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** *เมื่อแก้บั๊กที่เกิดจากความต่างระหว่างเครื่อง dev กับ CI runner (เช่น shallow clone) ต้องถามต่อว่า "ยังมีความต่างอื่นอีกไหมระหว่างสองสภาพแวดล้อมนี้ ที่การแก้รอบนี้อาจไปพึ่งพาเข้าโดยไม่ตั้งใจ"* — โดยเฉพาะ **git identity** ซึ่งมีอยู่บนเครื่อง dev ทุกเครื่องเสมอแต่ไม่มีบน CI runner สดเลย เป็นความต่างคลาสเดียวกับ shallow-clone (ของที่ "มีอยู่แล้วตามธรรมชาติ" บนเครื่อง dev จนไม่มีใครคิดว่าต้องตั้งเอง) — เทสต์ใดก็ตามที่เรียก git plumbing command ซึ่งสร้าง object ใหม่ (commit-tree, commit) ต้องระบุ identity ของตัวเองเสมอ ไม่ว่าจะทำงานใน sandbox ของตัวเองหรือกับ repo จริงก็ตาม **ยังไม่มีมาตรการที่ทำให้ CI แดงถูกสังเกตเร็วกว่านี้ในรอบนี้** (ดูหัวข้อ Action Items — เป็นงานที่เกินขอบเขตที่ได้รับอนุมัติให้แก้ในรอบนี้ ต้องถามเจ้าของงานแยกต่างหาก)

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** Session นี้จับได้เองโดยบังเอิญ ระหว่างเช็คสถานะ PR ของงานอื่น (`gh pr view 2 --json ... statusCheckRollup`) ไม่ใช่จากการแจ้งเตือนใดๆ ของระบบ
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** จากรอบแรกที่แดง (2026-09-06 08:08:45 UTC) จนถึงตอนพบ (2026-09-11) ≈ 5 วัน ระหว่างนั้นแดงต่อเนื่อง 28 รอบ ไม่มีใครสังเกตแม้แต่ครั้งเดียว
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** ยังไม่มี — ต้องคุยกับเจ้าของงานแยกว่าจะเพิ่มการแจ้งเตือนสำหรับ `.github/workflows/tests.yml` เอง (เช่น ผูกเข้า SFD หรือใช้ GitHub's own branch-protection/notification) หรือไม่ เพราะเป็นงานที่อยู่นอกขอบเขตของรอบนี้

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ตรวจสถานะ PR สดก่อนสรุปว่างาน "เสร็จ" แทนที่จะเชื่อผลเทสต์ในเครื่องอย่างเดียว — ถ้าไม่เช็คสถานะสดของ PR รอบนี้ จะไม่มีใครรู้ว่า CI แดงมา 5 วันแล้ว
- ทำซ้ำ root cause ในเครื่องตัวเอง (จำลองสภาพแวดล้อม CI ด้วย `HOME` ว่าง) แทนการเดาจาก error message อย่างเดียว ทำให้มั่นใจว่าแก้ถูกจุดจริงก่อนพุช

### สิ่งที่ต้องปรับปรุง
- `.github/workflows/tests.yml` เป็น gate สำคัญของทั้ง repo แต่ไม่มีกลไกแจ้งเตือนเชิงรุกใดๆ เลยเมื่อมันแดง ต่างจาก workflow อื่นที่มี SFD ครอบ — ควรพิจารณาว่าจะขยาย SFD มาครอบ CI ของตัว repo เองด้วยหรือไม่ (ต้องถามเจ้าของงาน ไม่ใช่งานที่อนุมัติในรอบนี้)

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | แก้ `commitWithNoSuites()` ให้ระบุ git identity แบบ scoped | Claude | High | Done |
| 2 | ยืนยันด้วยสภาพแวดล้อมจำลอง CI (ไม่มี global git config) + ชุดเทสต์เต็ม repo | Claude | High | Done |
| 3 | พิจารณาว่าจะเพิ่มการแจ้งเตือนเชิงรุกสำหรับ `.github/workflows/tests.yml` แดง (ผูกเข้า SFD หรือกลไกอื่น) หรือไม่ | เจ้าของงาน | Medium | Open — ต้องถามแยก อยู่นอกขอบเขตที่อนุมัติในรอบนี้ |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `tools/push-gate/pre_push.test.js` — `commitWithNoSuites()` ระบุ `-c user.email=... -c user.name=...` เฉพาะการเรียก `git commit-tree`
- `docs/post-mortem/PENDING.md` — เติมแถวนี้ (`PM-2026-09-11-02`)
- `docs/post-mortem/README.md` — เติมรายการในดัชนี

**Commit:** ดูประวัติ commit ของสาขานี้ในเรพอ — commit ที่แนบรายงานฉบับนี้มาด้วยกัน *(repo นี้ public — ห้ามใส่ค่าจริงของ host / บัญชี / id ลิงก์ Drive หรือ Sheet ใช้ placeholder เท่านั้น)*

**หลักฐาน:**
```
$ gh run list --branch main --workflow tests.yml --limit 30 --json databaseId,conclusion,createdAt,headSha
total runs: 30
failures: 28 / successes: 2
oldest 3:
  2026-09-06T07:27:24Z success e455061
  2026-09-06T07:44:39Z success 12fdccb
  2026-09-06T08:08:45Z failure 8e83464   ← รอบแรกที่แดง หลังคอมมิตที่เปลี่ยน commitWithNoSuites()

$ HOME=/tmp/no-git-identity-test ... git -c user.email= -c user.name= commit-tree ...
fatal: empty ident name (for <>) not allowed        ← จำลองได้ตรงกับ CI เป๊ะ

$ HOME=/tmp/no-git-identity-test ... node tools/push-gate/pre_push.test.js   # หลังแก้
PASS  the hook refuses a commit whose tree contains no test file at all
...
all passed                                           ← ผ่านครบใต้สภาพแวดล้อมจำลอง CI

$ bash scripts/run-test-suites.sh
[ols-qa] ✅ เขียวครบ 31 ชุด
```
