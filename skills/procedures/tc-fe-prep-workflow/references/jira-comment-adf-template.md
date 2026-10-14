# TC FE Jira comment — ADF template and "draft only" files

The output shape of the Step 7 Jira comment as an ADF document, and the files to write when the user
asks for a draft without posting ("draft only", "do not post", "save the comment, don't publish").
The content rules (intro text, 6-column slim table, attachment links, skip-notes, Remark, Disclaimer)
stay in Steps 6–7 of the workflow; this file is the one copy of the file form and an example.

## Contents

- [Draft only — files to write](#draft-only--files-to-write)
- [ADF document order](#adf-document-order)
- [Self-check before reporting](#self-check-before-reporting)
- [Example — approved rows in, ADF out](#example--approved-rows-in-adf-out)

## Draft only — files to write

When the user asks for the comment without posting, write exactly two files:

| File | What it is |
|---|---|
| `Jira_comment_{ISSUE_KEY}.adf.json` | The exact ADF document Step 7 would post. Attachment placeholders (`__ATT1_ID__` …) are kept as-is. |
| `Jira_comment_{ISSUE_KEY}.preview.md` | A human-readable preview only. Its first line is `PREVIEW — not postable; post the .adf.json`. |

Never:

- save the comment body as `.md` or `.txt` and call it the comment — Markdown (`**`, `| --- |`, `---`)
  is not ADF and posts as literal characters;
- put Markdown syntax inside the `.adf.json` text nodes;
- add any node after the Disclaimer.

When the user later says to post, post the `.adf.json` (after uploading the attachments and replacing
the placeholders), never the preview.

## ADF document order

Top-level nodes, in this order:

1. paragraph — the intro line (Step 7 item 1, exact text);
2. shared-prep block, when the story has one (Step 7 item 2);
3. table — 6 columns; header cells are `tableHeader` with a `strong` mark and
   `colwidth` `[90]`, `[130]`, `[50]`, `[510]`, `[90]`, `[150]`; one `tableRow` per approved TC;
4. one paragraph per attached file, the file name as a `link` mark to its placeholder;
5. one skip-note paragraph per typed CSV that has no TCs;
6. the Remark block, when it applies;
7. paragraph — the Disclaimer, exact text, last node.

## Self-check before reporting

- The `.adf.json` parses as JSON.
- Node types are only `doc`, `paragraph`, `text`, `table`, `tableRow`, `tableHeader`, `tableCell`,
  `hardBreak`, `bulletList`, `orderedList`, `listItem`.
- The last top-level node's text starts with `⚠️ Disclaimer:`.
- Table data rows = the approved TC count.

## Example — approved rows in, ADF out

Input — approved TC rows (2 shown) and the request "draft only, do not post":

```text
1 | AC_01 | <SERVICE_A> | <TITLE_A> | High | System Test
2 | EC_01 | <SERVICE_A> | <TITLE_B> | Medium | Integration Test
```

Output — `Jira_comment_{ISSUE_KEY}.adf.json` (complete; no Unit Test rows, so one skip-note):

```json
{"type":"doc","version":1,"content":[
 {"type":"paragraph","content":[{"type":"text","text":"Draft TC FE as below — ดูรายละเอียด Precondition / Steps / Expected ได้ในไฟล์แนบ"}]},
 {"type":"table","content":[
  {"type":"tableRow","content":[{"type":"tableHeader","attrs":{"colwidth":[90]},"content":[{"type":"paragraph","content":[{"type":"text","text":"AC/EC Ref","marks":[{"type":"strong"}]}]}]},{"type":"tableHeader","attrs":{"colwidth":[130]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Services Impacted","marks":[{"type":"strong"}]}]}]},{"type":"tableHeader","attrs":{"colwidth":[50]},"content":[{"type":"paragraph","content":[{"type":"text","text":"ID","marks":[{"type":"strong"}]}]}]},{"type":"tableHeader","attrs":{"colwidth":[510]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Test Title","marks":[{"type":"strong"}]}]}]},{"type":"tableHeader","attrs":{"colwidth":[90]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Priority","marks":[{"type":"strong"}]}]}]},{"type":"tableHeader","attrs":{"colwidth":[150]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Type","marks":[{"type":"strong"}]}]}]}]},
  {"type":"tableRow","content":[{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"AC_01"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"<SERVICE_A>"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"1"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"<TITLE_A>"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"High"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"System Test"}]}]}]},
  {"type":"tableRow","content":[{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"EC_01"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"<SERVICE_A>"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"2"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"<TITLE_B>"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Medium"}]}]},{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Integration Test"}]}]}]}
 ]},
 {"type":"paragraph","content":[{"type":"text","text":"Import_Qase_{ISSUE_KEY}.csv","marks":[{"type":"link","attrs":{"href":"__ATT1_ID__"}}]}]},
 {"type":"paragraph","content":[{"type":"text","text":"ไม่มี TC ประเภท Unit Test สำหรับ ticket นี้"}]},
 {"type":"paragraph","content":[{"type":"text","text":"⚠️ Disclaimer: ข้อมูลนี้เป็นเพียง Draft Version ที่ได้จากการใช้ Skill เท่านั้น (TC ครบตาม AC & EC) เนื้อหาทั้งหมดจำเป็นต้องได้รับการรีวิวและอัปเดตโดยทีม QA ก่อนนำไปใส่ในไฟล์เอกสารส่งมอบ และทำการนำ TC ไป Import เข้าสู่ Qase.io"}]}
]}
```

Output — first lines of `Jira_comment_{ISSUE_KEY}.preview.md`:

```text
PREVIEW — not postable; post the .adf.json
Draft TC FE as below — ดูรายละเอียด Precondition / Steps / Expected ได้ในไฟล์แนบ
AC_01 · <SERVICE_A> · 1 · <TITLE_A> · High · System Test
EC_01 · <SERVICE_A> · 2 · <TITLE_B> · Medium · Integration Test
```
