---
name: tc-change-format-workflow
description: |-
  Copy each ticket's TCs from a Google Sheet tab into a new sheet from the release TC template in the chosen release folder; keep template styling, fill mapped columns only, owners as people tags.
  Use when given TC sheet links and asked to change TC format / move to the release template, or /tc-change-format, เปลี่ยนฟอร์แมต TC, ย้าย TC ลง template.
  Do NOT use for writing, reviewing or recording TCs.
---

# TC change format

Also triggers on: move tc to template.

Announce once: `Using **tc-change-format-workflow** to copy the TC tab into the release template.`

Talk to the user in their language and ask every question in that language. Never write to Drive or Sheets before step 6 is confirmed.

## Contents

- [Refusal-first (precondition gate)](#refusal-first-precondition-gate) · [Project config](#project-config) · [Tools required](#tools-required) · [Column mapping](#column-mapping-template--source)
- [Several tabs in one request](#several-tabs-in-one-request) · [File already made — update mode](#file-already-made--update-mode)
- Steps: [1 Intake](#1-intake) · [2 Resolve the tab](#2-resolve-the-tab) · [3 File name](#3-card-title--file-name) · [4 Read source](#4-read-the-source-tab) · [5 Release folder](#5-pick-the-release-folder) · [6 Confirm](#6-confirm-before-writing) · [7 Create](#7-create) · [8 Fill](#8-fill--copy-never-retype) · [9 Tidy](#9-tidy-the-sheet) · [10 Verify](#10-verify--in-the-sheet-with-a-control) · [11 Report](#11-report) · [12 Record in the tracking sheet](#12-record-in-the-tracking-sheet-final-confirm)
- [QA closing (mandatory before "done")](#qa-closing-mandatory-before-done)

## Refusal-first (precondition gate)

MUST NOT write anything without all of:

- every **TC sheet link** with a tab, readable this session;
- the **card** for each tab (Jira link, or the user's go-ahead to read the card whose key equals the tab name);
- the project config values below, and an e-mail for every owner name;
- the Google Sheets and Google Drive connectors, authenticated.

Missing any, stop in one message and ask for exactly what is missing.

## Project config

All project values come from the **user's** `references/*-guide.md` in the workspace (section "TC change format"), or are asked in the session and then saved there. Never read them from the Helix repo.

| Value | Meaning |
|---|---|
| `{TC_TEMPLATE_SHEET}` | The release TC template as a **Google Sheet** (one tab, header in row 1, row 2 a formatted sample row) |
| `{TC_RELEASE_ROOT_FOLDER}` | Drive folder whose sub-folders are the releases (default name pattern `Release <DD>_<Mon>`) |
| `{TC_OWNER_EMAIL_MAP}` | Owner name → Google account e-mail, for people tags — keep it outside any public repo |
| `{TC_TRACKING_SHEET}` | Optional. The sheet where each delivered TC file gets a row (step 12) |
| `{TC_TRACKING_BUG_TAB}` · `{TC_TRACKING_CR_TAB}` · `{TC_TRACKING_IMPROVEMENT_TAB}` | With the tracking sheet: the tab for each card kind (step 12.1) |
| `{TC_TRACKING_COLUMN_RULES}` | With the tracking sheet: header name → value rule, per tab (step 12.4) |
| Column mapping / value rules | Optional override of the defaults below |

If a value is missing, ask the user. Never guess an ID or an e-mail.

Use a Google Sheet template, not an `.xlsx` uploaded by base64: retyping base64 is not reliable (a 14 KB file came back 30 bytes longer in testing) and an xlsx loses dropdown colours.

## Tools required

- Google Sheets connector (`get_spreadsheet`, `get_values`, `copy_sheet_to_another_spreadsheet`, `update_spreadsheet`, `update_values`, `update_formulas`)
- Google Drive connector (`search_files`, `copy_file`, `create_file`)
- Jira connector, read only — for the card title

If a connector is missing or not authenticated, stop and tell the user to run `/mcp` and connect it.

## Column mapping (template ← source)

Default mapping (from the first project that used this workflow). Headers are compared after trimming, collapsing inner spaces and ignoring case. The project guide may override it.

| Template column | Source column | Rule |
|---|---|---|
| Test Case ID | Test Case ID | copy |
| Module / Feature | Services Impacted | copy |
| Test Title | Test Title | copy |
| Test Type | Acceptance Criteria | `AC_…` → `Core` · `EC_…` → `Edge` · anything else → stop and ask |
| Precondition | Precondition | copy |
| Test Data | Test Data | copy |
| Test Steps | Test Steps | copy |
| Expected Result | Expected Result | copy |
| Test Status | Test Status | `NOT STARTED` → `NO RUN` · a value already in the dropdown → copy · anything else → stop and ask |
| Test Result Link | Capture Screen Link | copy; keep the URL if the cell has one (step 4) |
| Linked Bug (if any) | Linked Bug | copy; keep the URL if the cell has one |
| Owner | QA Owner | people tag (step 8) |
| Comments/Notes | Remark | copy |

A template column with a strict dropdown cannot take a value outside its list — map it by a rule or ask.
Source columns not in the table are not copied — list them in the final report.
Keep every template column, even when it has no data.

## Several tabs in one request

The user may send several TC links at once (tabs of one spreadsheet or of different spreadsheets). Every file goes to the **same** release folder unless the user names a release per link.

1. **Read everything first.** Run steps 1–4 for every tab before any write. Collect every open question (missing card, unknown owner e-mail, a value no rule covers, a key that does not match its tab) and ask them **together in one message**. Do not start writing while a question is open.
2. **One release pick** (step 5) for the whole request.
3. **One confirmation** (step 6) as a table, one row per tab: tab · mode (new / update / no change) · file name and where · N · rule counts (e.g. Core/Edge) · owners · for update: cells changed, cases added, cases gone.
4. **One tab at a time.** For each confirmed tab, in order, run steps 7–10 completely (search for an existing file again in the same turn → create or update → fill → tidy → verify) before starting the next. Never run two tabs' writes at once — the counts and temporary tabs must not mix.
5. **A failure stays in its tab.** If a tab fails during steps 7–10, stop work on that tab, leave its file as it is (do not delete it without the user), record what failed, and continue with the next tab.
6. **One report** at the end (step 11) as a table, one row per tab: file link · rows N/N · cells X/Y · tags X/N · borders X/Y · status (created / updated / no change / skipped / failed + reason). Then ask the user to open the files and confirm what can only be seen.

## File already made — update mode

Before step 5, search **every** release folder for a file whose name starts with `<KEY> ` (the card name in Jira may have changed). Use `search_files` per release folder (`parentId = '<release id>' and title contains '<KEY> '`), following `next_page_token`.

- **Not found** → normal run (new file).
- **More than one found** → list them with their release and ask which one to update.
- **One found** → compare it with the source (work owner decisions, 2026-10-17):
  1. Copy the source tab into the **existing** file as a temporary tab and build the expected table there (rule columns, owner names).
  2. Match rows by `Test Case ID`. In a temporary `chk` tab, flag per row: case added (in source, not in file) · case gone (in file, not in source) · cells that differ, per column. Compare **all 13 columns** — the source wins on every column, including results such as `Test Status`, links and comments. Owner: compare the chip e-mail with the mapped e-mail. Also compare the file name with `<KEY> <current card summary>`.
  3. Read the flags (numbers only, no retyping), then delete the temporary tabs.
  - **Nothing differs** → write nothing. Tell the user the file already exists, with its release folder and link, and that it is up to date.
  - **Something differs** → show the differences as a table (case · column · now in file → from source; cases added; cases gone; new file name if the card was renamed) and wait for a yes.
    - Cases gone from the source are **never deleted without asking** — list them and ask: delete or keep. Kept cases stay after the source rows.
4. After the yes: save kept rows (if any) to a temporary tab with `copyPaste`; rewrite rows 2…N+1 from the source exactly as step 8 does (insert rows by copying the format of row 2, or delete surplus rows); put kept rows back after them; rename the file if asked; then run step 9 (tidy) and step 10 (verify) on the whole table.
5. Report **"updated"** with the file link and what changed (cells changed X, cases added Y, cases deleted Z / kept W) plus the step 10 numbers.

## Steps

### 1. Intake

Need, for every tab:
- **TC sheet link** with a tab (`…/spreadsheets/d/<id>/edit?gid=<gid>`)
- **Card** — a Jira link, or the user's go-ahead to read the card whose key equals the tab name

Ask for whichever is missing. If a sheet link has no `gid`, ask for the tab name.
More than one link → follow [Several tabs in one request](#several-tabs-in-one-request) around steps 1–11.

### 2. Resolve the tab

- `get_spreadsheet` with `fields: ["sheets.properties.sheetId","sheets.properties.title"]`.
- Find the sheet whose `sheetId` equals the `gid`. Not found → stop and show the user the tab list.
- The card key must equal the tab title. If they differ, stop and ask.

### 3. Card title → file name

- Read the card (read only) and take `summary` verbatim.
- File name = `<KEY> <summary>` with one space, e.g. `{ISSUE_KEY} [SIT][ABC] Some feature`.

### 4. Read the source tab

- `get_values` on `'<tab>'!A1:ZZ`. Row 1 is the header. Every source column in the mapping must be present; a missing one → note it.
- Data rows = rows below the header with a non-empty `Test Case ID`. Count them (N).
- Check every value that a rule maps; collect anything that needs a question.
- Every distinct owner name must be in `{TC_OWNER_EMAIL_MAP}`. A missing name → ask the user for that person's e-mail and save it in the map.
- **Links travel with the cell.** For the link columns read `get_spreadsheet` with
  `fields: ["sheets.data.rowData.values.hyperlink","sheets.data.rowData.values.textFormatRuns","sheets.data.rowData.values.chipRuns"]`.
  A URL found → it must arrive in the new file. A label with no URL behind it → copy the text as it is.

### 5. Pick the release folder

- `search_files` with `parentId = '{TC_RELEASE_ROOT_FOLDER}'`; follow `next_page_token` until the response is empty. Keep folders only.
- Ask which release (a choice list when 4 or fewer, otherwise a numbered list).
- If the wanted release is not there, ask for the day and month, build the name with the project pattern
  (default `Release <DD>_<Mon>`, e.g. `Release 18_Nov`), confirm the exact name, and create it in step 7.
- Refuse any folder the project guide marks as frozen or read-only.
- **No folder per ticket** — the file goes directly into the release folder.

### 6. Confirm before writing

Show the user, then wait for an explicit yes:
- Release folder name, and the file name — a file for this card that already exists anywhere goes through [update mode](#file-already-made--update-mode) instead
- N, and the counts per rule value (e.g. Core/Edge, statuses)
- Owners and the e-mail each will be tagged with
- Source columns not copied

### 7. Create

Immediately before creating, search the release folders again for a file starting with `<KEY> ` — the check from step 6 is not enough. Found now → stop and switch to update mode.

1. Create the release folder only if the user asked for a new one (`create_file`, `contentMimeType: application/vnd.google-apps.folder`).
2. `copy_file` on `{TC_TEMPLATE_SHEET}` with `parentId` = release folder and `title` = file name. The copy keeps the coloured dropdowns, borders and header exactly.
3. `get_spreadsheet` on the copy: one tab; note its `sheetId`.

### 8. Fill — copy, never retype

Retyping non-ASCII text risks changing it. Copy inside Google Sheets instead. In one `update_spreadsheet` request where possible:

1. `copyPaste` (`PASTE_NORMAL`) template row 2 onto rows 3…N+1, so every data row has the sample row's format and dropdowns.
2. `copy_sheet_to_another_spreadsheet` — the source tab into the new file (arrives as `Copy of <tab>`).
3. One `copyPaste` (`PASTE_VALUES`) per mapped `copy` column, rows 2…N+1, from the copied tab into the template tab.
4. `update_values` for the rule columns with the rule values.
5. **Owner → people tag:** `updateCells` on the owner cells with
   `{"userEnteredValue":{"stringValue":"@"},"chipRuns":[{"startIndex":0,"chip":{"personProperties":{"email":"<e-mail>","displayFormat":"DEFAULT"}}}]}`
   (fields `userEnteredValue,chipRuns`). The chip then shows the person's name.
6. A URL (if any) → `=HYPERLINK("<url>","<visible text>")` with `update_formulas`.

### 9. Tidy the sheet

1. `deleteDimension` ROWS from N+1 to the end (keep header + N rows only).
2. `deleteDimension` COLUMNS after the last template column.
3. `updateBorders` on the whole table — `top`, `bottom`, `left`, `right`, `innerHorizontal`, `innerVertical` all `SOLID` width 1 — so every line is visible. Do not rely on the template's borders: a template can mix black and light-grey lines.
4. **No line may wrap:**
   - `repeatCell` `wrapStrategy: OVERFLOW_CELL` on the table, then `autoResizeDimensions` COLUMNS. Add 16 px to each resulting width.
   - Dropdown (chip) columns are wider than their text; auto-size leaves them too narrow. Set them by hand (measured: a `Core`/`Edge` column 110 px, a status column 140 px).
   - `repeatCell` `wrapStrategy: WRAP` back on the table.
5. **Row heights:** `autoResizeDimensions` on ROWS does not size multi-line cells (it set every row to 20 px in testing). Instead, in a temporary tab, put
   `=MAX(ARRAYFORMULA(LEN(T!A2:<L>2)-LEN(SUBSTITUTE(T!A2:<L>2,CHAR(10),""))+1))` (T = the template tab, `<L>` = its last column letter — `M` for the 13-column default mapping) and fill it down N rows (`copyPaste` `PASTE_FORMULA`);
   set each data row to `lines × 18 + 8` px and the header row to its template height. Check one known row first (a cell with 5 numbered steps must give 5).

### 10. Verify — in the sheet, with a control

1. Add a temporary tab `chk` with one formula per column comparing the template tab with the copied source tab,
   e.g. `=SUMPRODUCT(EXACT(T!A2:A16,'Copy of {ISSUE_KEY}'!C2:C16)*1)`; rule columns compare with the rule's value. Each must equal N.
2. `=ROWS(T!A:A)` must be N+1; `=COUNTA(T!A2:A)` must be N.
3. A **negative control** that must be 0 (compare a column with a different column). Not 0 → the check is broken; do not trust it.
4. Read `chk`, then delete `chk` and every copied tab. The file must end with the single template tab.
5. Read back with `get_spreadsheet`: every table cell has `SOLID` on all four sides; every owner cell has a `personProperties` chip with the expected e-mail; the dropdown cells keep `customUiMode: CHIP`.

Report as numbers: `rows N/N`, `cells X/Y`, `tags X/N`, `borders X/Y` — and say what each was measured from.
Borders and wrapping are what people **see**; API values are not proof of that. Ask the user to open the file and confirm before calling the job done.
See also: [qa-evidence-gates.md — Gate function](../../references/qa-evidence-gates.md#gate-function) for the evidence-before-claim rule behind these numbers and the "done" claim.

### 11. Report

- Link to the new file
- The numbers from step 10
- Source columns not copied, and any value that needed a rule

### 12. Record in the tracking sheet (final confirm)

Only when the project config names `{TC_TRACKING_SHEET}`. Run it after step 11, once for the whole request — also when update mode found nothing to change, so a file whose results are now complete still gets its row.

**Gate — results must be attached (work-owner rule, 2026-10-18).** Read the release TC file fresh and check its `Test Result Link` column: **every** data row must carry a real link (a `hyperlink`, a link in `textFormatRuns`, or a `HYPERLINK` formula). Text such as `Link` with no URL does not count. If any row lacks one, add **no** tracking row for that file: tell the user which Test Case IDs still need a result link and that the row will be added when the TC is sent again with every link in place.

1. **Pick the tab per card** (tab names come from the project guide: `{TC_TRACKING_BUG_TAB}`, `{TC_TRACKING_CR_TAB}`, `{TC_TRACKING_IMPROVEMENT_TAB}`), checked in this order:
   1. Jira issue type is **Bug** → `{TC_TRACKING_BUG_TAB}`.
   2. Card summary contains **`CR` as a separate upper-case word** (regex `(?<![A-Za-z])CR(?![A-Za-z])` — matches `[CR] …`, `CR-2508-005 …`, `[HOTFIX][CR] …`; not `CREATE`, `Screen`) → `{TC_TRACKING_CR_TAB}`.
   3. Otherwise → `{TC_TRACKING_IMPROVEMENT_TAB}`.
   Read the issue type from Jira; never infer it from the title. A tab name missing from the guide → ask, then save it there.
2. **Read the target tab** (header row + every data row) and its formats: dropdown lists, people chips, date formats, which cells carry links. Treat the sheet as shared with others (it may be customer-facing) — never edit existing rows unless the user asks.
3. **One row per file** from this run. If the tab already has a row for the card (match the key column), do not add a second one — show that row and ask whether to update it.
4. **Build every column** from the project's column rules (`{TC_TRACKING_COLUMN_RULES}` in the project guide: header name → value rule, per tab). Columns are found by header name, never by letter. Header names, fixed status values and dropdown values are project-specific — take them from the guide only. Rule kinds the guide may use:

| Rule kind | Value written |
|---|---|
| card summary | Jira `summary`, verbatim |
| card key | the key, linked to the Jira issue |
| owner | people chip of the TC owner |
| TC file link | the guide's link label, linked to the new TC file |
| fixed value | the exact value the guide names (must be in the column's dropdown, if any) |
| same release | copied from rows whose TC link points to a file in the **same release folder**; none → ask |
| release date | the date in the release folder name (e.g. `Release 04_Nov` → 4 Nov of the current year), written as a real date |
| next number | highest whole number in the column + 1 |
| empty | left blank |
| ask | no rule yet → ask |

   A header with no rule in the guide → ask, then save the rule there. Every value for a dropdown column must be in its list. A value the rules cannot fill, or any doubt (no matching release rows, a date that reads two ways, a header the rules do not know) → **ask before adding**, all questions in one message.
5. **Final confirm.** Show the target tab per card and the rows exactly as they will be written (one table, every column) and wait for the user to say confirm. Without it, write nothing.
6. **Append.** Insert the rows after the last data row, copy the format of the last data row onto them (`copyPaste` `PASTE_FORMAT`, so dropdowns and chips match), then write the values with `updateCells` — links as `textFormatRuns` with `format.link.uri`, owners as people chips, dates as numbers with a day/month/year format.
7. **Verify.** Read the new rows back: every value equals the confirmed table, dropdown values are in their lists, links and chips are present. Report the row numbers written.

Never invent a status, date or link. If the sheet shows an existing error (for example a date whose stored value differs from what it displays), tell the user — do not fix it unasked.

## QA closing (mandatory before "done")

- [ ] The user confirmed the release folder, file name, counts and owner e-mails before anything was written.
- [ ] Every release folder was searched for `<KEY> ` in the same turn as `copy_file`; an existing file went through update mode.
- [ ] Update mode: differences were shown and confirmed before writing; nothing was written when nothing differed; no case gone from the source was deleted without a yes.
- [ ] No source text was retyped — every copied column came through `copyPaste` `PASTE_VALUES`.
- [ ] `chk` shows every column = N and the negative control = 0; `chk` and copied tabs are deleted.
- [ ] Only header + N rows and the template columns remain; every table cell has four solid borders.
- [ ] Every owner cell is a people chip with the mapped e-mail.
- [ ] The user opened the file and confirmed no line wraps and no missing borders.
- [ ] Tracking sheet: a row was added only for files whose every `Test Result Link` has a real link (missing IDs reported otherwise); every column came from a rule or the user; the user confirmed the exact rows; nothing was added without that confirm; the rows were read back.
- [ ] Several tabs: all questions were asked in one message before any write; tabs were written one at a time; the final table has one row per tab with its own counts and status.
