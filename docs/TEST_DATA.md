# 11. Test data / ปก

- ใช้ `ols-data-prep.md` (ols-qa-evidence) เท่านั้น: intake §0.0 → reuse §5–6 → gate §7+§8 → report §11 · เครื่องมือ off-repo `~/ols-qa-testing-bot/` ห้ามเขียนใหม่ · ไม่ผ่าน gate = ห้ามใช้/อัป/บอกเสร็จ
- ชื่อ+คำอธิบายเป็นเนื้อหาจริง: ห้าม QA/test/ทดสอบระบบ/placeholder/dummy · ห้ามวงเล็บสถานะท้ายชื่อ · ชื่อซ้ำ = หยุดแจ้ง user ก่อน
- ปก = ภาพถ่าย Draw Things (API `:7860` เปิดเองก่อน · ไม่มีแอป = บอก user ลง · เปิดไม่ได้ = BLOCKED) + คำไทย overlay โปรแกรม · ห้ามพื้นเรียบ/gradient/PIL/doodle/pattern · สูตร §5.7.2 · reuse `.dt_bg_cache` ก่อน · 1536×896 · subject เดี่ยวใกล้กล้อง ไม่มีตัวอักษร ไม่ deform · โทนตาม PALETTE ไม่น้ำตาลล้วน · คม = res/unsharp ไม่แตะโทน · shrink-to-fit · ตัดคำไทยไม่พรากคำประสม · ซูม 100% ตรวจ · ตัวอย่างให้ user อนุมัติก่อน · จด comment ทุกข้อ
- gate ปก 5 ชั้น (แหล่ง · ตรงเนื้อหา · ไม่มี text โมเดล · คำไทยถูก · เทียบ lot จริง) + gate ปกติดจริง 5 ชั้น (`coverImageKey` ทุกชิ้น · readback ไม่ null · URL 200 image · sweep null=0 · guest เห็นจริง) · LP PUBLISHED: `PATCH request-edit` → `PUT` → `POST publish` ห้ามค้าง PENDING_EDIT
- วิดีโอ = motion-graphics (§5.7.2F) เสียง `th-TH-NiwatNeural` ≤25MB ห้ามสไลด์นิ่ง

