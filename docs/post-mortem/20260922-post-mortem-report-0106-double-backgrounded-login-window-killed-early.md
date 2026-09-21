# Post-Mortem Report #0106 — double-backgrounded Bash call killed the rg9020 login window before the owner could type a password

**ระบบ:** เครื่องมือ QA (Claude Code Bash tool `run_in_background`) ใช้เปิด `~/ols-qa-testing-bot/capture/session_capture.js`
**สภาพแวดล้อมที่ได้รับผลกระทบ:** training69 (`<TRAINING_HOST>`) — session ของบัญชี `rg9020` (ADMIN_CONTENT)
**วันที่เกิดเหตุ:** 2026-09-22
**วันที่ค้นพบ:** 2026-09-22 (ทันทีที่ตรวจ `ps aux` แล้วไม่พบ process/browser)
**วันที่จัดทำรายงาน:** 2026-09-22
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Low — ไม่มีข้อมูลเสียหาย ไม่มีการกระทำย้อนกลับไม่ได้เกิดขึ้น จับได้และแก้เองภายในไม่กี่นาที แต่เปิดหน้าต่างเปล่าทิ้งไว้ให้เจ้าของงานเห็นโดยไม่มีอะไรให้พิมพ์
**ประเภท:** ผิดปลายทาง/รูปแบบคำสั่งเอง (tool usage) — ไม่ใช่บั๊กของสคริปต์เป้าหมาย

---

## สรุปสั้น (Executive Summary)

สั่งเปิดหน้าต่างล็อกอิน (`session_capture.js --force`) ให้เจ้าของงานพิมพ์รหัสผ่าน rg9020 ใหม่ โดยเขียนคำสั่งซ้อนสองชั้น: ใช้ทั้ง flag `run_in_background: true` ของ Bash tool เอง และเติม shell `&` + `echo PID=$!` ต่อท้ายคำสั่งด้วย ผลคือ wrapper script (ซึ่งแค่สั่ง background node แล้ว echo PID) จบตัวเองทันทีในเสี้ยววินาที และเมื่อ parent shell จบ ระบบก็ฆ่า process ลูก (node + browser ที่เพิ่งกรอกอีเมลเสร็จ) ไปด้วย — เจ้าของงานไม่มีโอกาสได้พิมพ์รหัสผ่านเลยเพราะหน้าต่างหายไปก่อน จับได้จากการเช็ค `ps aux` ไม่พบ process ค้างอยู่ แก้โดยรันคำสั่งเดิมใหม่แบบไม่ซ้อน (ใช้ `run_in_background: true` อย่างเดียว ไม่มี `&`) ซึ่งสำเร็จและได้ session ใหม่ถูกต้อง

---

## 1. ปัญหา (Problem Statement)

- คำสั่งที่รัน (สรุป): Bash tool call พร้อม `run_in_background: true` โดยตัว command string เองมี `... node session_capture.js t69_rg9020_training --force > log 2>&1 & \n echo "PID=$!"`
- ผลลัพธ์: harness แจ้ง "Background command ... completed (exit code 0)" เกือบจะทันที
- log ไฟล์จบที่บรรทัด `[t69_rg9020_training] e-mail filled — cursor is in the password box.` ไม่มีบรรทัดถัดไปเลย
- `ps aux | grep -i "session_capture\|chromium"` และการค้นแบบกว้างขึ้น `ps aux | grep -iE "chrome|headless_shell"` ไม่พบ process ใดๆ ที่เกี่ยวข้อง — ยืนยันว่า browser ถูกปิดไปแล้วจริง ไม่ใช่แค่ไม่แสดงผล

**สิ่งที่ควรจะเป็น:** เมื่อสั่งเครื่องมือที่ต้องรอ input จากมนุษย์นานถึง 8 นาที (`WAIT_MS` default ใน `session_capture.js`) ผ่าน `run_in_background: true` ของ Bash tool ต้องปล่อยให้ tool จัดการ background เอง ไม่ควรเติม shell `&` ซ้อนอีกชั้น เพราะกลไก backgrounding ทั้งสองชั้นตีกัน

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา (ประมาณจากลำดับ log) | เหตุการณ์ |
|------|-----------|
| T+0 | สั่ง Bash tool `run_in_background: true` รันคำสั่งที่มี `node ... & echo PID=$!` |
| T+~1s | wrapper script (background node + echo PID) จบตัวเอง — เพราะ `&` ทำให้ echo ไม่รอ node |
| T+~1s | harness รายงาน "completed (exit code 0)" — เป็น exit code ของ wrapper ไม่ใช่ของ node |
| (ไม่ทราบวินาทีที่แน่ชัด) | node/Playwright ทันเปิดหน้าต่าง กรอกอีเมลเสร็จ (`e-mail filled` ปรากฏใน log) ก่อนถูกฆ่า |
| ไม่นานหลังจากนั้น | parent shell process จบ → process ลูก (node + Chromium) ถูกฆ่าตามไปด้วย ก่อนเข้าลูปรอ 8 นาที |
| ตรวจพบ | สั่ง `ps aux` เช็ค ไม่พบ process ที่เกี่ยวข้องเลย ยืนยันว่าหน้าต่างหายจริง |
| แก้ไข | รันคำสั่งเดิมใหม่ ใช้ `run_in_background: true` เพียงอย่างเดียว (ไม่มี `&`) → สำเร็จ ได้ log ครบทุกขั้นตอนจนถึง `SAVED → ... expires 2026-09-22 23:19 (24.0h)` |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไมหน้าต่างล็อกอินหายไปก่อนเจ้าของงานพิมพ์รหัสผ่านทัน?** — เพราะ process node ที่ควบคุม browser ถูกฆ่าไปพร้อมกับ parent shell ของมันตั้งแต่วินาทีแรกๆ
2. **ทำไม parent shell จบเร็วขนาดนั้น?** — เพราะ command string เติม `&` ต่อท้าย node ทำให้ node ถูก background ไปที่ชั้น shell เอง แล้วบรรทัดถัดมา (`echo PID=$!`) รันเสร็จทันที ทำให้ "คำสั่งทั้งก้อน" (จากมุมมองของ shell) จบตั้งแต่ตรงนั้น
3. **ทำไมใช้ `&` ทั้งที่มี `run_in_background: true` อยู่แล้ว?** — เข้าใจผิดว่าต้องเก็บ PID ไว้เผื่อใช้ตรวจสอบทีหลัง (นิสัยจาก workflow อื่นที่ไม่ได้ผ่าน tool backgrounding) โดยไม่ทันคิดว่า `run_in_background: true` ของ Bash tool เองทำหน้าที่ backgrounding ทั้งกระบวนการอยู่แล้ว การเติม `&` จึงเป็นการ background ซ้อนสองชั้นที่ไม่จำเป็นและเป็นอันตราย
4. **ทำไมสองชั้นนี้ถึงตีกันจนฆ่า process ลูก?** — เพราะเมื่อ parent shell (ที่ harness ใช้รันคำสั่งทั้งก้อน) จบ ระบบปฏิบัติการ/harness เก็บกวาด process group ของมัน ซึ่งรวม process ลูกที่ถูก background ด้วย `&` ไปด้วย (child ไม่ได้ถูก `disown`/`setsid` ให้หลุดจาก process group ของ parent) — เพราะ `run_in_background: true` ตั้งใจให้ตัว "คำสั่งทั้งก้อน" เป็นสิ่งที่มีอายุยืนอยู่แล้ว ไม่ได้ออกแบบมาให้ผู้ใช้ยัง `&` ซ้อนเองอีกที
5. **root cause จริง:** ไม่เข้าใจ contract ของ `run_in_background: true` ว่ามันจัดการ backgrounding ให้ "คำสั่งทั้งก้อน" อยู่แล้ว การเติม `&`+เก็บ PID ที่ระดับ shell เป็นการซ้อนกลไกที่ไม่มีเหตุผลรองรับ และไม่เคยทดสอบผลลัพธ์ก่อนบอกเจ้าของงานว่า "หน้าต่างเปิดแล้ว พิมพ์รหัสผ่านได้เลย"

**ทำไมไม่จับได้ทันที:** harness รายงาน exit code 0 (ปกติหมายถึงสำเร็จ) ทำให้ดูเผินๆ เหมือนไม่มีอะไรผิด — ต้องอ่าน log ตัวเนื้อหาจริงและเช็ค `ps aux` แยกต่างหากถึงจะเห็นว่า process ที่ควรจะยังรออยู่หายไปแล้ว

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง | ไม่ถึง |
| เจ้าของงาน | เห็นหน้าต่างล็อกอินเปิดแล้วปิดเองโดยไม่ทันได้พิมพ์อะไร เสียเวลาหนึ่งรอบ ต้องรอเปิดใหม่ |
| ข้อมูล/ระบบ | ไม่มี — ไม่มีการกระทำย้อนกลับไม่ได้เกิดขึ้นในขั้นตอนนี้ เป็นแค่ auth flow ที่ล้มเหลว ไม่ใช่ moderation vote |

---

## 5. แนวทางการแก้ไข (Fix)

- รันคำสั่งเดิมใหม่ทันที โดยตัด shell `&` และ `echo PID=$!` ออก ให้ `run_in_background: true` ของ Bash tool จัดการ backgrounding แต่ผู้เดียว
- ผลการแก้: log แสดงครบทุกขั้นตอน (`e-mail filled` → `got "access_token"` → `SAVED → state_t69_rg9020_training.json ... expires 2026-09-22 23:19 (24.0h)`) — สำเร็จ

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | เมื่อสั่งกระบวนการที่ต้องรอ input ของมนุษย์ (login window, interactive prompt) ผ่าน Bash tool ต้องใช้ `run_in_background: true` เพียงอย่างเดียว ห้ามเติม shell `&`/`disown`/เก็บ PID ซ้อนอีกชั้น เว้นแต่ตั้งใจรันแบบ fire-and-forget ที่ไม่สนใจผลจริงๆ | กฎ (จดในความเข้าใจของ session นี้ — ยังไม่ได้ลงเอกสารถาวรข้ามเซสชัน) | ทำแล้วในรอบนี้ ยังไม่ได้เขียนเป็นกฎถาวรใน CLAUDE.md |
| P2 | หลังสั่ง background process ที่ต้องรอมนุษย์ ให้เช็ค `ps aux` ยืนยันว่า process ลูก/browser ยังมีชีวิตอยู่จริง ก่อนบอกเจ้าของงานว่า "พร้อมให้พิมพ์" — อย่าเชื่อแค่ exit code ของ wrapper | checklist | ทำแล้วในรอบนี้ (ใช้ตรวจจับปัญหานี้เอง) |

**กฎที่เพิ่มจากเหตุนี้:** ยังไม่ได้เขียนถาวรใน `CLAUDE.md` — เป็น tool-usage pattern เฉพาะเซสชันนี้ ยังไม่ยืนยันว่าเกิดซ้ำพอจะคุ้มเขียนเป็นกฎบังคับทุกโปรเจกต์

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** Claude เอง จับได้จากการเช็ค `ps aux` เชิงรุกหลังสงสัยว่า log จบสั้นผิดปกติ (ไม่มีบรรทัดรายงานทุก 15 วิ ทั้งที่ `REPORT_MS` default คือ 15000)
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ไม่กี่นาที — ตรวจจับได้ก่อนที่จะบอกเจ้าของงานว่า "พิมพ์รหัสผ่านได้เลย" (ซึ่งจะทำให้เจ้าของงานไปเจอหน้าต่างที่ปิดไปแล้ว)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** ทำ P2 เป็นขั้นตอนมาตรฐานทุกครั้งที่สั่ง background interactive process — เช็ค `ps aux` ทันทีหลัง launch ก่อนแจ้งเจ้าของงาน แทนที่จะเชื่อ exit code เฉยๆ

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ไม่บอกเจ้าของงานว่า "หน้าต่างพร้อมแล้ว" จนกว่าจะยืนยันด้วย `ps aux` — จับได้ก่อนที่จะทำให้เจ้าของงานเสียเวลาไปเจอหน้าต่างที่ตายแล้ว
- แก้ปัญหาด้วยการเปลี่ยนแปลงน้อยที่สุด (ตัด `&` ออก) แล้วพิสูจน์ด้วย log จริงก่อนเชื่อว่าสำเร็จ ไม่ใช่แค่เดา

### สิ่งที่ต้องปรับปรุง
- อย่าซ้อนกลไก backgrounding สองชั้นโดยไม่มีเหตุผลชัดเจน — `run_in_background: true` คือสัญญาว่า "คำสั่งทั้งก้อนจะรันจนจบเอง ไม่ต้องกังวลเรื่อง background" การเติม `&` เองเป็นการสันนิษฐานที่ผิดเกี่ยวกับ contract ของ tool

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | เมื่อสั่ง interactive/login background process ผ่าน Bash tool ในรอบต่อๆ ไปของเซสชันนี้ ใช้ `run_in_background: true` อย่างเดียว ไม่เติม `&` | Claude | Medium | Done (นำไปใช้แล้วในการแก้ปัญหานี้เอง) |
| 2 | ถ้าเจอ pattern เดียวกันอีกใน session อื่น (double-backgrounding) ให้พิจารณาเขียนเป็นกฎถาวรใน CLAUDE.md หรือ session-context ของเครื่องมือ | Claude | Low | Open — รอดูว่าเกิดซ้ำหรือไม่ |

---

## 10. Technical Appendix

**หลักฐาน:**
```
--- แรก (ผิด): run_in_background:true + shell "&" ---
log จบที่:
[t69_rg9020_training] e-mail filled — cursor is in the password box.
(ไม่มีบรรทัดถัดไปเลย — ไม่มี report ทุก 15s, ไม่มี timeout, ไม่มี error)

ps aux | grep -i "session_capture\|chromium"  → (ว่างเปล่า)
ps aux | grep -iE "chrome|headless_shell"     → (ว่างเปล่า)

--- ที่สอง (ถูก): run_in_background:true อย่างเดียว ---
log ครบ:
[t69_rg9020_training] e-mail filled — cursor is in the password box.
[t69_rg9020_training] got "access_token" — settling on OLS…
[t69_rg9020_training] SAVED → state_t69_rg9020_training.json | rg9020_training@<TRAINING_HOST_MAIL> | expires 2026-09-22 23:19 (24.0h)

======================================================================
SUMMARY
  OK   t69_rg9020_training (24.0h)

all captured.
```
