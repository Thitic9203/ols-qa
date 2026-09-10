# Post-mortem — ทุกความผิดพลาดต้องมีเอกสาร และห้ามผิดซ้ำ

**กฎ:** ความผิดพลาดของ AI ทุกครั้ง **ไม่ว่าใครจะเป็นคนสั่งงานนั้น** ต้องจบด้วยเอกสาร post-mortem
ในโฟลเดอร์นี้ ตามฟอร์แมตเดียวกับ `skilllane-merit/docs/post-mortem/` และ **ห้ามผิดซ้ำเรื่องเดิม
หรือเรื่องใกล้เคียงอีกเด็ดขาด** กฎฉบับเต็มอยู่ที่ [`CLAUDE.md`](../../CLAUDE.md) หัวข้อเดียวกัน

> 🔴 **repo นี้ public** — รายงานห้ามมีรหัสผ่าน อีเมลบัญชีทดสอบ host จริง Jira tenant
> Google Sheet/Drive id หรือ path ที่มีชื่อผู้ใช้ ใช้ placeholder เท่านั้น
> `scripts/check-no-secrets.sh` บล็อกให้ชั้นหนึ่ง แต่คนเขียนต้องไม่ใส่ตั้งแต่แรก

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | หน้าที่ |
|------|---------|
| [`PENDING.md`](PENDING.md) | **บัญชีหนี้** — จดทันทีที่รู้ตัวว่าพลาด ก่อนเขียนรายงาน · hook ทุกตัวอ่านไฟล์นี้ |
| [`TEMPLATE.md`](TEMPLATE.md) | แม่แบบรายงาน — คัดลอกไปตั้งชื่อใหม่แล้วเขียนทับ |
| `<วันที่ 8 หลัก>-post-mortem-report-<เลข 4 หลัก>-<english-topic-slug>.md` | รายงานฉบับจริง |

### กติกาชื่อไฟล์ (validator บังคับ ไม่ใช่ขอความร่วมมือ)

```
20260905-post-mortem-report-0001-deleted-working-links-on-unverified-claim.md
└─ วันที่ ─┘                    └ เลข ┘ └──────── หัวข้อปัญหาเป็นอังกฤษ ────────┘
```

- **เลขรันนิ่ง 4 หลักเสมอ** `0001` `0002` `0003` … มีรายงานใหม่ก็ไล่ต่อไปเรื่อยๆ
  **ห้ามข้ามเลข ห้ามซ้ำ** — เลขขาดหมายความว่ามีรายงานถูกลบ · ที่ต้องเติมศูนย์เพราะถ้าใช้เลขเปล่า
  โฟลเดอร์จะเรียง `10` แทรกระหว่าง `1` กับ `2`
- **slug เป็นอังกฤษพิมพ์เล็ก คั่นด้วยขีด 3–12 คำ** อ่านจากรายชื่อไฟล์แล้วต้องรู้ทันทีว่าปัญหาเรื่องอะไร
  โดยไม่ต้องเปิดไฟล์ · ห้ามใช้ภาษาไทยหรือตัวพิมพ์ใหญ่ในชื่อไฟล์
- **เลขในหัวเรื่องต้องเป็น 4 หลักเหมือนกัน** — `# Post-Mortem Report #0001 — …` ไม่ใช่ `#1`

## ดัชนีรายงาน

| # | วันที่ | เรื่อง | ระดับ | ไฟล์ |
|---|--------|--------|-------|------|
| 0001 | 2026-09-05 | ลบลิงก์ที่ใช้งานได้ 3 จุด เพราะเชื่อคอมเมนต์ในเทสของตัวเองว่ามันพัง | Low | [20260905-post-mortem-report-0001-deleted-working-links-on-unverified-claim.md](20260905-post-mortem-report-0001-deleted-working-links-on-unverified-claim.md) |
| 0002 | 2026-09-06 | ตัวตรวจรายงานว่าเรียบร้อย ทับไฟล์ที่มันไม่เคยอ่าน (ตัวกรองทิ้งของที่ชื่อไม่ตรงแบบเงียบๆ) | Low | [20260906-post-mortem-report-0002-guard-reported-clean-over-files-it-never-read.md](20260906-post-mortem-report-0002-guard-reported-clean-over-files-it-never-read.md) |
| 0003 | 2026-09-06 | ด่านก่อนคอมมิตอ่านบัญชีหนี้ไม่ได้ แล้วแปลว่า "ไม่มีหนี้" จึงปล่อยคอมมิตผ่าน (ผิดซ้ำจาก 0002) | Medium | [20260906-post-mortem-report-0003-commit-gate-allowed-debt-when-ledger-unreadable.md](20260906-post-mortem-report-0003-commit-gate-allowed-debt-when-ledger-unreadable.md) |
| 0004 | 2026-09-06 | บอกเจ้าของงานให้ปิด-เปิดเซสชันใหม่ ทั้งที่ไม่เคยวัด และของจริงคือ hook มีผลทันที (ผิดซ้ำจาก 0001) | Medium | [20260906-post-mortem-report-0004-claimed-sessions-need-restart-without-measuring.md](20260906-post-mortem-report-0004-claimed-sessions-need-restart-without-measuring.md) |
| 0005 | 2026-09-06 | การ์ดกันแก้ข้อมูลลูกค้าปิดตัวเองเงียบๆ เมื่อโปรแกรมที่มันเรียกใช้ล้มเหลว (ผิดซ้ำจาก 0003) | High | [20260906-post-mortem-report-0005-customer-guard-allowed-writes-when-python-failed.md](20260906-post-mortem-report-0005-customer-guard-allowed-writes-when-python-failed.md) |
| 0006 | 2026-09-06 | ด่านก่อน push บอกว่าเทสต์เขียว ทั้งที่รันไป 0 ชุด (ผิดซ้ำจาก 0005) | Medium | [20260906-post-mortem-report-0006-push-gate-reported-green-with-zero-suites.md](20260906-post-mortem-report-0006-push-gate-reported-green-with-zero-suites.md) |
| 0007 | 2026-09-06 | เรียกไฟล์ค้างว่าเป็นงานของเซสชันอื่น 3 ครั้งโดยไม่ตรวจ แล้วส่งคืนเป็นภาระเจ้าของงาน (ผิดซ้ำจาก 0004) | Medium | [20260906-post-mortem-report-0007-called-stale-leftover-another-session-work.md](20260906-post-mortem-report-0007-called-stale-leftover-another-session-work.md) |
| 0008 | 2026-09-06 | เก็บคลิปและผลตรวจของรอบไว้ในโฟลเดอร์ชั่วคราว งานหายพร้อมการรีสตาร์ตเซสชัน | Medium | [20260906-post-mortem-report-0008-work-files-in-tmp-wiped-by-restart.md](20260906-post-mortem-report-0008-work-files-in-tmp-wiped-by-restart.md) |
| 0009 | 2026-09-06 | เครื่องมือมีค่าเริ่มต้นชี้ไป training จึงยิงคำขออ่านเข้า env ที่ห้ามแตะ 11 ครั้ง | Medium | [20260906-post-mortem-report-0009-env-default-sent-readonly-probe-to-training.md](20260906-post-mortem-report-0009-env-default-sent-readonly-probe-to-training.md) |
| 0010 | 2026-09-06 | ตัวรันชุดเทสต์พิมพ์ว่าเขียว ทั้งที่รันไป 0 ข้อ — กฎไปถึงด่านที่ถูกทดสอบ แล้วหยุดที่เครื่องมือทดสอบ (ผิดซ้ำจาก 0006) | Medium | [20260906-post-mortem-report-0010-test-harness-reported-green-running-zero-tests.md](20260906-post-mortem-report-0010-test-harness-reported-green-running-zero-tests.md) |
| 0011 | 2026-09-06 | งานต่ออายุ session ล้มเหลวไม่เป็น เพราะรหัสจบเป็นของคำสั่งตัดล็อก และตาข่ายเฝ้าไฟล์ 0 ไบต์ (ผิดซ้ำจาก 0006 · 0009 · 0003) | High | [20260906-post-mortem-report-0011-keepalive-job-could-not-fail-watched-by-empty-log.md](20260906-post-mortem-report-0011-keepalive-job-could-not-fail-watched-by-empty-log.md) |
| 0012 | 2026-09-07 | ตัวรันชุดเทสต์อีก 2 ไฟล์เขียวทั้งที่รัน 0 ข้อ เพราะรอบก่อนปิดเฉพาะไฟล์ที่เกิดเหตุ ไม่ได้ปิดคลาส (ผิดซ้ำจาก 0010 · 0006) | Medium | [20260907-post-mortem-report-0012-zero-test-green-fixed-in-two-files-not-the-class.md](20260907-post-mortem-report-0012-zero-test-green-fixed-in-two-files-not-the-class.md) |
| 0013 | 2026-09-07 | ช่องไม่บังคับในใบสั่งอัดปิดการตรวจข้อหนึ่งเงียบๆ แล้วตัวเลขยังบอกว่าวัดครบ (ผิดซ้ำจาก 0002 · 0006) | High | [20260907-post-mortem-report-0013-optional-field-silently-disabled-one-gate-check.md](20260907-post-mortem-report-0013-optional-field-silently-disabled-one-gate-check.md) |
| 0014 | 2026-09-07 | เลนย่อย 3 ตัวถูกตัวเฝ้าฆ่าเพราะเงียบเกิน 600 วินาที งานหาย และผมรายงานสถานะผิดจากข้อความสุดท้ายที่มันพิมพ์ไว้ | Medium | [20260907-post-mortem-report-0014-worker-lanes-killed-by-watchdog-lost-their-work.md](20260907-post-mortem-report-0014-worker-lanes-killed-by-watchdog-lost-their-work.md) |
| 0015 | 2026-09-07 | เครื่องมือไล่หาแถบที่อยู่เว็บที่เขียนเอง หยิบภาพนิ่งคนละภาพกับที่ประกาศ จึงรายงานว่าคลิปสะอาดทั้งที่มีแถบ และตัวเลขนั้นถูกใช้ตัดสินขอบเขตงานถ่ายใหม่ | High | [20260907-post-mortem-report-0015-url-sweep-read-the-wrong-frame-and-reported-false-clean.md](20260907-post-mortem-report-0015-url-sweep-read-the-wrong-frame-and-reported-false-clean.md) |
| 0016 | 2026-09-07 | อ่านสถานะจากสิ่งที่ไม่ใช่สถานะ 5 ครั้งในเซสชันเดียว ผิดซ้ำจาก #0014 ที่เขียนบทเรียนข้อนี้ไว้เองก่อนหน้าราว 1 ชั่วโมง | Medium | [20260907-post-mortem-report-0016-read-status-from-something-that-was-not-the-status-five-times.md](20260907-post-mortem-report-0016-read-status-from-something-that-was-not-the-status-five-times.md) |
| 0017 | 2026-09-07 | ใส่ Fix Version บน Jira ให้ทิคเกต OLS 86 ใบ ทั้งที่ผู้ใช้ชี้แค่ 32 ใบในภาพหน้าจอที่แนบมา — รู้ตัวเองว่าคลุมเครือระหว่างวางแผนแต่ไปถามคำถามอื่นแทน | High | [20260907-post-mortem-report-0017-fix-version-written-beyond-screenshot-scope.md](20260907-post-mortem-report-0017-fix-version-written-beyond-screenshot-scope.md) |
| 0018 | 2026-09-07 | รายงานว่าอัปเดตบอร์ดแล้ว 4 ครั้งในวันเดียว โดยยืนยันจากผลการเขียนฐานข้อมูล ซึ่งเป็นฝั่งที่ตัวเองเขียน ไม่ใช่ฝั่งที่เจ้าของงานเห็น ของจริงคือหน้าเว็บเปิดแล้วขาว | Medium | [20260907-post-mortem-report-0018-claimed-board-updated-without-checking-what-the-owner-could-see.md](20260907-post-mortem-report-0018-claimed-board-updated-without-checking-what-the-owner-could-see.md) |
| 0019 | 2026-09-07 | รายงานตัวเลขที่ยังไม่ได้วัด 2 ครั้งในเซสชันเดียว โดยพูดเหมือนวัดแล้ว — คลิปหาย 142 ไฟล์ (ของจริงครบ 148) และเลข 52 ของด่านเชื่อได้ (ของจริงเป็นค่าขั้นต่ำ) ผิดซ้ำจาก #0016 | Medium | [20260907-post-mortem-report-0019-reported-two-unmeasured-numbers-as-verified-fact.md](20260907-post-mortem-report-0019-reported-two-unmeasured-numbers-as-verified-fact.md) |
| 0020 | 2026-09-07 | เผยแพร่บอร์ดสดโดยที่ข้อมูลเลนผิดรูป ช่องเลนทั้ง 5 จึงหายไปจากหน้าที่เจ้าของงานเปิด ยืนยันที่ไฟล์และคำสั่งแทนที่จะยืนยันที่หน้าเว็บ ผิดซ้ำจาก #0018 | Medium | [20260907-post-mortem-report-0020-published-board-with-lane-data-in-the-wrong-shape.md](20260907-post-mortem-report-0020-published-board-with-lane-data-in-the-wrong-shape.md) |
| 0021 | 2026-09-07 | ถามเจ้าของงานซ้ำว่าจะอัดบนสภาพแวดล้อมไหน ทั้งที่คำตอบถูกบันทึกเป็นตัวหนาอยู่ในไฟล์บทถ่ายทำที่ตัวเองเขียน มติของเจ้าของงานถูกเก็บในที่ที่มันถูกใช้ ไม่ใช่ที่ที่มันถูกค้น ผิดซ้ำจาก #0019 | Medium | [20260907-post-mortem-report-0021-asked-owner-again-for-an-answer-already-in-my-own-file.md](20260907-post-mortem-report-0021-asked-owner-again-for-an-answer-already-in-my-own-file.md) |
| 0022 | 2026-09-07 | แจ้งเจ้าของงานว่างานย้ายแท็บถูกบล็อกเพราะปลายทางเป็นไฟล์แช่แข็ง โดยอนุมานจากชื่อแท็บที่ตรงกัน ไม่เคยเปิดเทียบ sha256 จริง ทั้งที่มีเครื่องมือยกเว้นที่เจ้าของงานอนุมัติไว้แล้วตั้งแต่ 6/Sep | Low | [20260907-post-mortem-report-0022-reported-tabmove-blocked-without-checking-file-id.md](20260907-post-mortem-report-0022-reported-tabmove-blocked-without-checking-file-id.md) |
| 0023 | 2026-09-08 | สั่ง TaskStop ฆ่า subagent 3 ตัวที่กำลังทำงานจริงอยู่ เพราะเข้าใจผิดว่านิ่งค้างจากไฟล์ heartbeat อย่างเดียว โดยไม่เช็คสถานะ running จริงก่อน สูญงานวิเคราะห์ของตัวหนึ่งที่ใกล้เขียนผลอยู่แล้ว | Medium | [20260908-post-mortem-report-0023-killed-three-live-productive-subagents.md](20260908-post-mortem-report-0023-killed-three-live-productive-subagents.md) |
| 0024 | 2026-09-07 | บันทึกผลตัดสิน 9 เคสวิดีโอเป็นผ่าน ทั้งที่รหัสสาเหตุ ROLE_MISMATCH ยังค้างและไม่เคยถูกแก้จริง เพราะเครื่องมือตัดจอ 2 ตัวที่ใช้ยืนยันไม่มีความสามารถตรวจบทบาทเลย ผลของด่านแคบถูกอ่านเกินขอบเขตที่มันวัดได้ | Medium | [20260908-post-mortem-report-0024-verdict-passed-despite-unaddressed-role-mismatch-code.md](20260908-post-mortem-report-0024-verdict-passed-despite-unaddressed-role-mismatch-code.md) |
| 0025 | 2026-09-08 | รายงานว่ายืนยัน session ได้ 0 จาก 15 บัญชี หมดอายุทั้งหมด ทั้งที่ไม่เคยเปิดไฟล์ state ดูสักไฟล์ ของจริงมี 1 บัญชีที่ยังไม่หมดอายุ ตัวเลข 0 มาจากบรรทัดสรุปของเครื่องมือที่ยุบ session ตาย ไฟล์ผิดบัญชี และเครื่องมือพัง ไว้ถังเดียวกัน ผิดซ้ำจาก #0019 | Medium | [20260908-post-mortem-report-0025-reported-zero-valid-sessions-without-opening-the-state-files.md](20260908-post-mortem-report-0025-reported-zero-valid-sessions-without-opening-the-state-files.md) |
| 0026 | 2026-09-08 | ปิดตัวรักษาการเข้าระบบเองเพื่อลดภาระเครื่อง แล้วอัดยาวเกิน 30 นาที ซึ่งเป็นเวลาที่เซิร์ฟเวอร์ตัด session ทิ้ง การเข้าระบบตายทั้ง 4 บัญชี ทั้งที่เงื่อนไข 30 นาทีนั้นเขียนอยู่ในหัวไฟล์ของเครื่องมือที่ปิดเอง ผิดซ้ำจาก #0023 | Medium | [20260908-post-mortem-report-0026-turned-off-session-keepalive-then-recorded-past-idle-timeout.md](20260908-post-mortem-report-0026-turned-off-session-keepalive-then-recorded-past-idle-timeout.md) |
| 0027 | 2026-09-08 | หยิบค่าจากแฟ้มบันทึกมาใช้โดยไม่เปิดของจริงตรวจก่อน 2 ครั้งซ้อน ครั้งแรกเปิดหน้าเข้าสู่ระบบของอีกสภาพแวดล้อม ครั้งที่สองใช้รายชื่อบัญชีของ production กับ pre-prod ต้นเหตุคือค่าทั้งคู่ไม่มีชื่อสภาพแวดล้อมกำกับในตัวเอง ผิดซ้ำจาก #0009 | Medium | [20260908-post-mortem-report-0027-used-remembered-values-wrong-sso-host-and-production-roster.md](20260908-post-mortem-report-0027-used-remembered-values-wrong-sso-host-and-production-roster.md) |
| 0028 | 2026-09-08 | สรุปกับเจ้าของงานว่าคลิปตกเพราะเครื่องช้า และเสนอให้ปิดโปรแกรมความปลอดภัยหรือลดคุณภาพคลิป ทั้งที่ตัวเลขกระจายที่ด่านพิมพ์มาในบรรทัดเดียวกันหักล้างอยู่แล้ว ของจริงคือจุดตรวจของตัวเองทำให้หน้าจอนิ่ง ผิดซ้ำจาก #0025 | High | [20260908-post-mortem-report-0028-blamed-machine-load-for-frame-starvation-caused-by-my-own-checkpoint.md](20260908-post-mortem-report-0028-blamed-machine-load-for-frame-starvation-caused-by-my-own-checkpoint.md) |
| 0029 | 2026-09-08 | อัดคลิปใหม่ 2 เคสทับงานที่อีกเซสชันตัดต่อจนผ่านไปแล้ว 22 ชั่วโมงก่อนหน้า เพราะทำตามรายการงานที่เขียนไว้ 46 ชั่วโมงก่อน โดยไม่เปิดไฟล์ผลตัดสินอ่านก่อนลงมือ ผิดซ้ำจาก #0016 | Low | [20260908-post-mortem-report-0029-refilmed-two-cases-another-session-had-already-passed.md](20260908-post-mortem-report-0029-refilmed-two-cases-another-session-had-already-passed.md) |
| 0030 | 2026-09-09 | บอกเจ้าของงานว่าตัวรักษาการเข้าระบบไม่ได้รันอยู่ ทั้งที่มันรันมาตั้งแต่ 22:19:39 น. เพราะอ่านผลว่างของ `ps` ต่อท่อ `grep` ว่าเป็น "ไม่มี" ทั้งที่แปลว่า "มองไม่เห็นรายการโปรเซส" ผิดซ้ำจาก #0016 | Low | [20260909-post-mortem-report-0030-called-running-process-not-running-from-empty-grep-result.md](20260909-post-mortem-report-0030-called-running-process-not-running-from-empty-grep-result.md) |
| 0031 | 2026-09-09 | ส่งเจ้าของงานไปพิมพ์รหัสผ่านลงหน้าต่างเบราว์เซอร์ที่เป็นหน้า 404 ไม่ใช่หน้าล็อกอิน ต้นเหตุคือเจอใบรับรองผิดปกติแล้วเสนอให้ข้ามการตรวจ โดยไม่เคยยิงดูก่อนว่าหน้านั้นตอบอะไร ใบรับรองกับ 404 เป็นอาการของเหตุเดียวกัน และเครื่องมือกลืนความล้มเหลว 3 ชนิดเป็นข้อความเดียวว่าให้คนกรอกเอง ผิดซ้ำจาก #0005 | Medium | [20260909-post-mortem-report-0031-sent-owner-to-type-passwords-into-dead-page.md](20260909-post-mortem-report-0031-sent-owner-to-type-passwords-into-dead-page.md) |
| 0032 | 2026-09-09 | ส่งมอบรายงาน smoke test ที่เขียนงานค้าง 3 กองไว้ในหัวข้อ "ข้อจำกัด" แล้วบอกว่าเสร็จ ทั้งที่ทั้งสามกองทำเองได้ และ repo มีทั้งกฎและสคริปต์รองรับอยู่แล้ว ต้นเหตุคือกฎเดิมผูกกับคำว่า BLOCKED แต่ตัวรันเทสต์พิมพ์คำว่า skipped จึงไม่ถูกจับว่าเป็นของสิ่งเดียวกัน ผิดซ้ำจาก #0007 | High | [20260909-post-mortem-report-0032-shipped-report-listing-my-own-unfinished-work.md](20260909-post-mortem-report-0032-shipped-report-listing-my-own-unfinished-work.md) |
| 0033 | 2026-09-09 | แก้บั๊กอ่านรายการแค่หน้าแรกโดยต่อ page= ท้าย URL ทุกกรณี ไม่ได้ไล่ดูว่าผู้เรียก 3 จุดใส่ page=1 มาแล้ว ได้ page=1&page=1 API ตอบ 400 ทำให้ 8 เคสที่เคยผ่านพัง จับได้เองจากการรันเต็มชุด ผิดซ้ำจาก #0003 | Medium | [20260909-post-mortem-report-0033-paging-fix-appended-second-page-parameter.md](20260909-post-mortem-report-0033-paging-fix-appended-second-page-parameter.md) |
| 0034 | 2026-09-09 | แก้ไฟล์สถานะ dedup ของตัวเฝ้าบอร์ดลูกค้าเพื่อบังคับให้ยิงซ้ำ ทั้งที่ launchd job ยังติดตั้งและเดินอยู่ รอบตามตาราง 17:03:34 จึงโพสต์ 4 ข้อความเข้าเธรดลูกค้าก่อนมีใครตรวจ และ 1 ใบแนบวันที่ผิดไป 2 วัน เพราะแคช marked คีย์ key‖STATUS ไม่ถูกล้างเมื่อสถานะออกแล้วกลับมา จึงคืนเวลาครั้งแรกแทนครั้งล่าสุด ผิดซ้ำจาก #0026 | High | [20260909-post-mortem-report-0034-edited-live-job-state-and-it-posted-before-review.md](20260909-post-mortem-report-0034-edited-live-job-state-and-it-posted-before-review.md) |
| 0035 | 2026-09-09 | รัน git reset --hard ในเวิร์กทรีที่หลายเซสชันใช้ร่วมกัน ตอนเก็บกวาดหลัง push สำเร็จ ลบการแก้ settings.json ของอีกเซสชันที่ยังไม่เคย commit หายถาวร · push ทำถูกตามกฎด้วย worktree ชั่วคราวเพราะรู้ว่ามีของค้าง แล้วบรรทัดถัดมากลับลบของค้างนั้นเอง ความระวังผูกกับงานหลัก ไม่ได้ผูกกับเวิร์กทรี ผิดซ้ำจาก #0007 | Medium | [20260909-post-mortem-report-0035-hard-reset-destroyed-another-session-uncommitted-file.md](20260909-post-mortem-report-0035-hard-reset-destroyed-another-session-uncommitted-file.md) |
| 0036 | 2026-09-09 | แคชเวลาที่เข้าสถานะ คีย์ด้วย key‖STATUS ไม่มีวันหมดอายุ เมื่อสถานะออกแล้วกลับมา ตัวเฝ้าจึงรายงานเวลาของ episode ก่อนหน้า โนติถึงลูกค้าจึงแนบวันที่เก่ากว่าความจริง 2 วัน (เขียนโดยอีกเซสชัน เลื่อนเลขจาก 0034 เป็น 0036 เพราะเลขชนกับรายงานที่ push ไปก่อน) | Medium | [20260909-post-mortem-report-0036-stale-arrival-cache-announced-previous-episode-date.md](20260909-post-mortem-report-0036-stale-arrival-cache-announced-previous-episode-date.md) |
| 0038 | 2026-09-09 | ยิง POST /auth/refresh-token เพื่อ "ดูว่า endpoint ยังใช้ได้ไหม" ด้วย curl ที่ไม่มี cookie jar ไม่มี -D และลบ body ทิ้ง ได้ 201 พร้อมคุกกี้ชุดใหม่ 4 ตัวที่เซิร์ฟเวอร์หมุนมาให้ แล้วทิ้งทั้งหมด ยิงซ้ำได้ 401 พร้อม Expires=Thu, 01 Jan 1970 = session ของบัญชีบทบาทผู้สร้างสื่อตายถาวร ต้องรบกวนเจ้าของงานล็อกอินใหม่ 1 บัญชี กฎข้อนี้อยู่ใน CLAUDE.md ตรงตัวแล้ว แต่ถูกจัดหมวดว่าเป็น "การสำรวจ" ไม่ใช่ "การใช้งานจริง" ผิดซ้ำจาก #0026 | Medium | [20260909-post-mortem-report-0038-refresh-probe-discarded-rotated-cookies-killing-one-session.md](20260909-post-mortem-report-0038-refresh-probe-discarded-rotated-cookies-killing-one-session.md) |
| 0037 | 2026-09-09 | ลบคีย์ของประกาศ deploy ใบเช้าออกจากเส้นฐานในไฟล์สถานะของตัวเฝ้า smoke ที่เพิ่งติดตั้ง เพื่อพิสูจน์ว่า flow เดินครบ รอบตามตาราง 17:48:56 จึงโพสต์ Starting smoke test on dev เข้าช่องทีมและรันจริง 111 เคส · ตัวเฝ้าทำถูกทุกด่าน ผมเป็นคนป้อนอินพุตปลอมให้มันเอง ต้นเหตุคือเครื่องมือไม่มีโหมดที่ไม่ส่งจริง และเส้นฐานตอนติดตั้งเป็นของที่พิมพ์เอง ไฟล์สถานะจึงถูกทำให้เป็นช่องที่คนกรอกได้ตั้งแต่นาทีแรก ผิดซ้ำจาก #0034 ภายใน 34 นาทีหลังเขียนกฎนั้นเอง | High | [20260909-post-mortem-report-0037-removed-deploy-baseline-and-watcher-announced-to-team-channel.md](20260909-post-mortem-report-0037-removed-deploy-baseline-and-watcher-announced-to-team-channel.md) |
| 0039 | 2026-09-09 | สั่งหยุดตัวทดสอบด้วย pkill -f ที่จับชื่อไฟล์ จึงฆ่าตัวรักษาการเข้าระบบตัวจริงที่กำลังทำงานอยู่ไปด้วยทั้ง 2 ตัว ขณะที่ 3 เลนกำลังอัดคลิปโดยพึ่ง session ชุดนั้น · ต้นเหตุคือรันตัวทดสอบจากไฟล์ชื่อเดียวกับตัวจริง เมื่อชื่อชนกัน เครื่องมือทุกตัวที่แยกด้วยชื่อจึงแยกไม่ออก ช่วงไม่มีชั้นป้องกัน 4 นาที 2 วินาที ต่ำกว่าเพดาน 30 นาที จึงไม่มี session ตาย ผิดซ้ำจาก #0037 | Low | [20260909-post-mortem-report-0039-pkill-by-name-killed-the-live-session-keepalive.md](20260909-post-mortem-report-0039-pkill-by-name-killed-the-live-session-keepalive.md) |
| 0040 | 2026-09-09 | รายงานเจ้าของงานว่า 4 เคสปลดล็อกไม่ได้เพราะสื่อใหม่ต้องมีปก และปกต้องผ่านตัวสร้างภาพ ทั้งที่ชุดข้อมูลของรอบนั้นมีปกพร้อมอยู่ 77 ใบ และเหลือสื่อที่ยังไม่ถูกใช้ครบทุกประเภท จึงไม่ต้องใช้ตัวสร้างภาพเลย · กฎเรื่องปกถูกอ่านถูก แต่กระโดดจาก "ต้องมีปก" ไปเป็น "ต้องสร้างปกใหม่" ข้ามขั้นแรกของกฎฉบับเดียวกันที่บอกให้หาของเดิมก่อน · ข้อมูลที่หักล้างอยู่ในผลลัพธ์ของตัวเองตั้งแต่ต้นเซสชัน ผิดซ้ำจาก #0032 | Medium | [20260909-post-mortem-report-0040-called-covers-the-blocker-while-77-sat-in-the-dataset.md](20260909-post-mortem-report-0040-called-covers-the-blocker-while-77-sat-in-the-dataset.md) |
| 0041 | 2026-09-10 | เติมข้อความ 2 บรรทัดที่ไม่มีในฟอร์แมตเข้าไปในโนติผล smoke test ที่โพสต์เข้าช่อง release ของทีม ทั้งที่เจ้าของงานชี้ข้อความอ้างอิงให้ทำตามตรงๆ · ข้อมูลทั้ง 2 บรรทัดเป็นเรื่องจริงที่วัดมาเอง แต่ความจริงของเนื้อหากับสิทธิ์ที่จะใส่มันลงไปเป็นคนละเรื่องกัน · ต้นเหตุคือประกอบข้อความด้วยมือแล้วยิงเอง ไม่ผ่านตัวสร้างในโค้ด จึงไม่มีชั้นไหนบังคับรูปร่างเลย และเมื่อพบว่าไฟล์แนบมาจากคนละรอบกับตัวเลข ผมเลือกอธิบายในโนติแทนที่จะทำให้มันตรงกันหรือถามเจ้าของงาน | Low | [20260910-post-mortem-report-0041-added-lines-beyond-the-agreed-notify-format.md](20260910-post-mortem-report-0041-added-lines-beyond-the-agreed-notify-format.md) |
| 0042 | 2026-09-10 | บอกเจ้าของงานว่า background agent ตายแล้ว โดยอ่านขนาดไฟล์กับเวลาแก้ไข ซึ่งค้างนิ่งทั้งคู่ ของจริงคือ `wc -c` เห็น 1.67 MB และโตต่อเนื่อง = agent ทำงานอยู่ตลอดและจบงานสำเร็จ · ค่าสองค่าที่ใช้ยืนยันกันมาจาก inode เดียวกัน จึงเป็นการวัดครั้งเดียว ไม่ใช่สองชั้น · แล้วยังเชื่อเลขนั้นจนสั่ง `cat` ไฟล์ที่เครื่องมือห้ามอ่านไว้ ผิดซ้ำจาก #0016 และ #0002 | Low | [20260910-post-mortem-report-0042-called-live-agent-dead-from-stale-file-metadata.md](20260910-post-mortem-report-0042-called-live-agent-dead-from-stale-file-metadata.md) |
| 0043 | 2026-09-10 | มีคนรีพลายถามบอทในช่อง deployment แต่คำตอบไปโผล่ในเธรด QA ในชื่อบอทอีกตัว เพราะทางสำรองผูกเงื่อนไขไว้กับ "ทางหลักล้ม" แล้วยิง webhook ที่ต่อ thread ตายตัวและมีชื่อแสดงผลของตัวเอง — ข้อเท็จจริงที่ว่าทางหลักล้ม ไม่ได้บอกอะไรเลยว่าคำตอบควรไปที่ไหน · ทางหลักล้มเพราะ discord.js ตั้ง `failIfNotExists` เป็น true และผู้ถามลบข้อความตัวเองใน 47 วินาทีที่ listener ใช้ก่อนตอบ · ซ้อนด้วย `spawn('claude')` ที่ ENOENT ทุกครั้งจาก PATH ของ launchd ทำให้ฟีเจอร์ตอบอัตโนมัติไม่เคยทำงานได้เลยตั้งแต่ติดตั้ง ผิดซ้ำจาก #0009 · #0006 · #0011 · #0005 | High | [20260910-post-mortem-report-0043-fallback-answered-in-wrong-channel-under-wrong-name.md](20260910-post-mortem-report-0043-fallback-answered-in-wrong-channel-under-wrong-name.md) |
| 0044 | 2026-09-10 | สั่ง `npx playwright test` เปล่าๆ บน training69 โดยไม่เคยเปิดรายงานของรอบอ้างอิงอ่านว่าสโคปคืออะไร ได้ 1,177 เทสต์แทนที่จะเป็น 111 เพราะ config เปิดโปรเจกต์ responsive เพิ่มเมื่อ env เป็น training · เผาเวลา 13 นาที จากเพดาน 30 นาที และเจ้าของงานต้องทักเอง 4 ครั้งกว่าจะไปเปิดของจริงดู · ต้นเหตุคือไม่มีอะไรวัดสโคปก่อนรัน ตัวรันยอมรับคำสั่งที่ไม่ระบุสโคปเสมอ ผิดซ้ำจาก #0029 | High | [20260910-post-mortem-report-0044-ran-the-whole-suite-because-scope-was-remembered-not-read.md](20260910-post-mortem-report-0044-ran-the-whole-suite-because-scope-was-remembered-not-read.md) |
| 0045 | 2026-09-10 | ใส่ `rm -rf` ไว้บรรทัดเดียวกับคำสั่งรัน จึงลบรายงาน HTML ของรอบที่เพิ่งจบซึ่งเป็นสำเนาเดียว ไม่กี่นาทีก่อนเจ้าของงานสั่งว่าให้แก้ไฟล์เดิม ไม่ต้องรันใหม่ · Playwright สร้าง HTML ย้อนหลังจาก JSON ไม่ได้ จึงต้องรันซ้ำ 6.5 นาที · ต้นเหตุคือไม่มีขั้นตอนคัดลอกผลลัพธ์เข้าโฟลเดอร์งานถาวรทันทีที่รอบจบ ของทุกชิ้นจึงอยู่ในที่ที่ถูกล้างได้ ผิดซ้ำจาก #0008 | Medium | [20260910-post-mortem-report-0045-deleted-the-only-copy-of-finished-report.md](20260910-post-mortem-report-0045-deleted-the-only-copy-of-finished-report.md) |
| 0046 | 2026-09-10 | งานตามตาราง keepalive เรียก `session_refresh.js --all` ซึ่งทำกับไฟล์ session ทุกใบในเครื่อง แต่ส่งโฮสต์ของสภาพแวดล้อมเดียวลงไปเป็นค่าคงที่ ใบที่ออกโดยสภาพแวดล้อมอื่นจึงถูกยิงไปหาเซิร์ฟเวอร์ที่ไม่เคยออกให้ ปลายทางปฏิเสธและล้างคุกกี้ทิ้ง · ต้นเหตุอยู่ในโค้ด: ฟังก์ชัน refresh ถือคำตอบของ `/api/auth/get-session` ไว้แล้วไม่เคยอ่านก่อนตัดสินใจ | High | [20260910-post-mortem-report-0046-keepalive-refreshed-every-session-against-one-environment.md](20260910-post-mortem-report-0046-keepalive-refreshed-every-session-against-one-environment.md) |

## ขั้นตอนเมื่อรู้ตัวว่าพลาด

1. **หยุดแล้วบอกเจ้าของงานทันที** — ห้ามแก้เงียบๆ แล้วค่อยเล่าตอนจบ
2. **จดแถวใหม่ใน [`PENDING.md`](PENDING.md) ในเทิร์นนั้นเลย** สถานะ `OPEN` ใช้เวลาไม่กี่วินาที
   ขั้นนี้สำคัญกว่าการรีบเขียนรายงาน เพราะถ้าเซสชันจบก่อน ความผิดพลาดจะหายไปพร้อมเซสชัน
3. แก้ที่ต้นเหตุและยืนยันว่าเขียวจริงด้วยหลักฐานที่กดตามได้
4. คัดลอก `TEMPLATE.md` เป็น `<วันที่>-post-mortem-report-<เลขถัดไป 4 หลัก>-<english-topic-slug>.md`
   แล้วเขียนให้ครบทุกหัวข้อ
   รวมถึง **5 Whys** และบรรทัด **กฎที่เพิ่มจากเหตุนี้**
5. เพิ่มแถวในดัชนีข้างบน แล้วเปลี่ยนแถวใน `PENDING.md` เป็น `DONE` พร้อมชื่อไฟล์
6. รัน `node tools/postmortem-guard/check.js` ให้ผ่าน แล้ว merge เข้า `main` ทันทีตามกฎเอกสาร

## ถ้าเป็นเรื่องเดิมหรือใกล้เคียงกับที่เคยมีรายงานแล้ว

นั่นคือความล้มเหลวของชั้นป้องกัน ไม่ใช่แค่ความผิดพลาดใหม่ ให้เขียนรายงานฉบับใหม่ที่:

- ใส่บรรทัด `**ผิดซ้ำจาก:** #N` ชี้ไปที่รายงานเดิม (validator ตรวจว่าเลขนั้นมีอยู่จริง)
- ตอบให้ได้ในหัวข้อ 3 ว่า **ชั้นไหนที่ควรจับได้แต่ไม่จับ และเพราะอะไร**
- มาตรการในหัวข้อ 6 ต้องเป็นชั้นใหม่หรือชั้นที่แข็งขึ้น ไม่ใช่คำเตือนซ้ำของเดิม

## แนวป้องกันการลืมเขียน 10 ชั้น

แต่ละชั้นเป็นอิสระจากกัน ชั้นเดียวพังไม่ทำให้ทั้งระบบพัง และตั้งใจให้ **ไม่มี flag ปิด** —
ทางออกเดียวคือเขียนรายงาน หรือให้เจ้าของงานสั่ง `WONTFIX` ซึ่งเป็นการกระทำที่เห็นได้ในประวัติ

| ชั้น | กลไก | อยู่ที่ไหน | กันอะไร |
|:--:|------|-----------|---------|
| **1** | กฎในไฟล์ที่โหลดทุกเซสชัน | [`CLAUDE.md`](../../CLAUDE.md) | ไม่รู้ว่ามีกฎนี้ |
| **2** | บัญชีหนี้ จดใน 10 วินาที | [`PENDING.md`](PENDING.md) | เซสชันจบก่อนเขียนรายงาน |
| **3** | SessionStart hook ตะโกนหนี้ที่ค้าง | `.claude/hooks/postmortem-debt.sh` ผ่าน `inject-context.sh` | เซสชันใหม่ไม่รู้หนี้ของเซสชันก่อน |
| **4** | UserPromptSubmit hook เตือนซ้ำทุก prompt | `.claude/settings.json` | ลืมกลางทางในเซสชันยาว |
| **5** | Stop hook เตือนทุกจบเทิร์น | `.claude/settings.json` | "เดี๋ยวค่อยทำ" กลายเป็นไม่ได้ทำ |
| **6** | PreCompact hook พาหนี้ข้ามการบีบอัด | `.claude/hooks/pre-compact.sh` | compaction กลืนหนี้ |
| **7** | ตัวตรวจโครงสร้าง ดัชนี และเลขลำดับ | `tools/postmortem-guard/check.js` | รายงานมีอยู่แต่ไม่ครบ ไม่เข้าดัชนี หรือชื่อผิด |
| **8** | pre-commit บล็อกคอมมิตอื่นระหว่างที่หนี้ยังเปิด | `scripts/hooks/pre-commit` | ทำงานใหม่ทับไปเรื่อยๆ โดยหนี้ค้าง |
| **9** | เทสตรึงกฎทุกข้อ รวมถึงตรึงว่าอีก 9 ชั้นยังต่ออยู่ | `tools/postmortem-guard/postmortem_rules.test.js` | กฎถูกผ่อนเงียบๆ ในอนาคต |
| **10** | CI รันตัวตรวจและเทสทุก push และ PR | `.github/workflows/tests.yml` | เครื่องเดียวปิดชั้นในเครื่องตัวเอง |

**ทำไมต้อง 10 ชั้น** — ชั้น 1 ถึง 6 เป็นการเตือน ซึ่งเตือนได้แต่บังคับไม่ได้
ชั้น 7 ถึง 10 เป็นการบังคับ ซึ่งบังคับได้แต่มาช้ากว่า (ตอนคอมมิตหรือตอน CI)
ระบบที่มีแต่การเตือนจะถูกเมิน ระบบที่มีแต่การบังคับจะถูกค้นพบตอนสายเกินไป จึงต้องมีทั้งสองแบบ

## รันตัวตรวจเอง

```bash
node tools/postmortem-guard/check.js
```

```bash
node tools/postmortem-guard/postmortem_rules.test.js
```

รหัสจบของตัวตรวจ: `0` ผ่าน · `1` เจอปัญหา · `2` รันไม่ได้ — และ **รันไม่ได้ไม่เท่ากับผ่าน**
