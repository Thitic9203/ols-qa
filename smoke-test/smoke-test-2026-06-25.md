# รายงาน Smoke Test — OLS Web Dev
**วันที่ทดสอบ:** 25 มิถุนายน 2569  
**Target URL:** https://ols-web-dev.ndlp.go.th/  
**ผู้ทดสอบ:** Claude Code (automated)  
**ประเภทการทดสอบ:** Smoke Test  
**สรุปผล:** ✅ ผ่าน 6/8 รายการ | ❌ พบปัญหา 2 รายการ  
**แผนงาน:** [plan-smoke-test.md](plan-smoke-test.md)

---

## ตารางสรุปผลการทดสอบ

| No. | Role | Topic | Result | Severity |
|-----|------|-------|--------|----------|
| 1 | Creator | เข้าสู่ระบบและโหลดหน้าแรก | ✅ ผ่าน | - |
| 2 | Creator | เมนูหลักและ Navigation | ✅ ผ่าน | - |
| 3 | Creator | หน้าสร้าง / จัดการสื่อและคอร์ส | ⚠️ ผ่าน (มีข้อสังเกต) | Low |
| 4 | Creator | หน้าตั้งค่าช่องของฉัน | ✅ ผ่าน | - |
| 5 | Learner | เข้าสู่ระบบและโหลดหน้าแรก (Trending) | ❌ ไม่ผ่าน | **High** |
| 6 | Learner | เมนูหลักและ Navigation | ✅ ผ่าน | - |
| 7 | Learner | เรียกดูรายการคอร์สและสื่อ (คลังสื่อ) | ✅ ผ่าน | - |
| 8 | Learner | เข้าเนื้อหาสื่อการเรียนรู้ | ✅ ผ่าน | - |

---

## รายละเอียดการทดสอบแต่ละ TC

### TC1 — Creator: เข้าสู่ระบบและโหลดหน้าแรก ✅

**วิธี Login (console JS):**
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
Session คงอยู่หลัง reload ✓ เข้าถึง `/creator` ได้ทันที

**ข้อสังเกต:** หน้าแรก `/` ยังแสดง landing page สาธารณะหลัง login — ไม่มี auto-redirect ไป `/creator`

![TC1 Landing Page](../reports/screenshots/smoke-2026-06-25/tc1-00-landing.png)

---

### TC2 — Creator: เมนูหลักและ Navigation ✅

**หน้าที่ทดสอบ:** `/creator` → `/creator/course` → `/creator/learning-path` → `/creator/settings`

**เมนูที่พบ:**
- Topbar: หน้าหลัก | เส้นทางการเรียน | คลังสื่อทั้งหมด
- Sidebar (Creator): จัดการสื่อการเรียนรู้ | จัดการคอร์สเรียน | จัดการเส้นทางการเรียน | ตั้งค่าช่องของฉัน | เปลี่ยนเป็น Learner mode

**ผลลัพธ์:** เมนูครบถ้วน navigate ได้ทุกหน้า ไม่พบ 404 หรือ error ✓

---

### TC3 — Creator: หน้าสร้าง/จัดการสื่อและคอร์ส ⚠️

**หน้าที่ทดสอบ:** `/creator/media` และ `/creator/course`

| หน้า | ผล | รายละเอียด |
|------|-----|-----------|
| `/creator/media` | ✅ | แสดง 5 รายการ: ไฟล์เรียน, PDF 1, Video AI 101, Test, Media 1 |
| `/creator/course` | ✅ | แสดง 5 คอร์ส: คอร์สอนาคตแพทย์, คอร์สอนาคตการทูต, คอร์สพัฒนาด้านภาษา, Course 2, My Course |

**ปัญหา (Low):** Thumbnail ทุกรายการแสดงเป็น placeholder icon เทา — รูปจริงไม่โหลด

![TC3 Creator Media](../reports/screenshots/smoke-2026-06-25/tc3-creator-course-mgmt.png)
![TC3 Creator Courses](../reports/screenshots/smoke-2026-06-25/tc3-creator-courses.png)

---

### TC4 — Creator: หน้าตั้งค่าช่องของฉัน ✅

**หน้าที่ทดสอบ:** `/creator/settings`

**ผลลัพธ์:** หน้า "ตั้งค่าช่องของฉัน" โหลดสำเร็จ แสดง section ยืนยัน YouTube Channel ✓

![TC4 Creator Settings](../reports/screenshots/smoke-2026-06-25/tc4-creator-settings.png)

---

### TC5 — Learner: เข้าสู่ระบบและโหลดหน้าแรก ❌

**วิธี Login (console JS):**
```javascript
await fetch("https://ols-api-dev.ndlp.go.th/api/auth/link/ndlp", {
  method: "PUT", credentials: "include",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ accessToken: "mock-ndlp-learner-token" })
});
```

**ผลลัพธ์ Login API:** ✅ สำเร็จ — user `NDLP Learner` (session active)

**ผลลัพธ์ หน้า `/trending`:** ❌ ERROR — error banner:
> **"ไม่สามารถโหลดข้อมูลได้: Cannot GET /trending"**

Header/navbar แสดงปกติ (avatar "N" + ปุ่ม "สร้างสื่อ") แต่ main content ไม่โหลด  
ปุ่ม "ลองอีกครั้ง" กดแล้วยังเป็น error เหมือนเดิม

**สาเหตุที่เป็นไปได้:** API endpoint `GET /trending` ของ backend ไม่ response บน dev environment

![TC5 Trending Error](../reports/screenshots/smoke-2026-06-25/tc5-learner-trending.png)

---

### TC6 — Learner: เมนูหลักและ Navigation ✅

**หน้าที่ทดสอบ:** `/learning-path`, `/content`

**Sidebar Learner:**
- เป้าหมายการเรียน: สำรวจอาชีพ | ติวสอบ | 8 กลุ่มสาระ | แนะแนวทุน | ดิจิทัล/AI | ภาษา
- สื่อการเรียนรู้: เส้นทางการเรียน | คลังสื่อ | ไลฟ์สด
- ของฉัน: การเรียนของฉัน | การติดตาม | โปรไฟล์
- เปลี่ยนเป็น Creator mode

**ผลลัพธ์:** navigate ได้ทุกหน้า ไม่พบ error ✓

![TC6 Learning Path](../reports/screenshots/smoke-2026-06-25/tc6-learner-nav-learning-path.png)

---

### TC7 — Learner: เรียกดูรายการคอร์สและสื่อ ✅

**หน้าที่ทดสอบ:** `/content`

**ผลลัพธ์:** "คลังสื่อทั้งหมด" โหลดสำเร็จ — **4,500 รายการ**
- สื่อการเรียนรู้: PDF, วิดีโอ, เอกสาร ✓
- คอร์ส: Course 2, My Course ✓
- เส้นทางการเรียน: LP 1 ✓
- Filter bar ครบทุก type ✓

![TC7 Content Catalog](../reports/screenshots/smoke-2026-06-25/tc7-learner-catalog.png)

---

### TC8 — Learner: เข้าเนื้อหาสื่อการเรียนรู้ ✅

**หน้าที่ทดสอบ:** `/content/media/019efd7f-c34a-762a-a14d-188dbdde9278` (Video AI 101)

**ผลลัพธ์:**
- Video player โหลดและแสดงผล ✓
- Metadata: ชื่อสื่อ, ยอดเข้าชม, วันที่, Creator name ✓
- Tabs: ข้อมูลเพิ่มเติม | ซับไตเติ้ล | เอกสารสรุป | สื่ออื่นๆ ✓
- ความคิดเห็น + Related content ✓
- Breadcrumb ✓

![TC8 Content Video](../reports/screenshots/smoke-2026-06-25/tc8-learner-content-video.png)

---

## สรุปปัญหาที่พบ

| # | ปัญหา | Severity | TC |
|---|-------|----------|----|
| 1 | Learner หน้าแรก `/trending` แสดง error "Cannot GET /trending" | **High** | TC5 |
| 2 | Thumbnail สื่อทุกรายการใน creator ไม่โหลด แสดง placeholder เทา | Low | TC3 |

## ข้อสังเกตเพิ่มเติม

- หน้า `/` ไม่ auto-redirect หลัง login (อาจเป็น design decision)
- Creator ยังไม่มี analytics/stats dashboard
- Learning Path มีแค่ 1 เส้นทาง (dev seed data)

---

*Smoke Test เท่านั้น — ไม่ครอบคลุม regression หรือ edge cases*  
*Screenshots: `reports/screenshots/smoke-2026-06-25/`*
