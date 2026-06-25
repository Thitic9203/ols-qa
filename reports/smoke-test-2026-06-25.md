# รายงาน Smoke Test — OLS Web Dev
**วันที่ทดสอบ:** 25 มิถุนายน 2569  
**Target URL:** https://ols-web-dev.ndlp.go.th/  
**ผู้ทดสอบ:** Claude Code (automated)  
**ประเภทการทดสอบ:** Smoke Test  
**สรุปผล:** ✅ ผ่าน 6/8 รายการ | ❌ พบปัญหา 2 รายการ

---

## ตารางสรุปผลการทดสอบ

| No. | Role | Topic | Result | Severity |
|-----|------|-------|--------|----------|
| 1 | Creator | เข้าสู่ระบบและโหลดหน้าแรก | ✅ ผ่าน | - |
| 2 | Creator | เมนูหลักและ Navigation | ✅ ผ่าน | - |
| 3 | Creator | หน้าสร้าง / จัดการสื่อและคอร์ส | ⚠️ ผ่าน (มีข้อสังเกต) | Low |
| 4 | Creator | หน้าตั้งค่าช่องของฉัน | ✅ ผ่าน | - |
| 5 | Learner | เข้าสู่ระบบและโหลดหน้าแรก (Trending) | ❌ ไม่ผ่าน | High |
| 6 | Learner | เมนูหลักและ Navigation | ✅ ผ่าน | - |
| 7 | Learner | เรียกดูรายการคอร์สและสื่อ (คลังสื่อ) | ✅ ผ่าน | - |
| 8 | Learner | เข้าเนื้อหาสื่อการเรียนรู้ | ✅ ผ่าน | - |

---

## รายละเอียดการทดสอบแต่ละ TC

---

### TC1 — Creator: เข้าสู่ระบบและโหลดหน้าแรก ✅

**วิธี Login:**
```javascript
await fetch("https://ols-api-dev.ndlp.go.th/api/auth/link/ndlp", {
  method: "PUT", credentials: "include",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ accessToken: "mock-ndlp-creator-token" })
});
```

**ผลลัพธ์:** API ตอบกลับ 200 พร้อม user session
```json
{ "user": { "name": "NDLP Creator", "email": "ndlp.creator@ols.local" } }
```
Session คงอยู่หลัง reload ✓ สามารถเข้าถึง `/creator` ได้ทันที

**ข้อสังเกต:** หน้าแรก `/` ยังแสดง landing page สาธารณะหลัง login ไม่มี auto-redirect ไป `/creator`

![TC1 Landing Page](screenshots/smoke-2026-06-25/tc1-00-landing.png)

---

### TC2 — Creator: เมนูหลักและ Navigation ✅

**หน้าที่ทดสอบ:** `/creator` → `/creator/course` → `/creator/learning-path` → `/creator/settings`

**เมนูที่พบ:**
- Topbar: หน้าหลัก | เส้นทางการเรียน | คลังสื่อทั้งหมด
- Sidebar (Creator): จัดการสื่อการเรียนรู้ | จัดการคอร์สเรียน | จัดการเส้นทางการเรียน | ตั้งค่าช่องของฉัน | เปลี่ยนเป็น Learner mode

**ผลลัพธ์:** เมนูครบถ้วน navigate ไปทุกหน้าได้ ไม่พบ 404 หรือ error ✓

---

### TC3 — Creator: หน้าสร้าง/จัดการสื่อและคอร์ส ⚠️

**หน้าที่ทดสอบ:** `/creator/media` และ `/creator/course`

**ผลลัพธ์ `/creator/media`:** แสดงรายการสื่อ 5 รายการ (ไฟล์เรียน, PDF 1, Video AI 101, Test, Media 1) ✓  
**ผลลัพธ์ `/creator/course`:** แสดงรายการคอร์ส 5 รายการ (คอร์สอนาคตแพทย์, คอร์สอนาคตการทูต, คอร์สพัฒนาด้านภาษา, Course 2, My Course) ✓

**ปัญหาที่พบ (Low):** Thumbnail ของสื่อทุกรายการแสดงเป็น placeholder icon เทา ไม่โหลดรูปภาพจริง

![TC3 Creator Media Management](screenshots/smoke-2026-06-25/tc3-creator-course-mgmt.png)

![TC3 Creator Course Management](screenshots/smoke-2026-06-25/tc3-creator-courses.png)

---

### TC4 — Creator: หน้าตั้งค่าช่องของฉัน ✅

**หน้าที่ทดสอบ:** `/creator/settings`

**ผลลัพธ์:** หน้า "ตั้งค่าช่องของฉัน" โหลดสำเร็จ แสดง section ยืนยัน YouTube Channel ✓  
ไม่พบ error หรือหน้าว่าง

![TC4 Creator Settings](screenshots/smoke-2026-06-25/tc4-creator-settings.png)

---

### TC5 — Learner: เข้าสู่ระบบและโหลดหน้าแรก ❌

**วิธี Login:**
```javascript
await fetch("https://ols-api-dev.ndlp.go.th/api/auth/link/ndlp", {
  method: "PUT", credentials: "include",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ accessToken: "mock-ndlp-learner-token" })
});
```

**ผลลัพธ์ Login API:** ✅ สำเร็จ — user `NDLP Learner` (session active)  

**ผลลัพธ์ หน้า Trending `/trending`:** ❌ **ERROR** — หน้าแสดง error banner:
> "ไม่สามารถโหลดข้อมูลได้: Cannot GET /trending"

Header และ navigation bar แสดงผลปกติ (เห็น avatar "N" และปุ่ม "สร้างสื่อ") แต่ main content ไม่โหลด มีปุ่ม "ลองอีกครั้ง" แต่กดแล้วยังเป็น error เหมือนเดิม

**สาเหตุที่เป็นไปได้:** API endpoint `GET /trending` ของ backend ไม่ response หรือ route ยังไม่ deploy บน dev environment

![TC5 Learner Trending Error](screenshots/smoke-2026-06-25/tc5-learner-trending.png)

---

### TC6 — Learner: เมนูหลักและ Navigation ✅

**หน้าที่ทดสอบ:** `/learning-path`, `/content`, `/me/learning`

**เมนูที่พบ (Learner sidebar):**
- เป้าหมายการเรียน: สำรวจอาชีพ | ติวสอบ | 8 กลุ่มสาระ | แนะแนวทุน | ดิจิทัล/AI | ภาษา
- สื่อการเรียนรู้: เส้นทางการเรียน | คลังสื่อ | ไลฟ์สด
- ของฉัน: การเรียนของฉัน | การติดตาม | โปรไฟล์
- เปลี่ยนเป็น Creator mode

**ผลลัพธ์:** navigate ไปทุกหน้าได้ ไม่พบ error ✓

![TC6 Learner Learning Path](screenshots/smoke-2026-06-25/tc6-learner-nav-learning-path.png)

---

### TC7 — Learner: เรียกดูรายการคอร์สและสื่อ (คลังสื่อ) ✅

**หน้าที่ทดสอบ:** `/content`

**ผลลัพธ์:** หน้า "คลังสื่อทั้งหมด" โหลดสำเร็จ
- แสดง **4,500 รายการ**
- หมวด **สื่อการเรียนรู้**: PDF 1, Video AI 101, Another, transocde, Hello, Test, Media 1, Dream101, Algebra Worksheet, Algebra Textbook ฯลฯ
- หมวด **คอร์ส**: Course 2, My Course
- หมวด **เส้นทางการเรียน**: LP 1 (Course 2 + My Course)
- Filter bar แสดงครบ: วิดีโอสั้น, วิดีโอ, เอกสาร, e-Pub, บทความ, เส้นทางการเรียน ✓

![TC7 Learner Content Catalog](screenshots/smoke-2026-06-25/tc7-learner-catalog.png)

---

### TC8 — Learner: เข้าเนื้อหาสื่อการเรียนรู้ ✅

**หน้าที่ทดสอบ:** `/content/media/019efd7f-c34a-762a-a14d-188dbdde9278` (Video AI 101)

**ผลลัพธ์:**
- Video player โหลดและแสดงผล ✓
- Metadata: ชื่อสื่อ, ยอดเข้าชม, วันที่เผยแพร่, ชื่อ Creator ✓
- Tabs: ข้อมูลเพิ่มเติม, ซับไตเติ้ล/คำบรรยาย, เอกสารสรุป, สื่ออื่นๆ ✓
- ความคิดเห็น section ✓
- สื่อที่คุณอาจสนใจ (Related content) ✓
- breadcrumb: คลังสื่อ › สื่อการเรียนรู้ › Video AI 101 ✓

![TC8 Learner Content Video](screenshots/smoke-2026-06-25/tc8-learner-content-video.png)

---

## สรุปปัญหาที่พบ

| # | ปัญหา | Severity | TC | รายละเอียด |
|---|-------|----------|----|-----------|
| 1 | Learner หน้าแรก `/trending` แสดง error | **High** | TC5 | API `GET /trending` ไม่ response — error "Cannot GET /trending" บน main content แม้ nav/header โหลดปกติ |
| 2 | Thumbnail สื่อไม่โหลด | **Low** | TC3 | รูป thumbnail ทุกรายการใน `/creator/media` แสดงเป็น placeholder icon เทา ไม่ใช่รูปจริง |

---

## ข้อสังเกตเพิ่มเติม (ไม่ใช่ bug)

- หน้า `/` ไม่ auto-redirect หลัง login — ผู้ใช้ต้อง navigate ไป `/creator` หรือ `/trending` เอง (อาจเป็น design decision)
- หน้า `/creator/settings` แสดงเฉพาะส่วน YouTube Channel verification — ยังไม่มี analytics/stats dashboard สำหรับ Creator
- Learning Path page แสดงแค่ 1 เส้นทาง (LP 1) — อาจเป็น dev seed data ปกติ

---

*รายงานนี้สร้างโดย Claude Code | Smoke Test เท่านั้น — ไม่ครอบคลุม regression หรือ edge cases*
