# 8. Jira / Confluence

- เขียน Jira ทุกชนิดผ่าน API token ของเจ้าของงาน (`command curl` + `--cacert` ตาม secrets) ห้ามเขียนผ่าน Atlassian MCP (อ่านได้) · ก่อนเขียนครั้งแรกยืนยัน `GET /rest/api/3/myself` · token เสีย = หยุดถาม
- สร้าง ticket/issue/หน้าใหม่ = แสดงร่างแล้วถามทุกครั้ง (jira-ticket-guard: `check.js --confirm`)
- เรียก Jira issue ว่า "ticket" ห้ามใช้ "ตั๋ว" · improvement ≠ issue/bug
- QA Task (ไม่รวม Bug): summary `[QA Task][OLS][<Component>]` ห้าม `[Improve]` · 5 หัวข้อ: ปัญหา (ปิดด้วยตรวจที่ไหน/เมื่อไหร่/อย่างไร) · สาเหตุ · แนวทางแก้ (ใครทำอะไร) · ป้องกัน (ใครทำอะไร) · หมายเหตุ (bullet สุดท้าย = ผลกระทบต่อผู้ใช้หากไม่แก้) · แนบรูป+log · กระชับ 1 ประเด็น 1 bullet · ตัวอย่าง OLS-599/605
- ตัวเลขเป็นเลขอารบิกเว้นวรรคเสมอ ห้ามสะกดคำไทย (ทุกช่องทาง)
- Bug: custom field เดิม (Actual/Expected เป็น bullet + `!image!`) ตาม `references/ols-project-guide.md`
- Jira table: ห้าม `<br>` · ห้ามขึ้น cell ด้วย `1.` ใช้ `**1.**` · v2 wiki ห้าม markdown (`**` `---` `| --- |`) ใช้ `||h||` · escape `{word}` · footer ลิงก์ไฟล์แนบ · แก้คอมเมนต์ in place ห้ามลบโพสต์ใหม่ · ร่างตามคอมเมนต์ล่าสุดของโปรเจกต์
- แนบไฟล์ (interactive เท่านั้น): `Control_Chrome__execute_javascript` + FormData `/rest/api/3/issue/KEY/attachments` `.then()` ไม่มี await · bot headless ใช้ REST
- Confluence: อ่าน restriction ด้วย `content/{id}?expand=restrictions.read…,restrictions.update…` ห้ามใช้ `restriction/byOperation` · descendants ใส่ `depth` · space permission วน `_links.next` · เขียนหน้าที่มีอยู่ใช้ ADF หรือ storage REST v2 ห้าม `html` · baseline+นับ element ก่อน/หลัง ต้องไม่ลด · แก้ section ไล่ข้อความอ้างอิงบนหน้าให้ครบ · `body-format=view` ไม่เท่ากับเห็นด้วยตา

