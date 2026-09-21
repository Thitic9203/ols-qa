# 13. Discord / SFD

- โนติ QA: ฟอร์แมต canonical (`🔔 **QA Review Requested**` + count line ตัวหนา + bullet + link + owner) ผ่าน `discord_qa_notify.py` เท่านั้น ห้ามปรับ/เติมบรรทัดเอง · escape `_ * ~~ \` |` · `--dry-run` + เทียบข้อความล่าสุดในช่องทีละบรรทัด · owner จาก Jira `customfield_12120` สดด้วย accountId ห้าม Reporter · `--registry` · แก้ผิดด้วย PATCH ไม่ลบโพสต์
- ทางสำรองห้ามเปลี่ยน "ใครพูด/ที่ไหน" · ไบนารีภายนอกหาด้วย path สัมบูรณ์
- โนติ `Needs fix` = แก้เองจนจบบน pre-prod (reversible ก่อน ลบเมื่อทางเดียว) แล้ว PATCH `Fixed` เมื่อสแกนสดยืนยัน · แก้ไม่ได้ใส่ FYI · ไม่รวม RGS/training
- SFD: ทุก workflow ห้ามเฟลเงียบ · job ใหม่ลง `sfd/workflows.json` (+`trap_wired`, `max_stale_s`) · plist `StandardErrorPath` = `StandardOutPath` · watchdog > timeout+retry · network token retry 4 ครั้ง · ห้าม `|| true` · เลิก job ต้องถอด label · แตะ plist: backup + `plistlib` ห้าม `plutil -extract` ไม่มี `-o -` · ได้ alert = root cause → fix → rerun → บันทึก · แจ้งทาง DM user คนเดียว · รายละเอียดระดับ: archive
- job ตามตารางต้องพิสูจน์ว่าล้มแล้วดังจริง รหัสจบต้องเป็นของงานจริง · `log_file` ชี้ไฟล์ที่มีไบต์จริง · alert ต้องบอกผลกระทบ ไม่ใช่ exit code
- ชีท: อ้างแท็บด้วย gid/case-insensitive คอลัมน์จาก header (PM-010) ห้ามสร้างแท็บเมื่อไม่เจอแบบ exact

