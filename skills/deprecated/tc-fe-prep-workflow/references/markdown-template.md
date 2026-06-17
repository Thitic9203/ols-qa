# Markdown template — FE test cases

Replace placeholders. Keep one table row per test case. Content is **Thai** (Step 3b) — the
sample below uses Thai prose; keep `{PLACEHOLDERS}` as-is.

The **Type** column is always present (`System Test` / `Unit Test` / `Integration Test`).

```markdown
Draft TC FE as below

**Shared data preparation (all TCs):**

1. เข้าสู่ระบบ {PORTAL} ด้วยบทบาท {ROLE}.
2. ไปที่ {FEATURE_AREA}.
3. เปิดแท็บ **{TAB_NAME}**.
4. ตรวจสอบว่ามี {ENTITY} อย่างน้อยหนึ่งรายการในสถานะ **{STATE}** (ถ้าไม่มี: {SEED_STEPS_REF_OTHER_STORY}).
5. ใช้ {ENTITY} เป้าหมายชื่อ **{ENTITY_NAME}** สำหรับทุกเคสด้านล่าง.

**Note — Precondition column:** Complete shared prep above first. Precondition lists anything else required before Test Steps for that case.

| **Acceptance Criteria** | **Services Impacted** | **Test Case ID** | **Test Title** | **Precondition** | **Test Data** | **Test Steps** | **Expected Result** | **Priority** | **Type** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_01: {AC_SUMMARY} | - {SERVICE} | TC_{Feature}_01 | {TITLE} | 1. ทำ shared prep (ข้อ 1–5) ครบแล้ว<br>2. {EXTRA_PRE} | 1. {DATA} | 1. {STEP}<br>2. {STEP} | 1. {EXPECTED}<br>2. {EXPECTED} | High | System Test |

**Remark — Type coverage:**
- No *Integration Test* cases for this ticket.
- No *Unit Test* cases for this ticket.
```

Allowed Type values: `System Test` | `Unit Test` | `Integration Test`. List only absent types in the Remark.

> Up to 5 CSV files are produced from this table and uploaded to Jira:
> - `Draft_Jira_{ISSUE_KEY}.csv` — same 10-column schema as this table (Jira comment format)
> - `Import_Qase_{ISSUE_KEY}.csv` — Qase schema (AC/EC, Title, Preconditions, Priority, Type, Status=`Done`, Suite, Steps, Tags) — see [qase-import-format.md](qase-import-format.md)
> - `Unit_Test_{ISSUE_KEY}.csv` — 10-column, filtered to Unit Test rows only *(generated only if Unit Test TCs exist)*
> - `Integration_Test_{ISSUE_KEY}.csv` — 10-column, filtered to Integration Test rows only *(generated only if Integration Test TCs exist)*
> - `System_Test_{ISSUE_KEY}.csv` — 10-column, filtered to System Test rows only *(generated only if System Test TCs exist)*
>
> All generated files are uploaded to Jira and linked in the comment footer (📎 **Attachments:**).
>
> **Precondition in CSV files (all 5):** Unlike the Jira comment table, CSV files are standalone — no shared-prep block above the table. The Precondition cell must contain the full shared prep steps expanded inline (numbered continuously), followed by any per-case steps. See WORKFLOW.md Step 3e.

---

## Precondition examples

**List-only case (menu):**

```text
1. ทำ shared prep (ข้อ 1–5) ครบแล้ว<br>2. อยู่ที่ {FEATURE_AREA} แท็บ **{TAB}**<br>3. เห็นแถวเป้าหมายของ **{ENTITY_NAME}**
```

**Edit form already open:**

```text
1. ทำ shared prep (ข้อ 1–5) ครบแล้ว<br>2. เปิดฟอร์มแก้ไขของ **{ENTITY_NAME}** อยู่
```

**Depends on prior case:**

```text
1. ทำ shared prep (ข้อ 1–5) ครบแล้ว<br>2. ทำขั้นตอนถึง TC_{Feature}_07 ครบแล้ว; {MODAL} เปิดอยู่
```
