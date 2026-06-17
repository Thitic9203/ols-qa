# TC FE — CSV Template Types

Template analysis from OLS project. Used by `tc-fe-prep-workflow` when generating CSV exports.  
Source templates: provided by user 2026-06-17.

---

## Overview

3 template types exist — each has different columns, row structure, and language:

| Type | Language | Columns | Row structure | Summary footer | Typical row cap |
|------|----------|---------|---------------|---------------|-----------------|
| **Unit Test** | English | 13 | Function/SubFunction groupings | No | Open-ended |
| **Integration Test** | Thai | 9 | Sequential numbered (empty) | Yes | ~330 |
| **System Test** | Thai | 9 | Sequential numbered (empty) | Yes | ~800 |

---

## Template 1 — Unit Test

**File naming pattern:** `Unit Test - {TC_ID} {feature}.csv`

### Columns (13, English)

```
No. | Sub Function | Test Scenario | Test Description | Pre-condition | Test Step | Test Data | Expected Result | Actual Result | Test status | Test Date | Test By | Comment
```

### Row structure

Has **section header rows** mixed in (not data rows):

| Row type | Example | Purpose |
|----------|---------|---------|
| Function header | `"Function : การจัดการสื่อดิจิทัลเพื่อการเรียนรู้ (Digital Media Management System)"` | Groups test cases by TOR function |
| Sub Function header | `Sub Function : สื่อการเรียนรู้ประเภทหนังสือดิจิทัล (Digital Textbook Management)` | Groups test cases by sub-feature |
| Data row | `1, ..., <test content>` | Actual test case |

Header rows span across columns (only col 1 populated, rest empty). Data rows are numbered sequentially within each sub-function.

### No summary footer

---

## Template 2 — Integration Test

**File naming pattern:** `Integration Test - {TC_ID} {feature}.csv`

### Columns (9, Thai)

```
ลำดับ | โมดูล | รายการทดสอบ | ขั้นตอนการทดสอบ | ผลการทดสอบที่คาดหวัง | ผลการทดสอบ | วันที่ทดสอบ | ผู้ทดสอบ | หมายเหตุ
```

### Row structure

- Sequential numbered rows from 1 to N (all content columns empty in template)
- No section grouping headers
- Typical N: **330 rows**

### Summary footer (after data rows)

Appended after the last numbered row, separated by 1 blank row:

```
,,,,รวม,0,,,
,,,,ผ่าน,0,,,
,,,,ไม่ผ่าน,0,,,
,,,,การทดสอบ (%),#DIV/0!,,,
,,,,ผ่านการทดสอบ (%),#DIV/0!,,,
```

Footer cells are in column 5 (ผลการทดสอบที่คาดหวัง) for label, column 6 (ผลการทดสอบ) for value.

---

## Template 3 — System Test

**File naming pattern:** `System Test - {TC_ID} {feature}.csv`

### Columns (9, Thai)

Same as Integration Test:

```
ลำดับ | โมดูล | รายการทดสอบ | ขั้นตอนการทดสอบ | ผลการทดสอบที่คาดหวัง | ผลการทดสอบ | วันที่ทดสอบ | ผู้ทดสอบ | หมายเหตุ
```

### Row structure

- Sequential numbered rows from 1 to N (all content columns empty in template)
- No section grouping headers
- Typical N: **800 rows**

### Summary footer

Identical to Integration Test footer (same 5 rows, same columns).

---

## Column mapping — Thai ↔ English reference

| Thai (Int/Sys) | English equivalent | Unit Test column |
|---------------|-------------------|-----------------|
| ลำดับ | Sequence / No. | No. |
| โมดูล | Module | Sub Function |
| รายการทดสอบ | Test Case Title | Test Scenario |
| ขั้นตอนการทดสอบ | Test Steps | Test Step |
| ผลการทดสอบที่คาดหวัง | Expected Result | Expected Result |
| ผลการทดสอบ | Actual Result | Actual Result |
| วันที่ทดสอบ | Test Date | Test Date |
| ผู้ทดสอบ | Tester | Test By |
| หมายเหตุ | Comments | Comment |
| *(not present)* | Pre-condition | Pre-condition |
| *(not present)* | Test Data | Test Data |
| *(not present)* | Test Description | Test Description |
| *(not present)* | Test status | Test status |

---

## Plan: upgrade `tc-fe-prep-workflow` to generate typed CSVs

### Goal

`tc-fe-prep-workflow` currently exports one CSV format (Thai columns, from `csv-export-rules.md`).  
It needs to ask which type the user wants and generate the correct template + content.

### Intake change (Step 1 addition)

Add a new prompt after TC_ID / feature confirmation:

> "ต้องการสร้าง CSV แบบไหน?  
> 1. Unit Test (English, 13 columns, grouped by Sub Function)  
> 2. Integration Test (Thai, 9 columns, 330 rows)  
> 3. System Test (Thai, 9 columns, 800 rows)"

Save the answer as `{csv_type}` = `unit` | `integration` | `system`.

### CSV generation change (export step)

Branch on `{csv_type}`:

#### If `unit`:
1. Build header: `No., Sub Function, Test Scenario, Test Description, Pre-condition, Test Step, Test Data, Expected Result, Actual Result, Test status, Test Date, Test By, Comment`
2. For each Sub Function group → insert a Function header row + Sub Function header row (single cell across 13 columns, rest empty)
3. Populate data rows sequentially within each group
4. **No summary footer**
5. Filename: `Unit Test - {ISSUE_KEY} {feature_name}.csv`

#### If `integration`:
1. Build header: `ลำดับ, โมดูล, รายการทดสอบ, ขั้นตอนการทดสอบ, ผลการทดสอบที่คาดหวัง, ผลการทดสอบ, วันที่ทดสอบ, ผู้ทดสอบ, หมายเหตุ`
2. Populate data rows with sequential ลำดับ, fill columns with prepared content *(depends on open question #1 — filled vs blank)*
3. Append **1 blank row** then the 5-row summary footer
4. Write with UTF-8 BOM (`encoding='utf-8-sig'`) — required for Thai columns to open correctly in Excel
5. Filename: `Integration Test - {ISSUE_KEY} {feature_name}.csv`

#### If `system`:
1. Same columns and structure as Integration Test (including UTF-8 BOM)
2. Row count matches content only — 800 is the template cap reference, not a generation target (see open question #1 below)
3. Filename: `System Test - {ISSUE_KEY} {feature_name}.csv`

### Summary footer Python snippet

```python
# Append after last data row (Integration + System only)
writer.writerow([""] * 9)  # blank separator row
summary = [
    ["", "", "", "", "รวม", "0", "", "", ""],
    ["", "", "", "", "ผ่าน", "0", "", "", ""],
    ["", "", "", "", "ไม่ผ่าน", "0", "", "", ""],
    ["", "", "", "", "การทดสอบ (%)", "#DIV/0!", "", "", ""],
    ["", "", "", "", "ผ่านการทดสอบ (%)", "#DIV/0!", "", "", ""],
]
for row in summary:
    writer.writerow(row)
```

### Function/Sub Function header row snippet (Unit Test only)

```python
# Header rows for Unit Test — insert before each group's data rows
# Pass bare name (no prefix) — functions prepend "Function : " / "Sub Function : " automatically
def write_function_header(writer, function_name: str, n_cols: int = 13):
    row = [f"Function : {function_name}"] + [""] * (n_cols - 1)
    writer.writerow(row)

def write_subfunction_header(writer, subfunction_name: str, n_cols: int = 13):
    row = [f"Sub Function : {subfunction_name}"] + [""] * (n_cols - 1)
    writer.writerow(row)
```

### Comment text link addition (after existing attachments)

After generating typed CSVs, the skill appends attachment text links to the Jira story comment.  
The existing comment already contains links for `Draft_Jira_{ISSUE_KEY}.csv` and `Import_Qase_{ISSUE_KEY}.csv`.  
The three new files must be appended **after** those existing links, in this order:

| File | Attached when |
|------|--------------|
| `Unit_Test_{ISSUE_KEY}.csv` | `{csv_type}` = `unit` |
| `Integration_Test_{ISSUE_KEY}.csv` | `{csv_type}` = `integration` |
| `System_Test_{ISSUE_KEY}.csv` | `{csv_type}` = `system` |

**Link format** (same pattern as existing attachment links in the comment footer):

```markdown
[Unit_Test_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ATTACHMENT_ID}/Unit_Test_{ISSUE_KEY}.csv)
[Integration_Test_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ATTACHMENT_ID}/Integration_Test_{ISSUE_KEY}.csv)
[System_Test_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ATTACHMENT_ID}/System_Test_{ISSUE_KEY}.csv)
```

Only the link for the selected `{csv_type}` is added — do not add all three at once.

**Implementation note:** Upload the CSV via browser JS (Control Chrome fetch — see CLAUDE.md workaround), retrieve the attachment ID from the response, then append the markdown text link to the existing comment footer.

### Comment disclaimer footer

After all attachment text links are appended, close the comment with this exact line:

```
⚠️ Disclaimer: ข้อมูลนี้เป็นเพียง Draft Version ที่ได้จากการใช้ Skill เท่านั้น (TC ครบตาม AC & EC) เนื้อหาทั้งหมดจำเป็นต้องได้รับการรีวิวและอัปเดตโดยทีม QA ก่อนนำไปใส่ในไฟล์เอกสารส่งมอบ และทำการนำ TC ไป Import เข้าสู่ Qase.io
```

Position: last line of the Jira comment, after all attachment links. Do not add it before the links.

---

### Files to update

**Implemented 2026-06-17** — commit `4aac78f`

| File | Change | Status |
|------|--------|--------|
| `skills/deprecated/tc-fe-prep-workflow/WORKFLOW.md` | Add csv_type intake question + branch export logic | **Done** |
| `references/csv-export-rules.md` | Add section for typed export; fix link | **Done** |
| `references/csv-template-types.md` | Template spec moved here; WORKFLOW.md links to it | **Done** |

> **Note:** Typed CSVs (Unit/Integration/System) are **not** Qase import format — they are QA deliverable artifacts separate from `Import_Qase_{ISSUE_KEY}.csv`. No Qase schema conflict.

### Open questions

- [x] **[RESOLVED]** Blank vs filled template → **blank** — row numbers + structure only, content columns empty. Format source of truth: [`references/csv-template-types.md`](../../references/csv-template-types.md). Do not ask user.
- [x] **[RESOLVED]** Unit Test group headings → user provides manually. WORKFLOW.md Step 6 asks user for Function/Sub Function names before generating if not yet provided.
- [ ] For Integration/System Test: does the TC content map 1:1 to rows, or do multi-step TCs expand to multiple rows?
- [ ] Is "ลำดับ" a running number across the whole file, or reset per โมดูล?
