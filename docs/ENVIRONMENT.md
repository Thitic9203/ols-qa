# 9. Environment / login / session

- ยืนยัน env + account กับ user ก่อนเทสทุกครั้ง ห้ามเลือกเอง (dev/pre-prod ต้อง VPN · training ห้ามเลือกเพราะไม่ต้อง VPN) · ระบุแล้วในรอบ = แจ้งแล้วใช้เลย
- เครื่องมือที่เลือก env ห้ามมีค่าเริ่มต้น · ค่าปลายทาง/ตัวตนต้องมีชื่อ env ในตัว · คำสั่งที่ยกให้คนอื่นรัน ต้องเทียบ env ก่อนส่ง (`session_capture_prod.sh` = production เท่านั้น)
- **training ห้ามแตะทุกกรณี** (ไม่สแกน ไม่เขียน ไม่ probe) · env อื่นนอก pre-prod ยืนยันก่อน
- agent ห้ามพิมพ์รหัสผ่านทุกบัญชี · ใช้ saved session `capture/state_<tag>.json` (`accounts_sync.py` · `session_capture.js` · `session_status.js` · `session_verify.js` · `session_refresh.js`) · หลังเก็บต้อง `session_verify.js`
- คุกกี้ auth 24 ชม. นับเฉพาะ 4 ตัว (access/refresh/user_proof/session_id) · refresh = `POST <AUTH_API>/auth/refresh-token` สำเร็จแล้วต้องเซฟ storageState ทันที (หมุนโทเคน) · ห้ามยิงแบบ "สำรวจ" · ห้ามเปิดเว็บ NDLP/auth API ด้วยไฟล์ session · dev ยังไม่มีหลักฐานว่า refresh ได้ → ล็อกอินมือผ่าน `SIGNIN_URL=<OLS>/?signIn=1`
- ก่อนบอกว่าบัญชีพร้อม/ส่งเลน: ชี้ keepalive ที่ยังมีชีวิตที่ดูแล tag นั้น + เธรดหลักรัน `recording_preflight.js` เอง ถาม session จากไฟล์ตรง ไม่ผ่านการโหลดหน้า · ห้ามปิด keepalive เพื่อประสิทธิภาพ (idle ตัด 30 นาที)
- หยุดโปรเซสด้วย pid ที่รู้ที่มาเท่านั้น ห้าม `pkill -f`/`killall` เมื่อมีตัวจริงรัน · ตัวทดสอบห้ามชื่อไฟล์เดียวกับตัวจริง
- หน้าต่างให้คนกรอก: ยืนยันหน้าล็อกอินจริง (status < 400) + อยู่หน้าสุด + ไม่เล็กกว่า viewport + element อยู่ในกรอบ ก่อนบอก "พร้อม" · รหัสผ่านในคำสั่งใช้ `read -rs`
- ข้อมูลบัญชีอ้างจากชีทบัญชีของรอบเท่านั้น ("ไม่มี session" ≠ "ไม่มีบัญชี")
- ข้อยกเว้นเขียน production: เฉพาะแผน smoke test 2026-09 (อนุมัติ 2026-09-03) — ไม่รวม env อื่น/RGS/ค่าใช้จ่าย · ลบข้อมูลที่สร้างให้หมด (LP→course→media ขณะ DRAFT) · ห้ามร่องรอย QA ในชื่อ · destructive fixture มีคู่คืนสภาพใน ledger · หมดอายุเมื่อรอบปิด · `write_guard.js` ยัง deny ทุก env

