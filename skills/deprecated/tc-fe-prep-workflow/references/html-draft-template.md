# HTML Draft Template — TC FE

Used in **Step 5** to render the TC draft as a full-width HTML page opened in Chrome, instead of a markdown table in chat.

## When to use

Every time Step 5 is reached — always generate the HTML file and open it in Chrome. Do NOT post the markdown table in chat.

## File path

`references/{ISSUE_KEY}_FE_TC_draft.html` in the workspace root.

Open with: `mcp__Control_Chrome__open_url` → `file:///absolute/path/to/references/{ISSUE_KEY}_FE_TC_draft.html`

## HTML template

Generate the file from this template. Replace all `{placeholders}` with real values.

```html
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Draft TC FE — {ISSUE_KEY}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Thai', sans-serif; font-size: 13px; background: #f4f6f9; color: #1a1a2e; }
  .page { padding: 24px 32px; max-width: 100%; }
  h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
  .badge-not-posted { display: inline-block; background: #fef3c7; color: #b45309; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  .prep-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 14px; }
  .prep-box h2 { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
  .prep-box ol { padding-left: 20px; line-height: 1.8; color: #334155; }
  .note-bar { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 6px 6px 0; padding: 9px 14px; margin-bottom: 16px; font-size: 12px; color: #78350f; }
  .table-wrap { width: 100%; overflow-x: auto; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  colgroup col.ac    { width: 16%; }
  colgroup col.svc   { width: 7%; }
  colgroup col.id    { width: 4%; }
  colgroup col.title { width: 12%; }
  colgroup col.pre   { width: 10%; }
  colgroup col.data  { width: 8%; }
  colgroup col.steps { width: 14%; }
  colgroup col.exp   { width: 14%; }
  colgroup col.pri   { width: 5%; }
  colgroup col.type  { width: 10%; }
  thead th { position: sticky; top: 0; z-index: 2; background: #1e293b; color: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; border-right: 1px solid #334155; white-space: nowrap; }
  thead th:last-child { border-right: none; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #e0f2fe; }
  td { padding: 9px 12px; border-bottom: 1px solid #e8ecf1; border-right: 1px solid #e8ecf1; vertical-align: top; line-height: 1.55; word-break: break-word; }
  td:last-child { border-right: none; }
  .group-row td { background: #e8f0fe !important; color: #1d4ed8; font-weight: 700; font-size: 12px; padding: 6px 12px; letter-spacing: .4px; }
  .group-row.integration td { background: #fff7ed !important; color: #c2410c; }
  .group-row.unit td { background: #eff6ff !important; color: #1d4ed8; }
  .tc-id { font-weight: 800; color: #0369a1; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .b-system      { background: #dcfce7; color: #15803d; }
  .b-integration { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
  .b-unit        { background: #dbeafe; color: #1d4ed8; }
  .p-high   { color: #dc2626; font-weight: 700; }
  .p-medium { color: #d97706; font-weight: 600; }
  .p-low    { color: #64748b; }
  .remark-box { margin-top: 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px 18px; font-size: 12px; color: #7c2d12; line-height: 1.7; }
  .remark-box strong { display: block; font-size: 13px; margin-bottom: 6px; color: #c2410c; }
  .footer-note { margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <h1>Draft TC FE — {ISSUE_KEY} <span class="badge-not-posted">Not posted to Jira yet</span></h1>
  <div class="meta">{TC_COUNT} test cases · ตรวจสอบแล้ว approve หรือแจ้ง edit ในแชทได้เลย</div>

  <div class="prep-box">
    <h2>Shared data preparation (all TCs)</h2>
    <ol>
      {SHARED_PREP_LI}
    </ol>
  </div>

  <div class="note-bar">📌 <strong>Precondition column:</strong> หลังทำ Shared data preparation ครบแล้ว ให้ดำเนินการตาม Precondition ของแต่ละ TC ก่อนเริ่มขั้นตอนการทดสอบ</div>

  <div class="table-wrap">
    <table>
      <colgroup>
        <col class="ac"/><col class="svc"/><col class="id"/>
        <col class="title"/><col class="pre"/><col class="data"/>
        <col class="steps"/><col class="exp"/><col class="pri"/><col class="type"/>
      </colgroup>
      <thead>
        <tr>
          <th>Acceptance Criteria</th><th>Services Impacted</th><th>TC ID</th>
          <th>Test Title</th><th>Precondition</th><th>Test Data</th>
          <th>Test Steps</th><th>Expected Result</th><th>Priority</th><th>Type</th>
        </tr>
      </thead>
      <tbody>
        {TABLE_ROWS}
      </tbody>
    </table>
  </div>

  {REMARK_BLOCK}

  <div class="footer-note">Draft generated by Helix tc-fe-prep-workflow · {ISSUE_KEY}</div>
</div>
</body>
</html>
```

## How to build TABLE_ROWS

Group rows by Type in order: Unit Test → Integration Test → System Test.

For each group that has TCs, emit a **group header row** then data rows:

```html
<!-- group header — change class for each type -->
<tr class="group-row unit">       <!-- or integration / system -->
  <td colspan="10">Unit Test</td>
</tr>
<tr>
  <td>{AC/EC label + full text}</td>
  <td>{Services Impacted}</td>
  <td class="tc-id">{TC ID number}</td>
  <td>{Test Title}</td>
  <td>{Precondition}</td>
  <td>{Test Data — or "—" if empty}</td>
  <td>{Test Steps — use <br> tags between numbered items}</td>
  <td>{Expected Result — use <br> tags between numbered items}</td>
  <td class="{p-high|p-medium|p-low}">{High|Medium|Low}</td>
  <td><span class="badge b-{system|integration|unit}">{Type value}</span></td>
</tr>
```

**Note:** Unlike Jira comments, HTML cells CAN use `<br>` for line breaks — this is correct and intended for numbered steps.

## How to build REMARK_BLOCK

Only include when at least one Type has no TCs OR when Figma/PRD links were missing:

```html
<div class="remark-box">
  <strong>Remark — Type coverage:</strong>
  No <em>Unit Test</em> cases for this ticket.<br>
  ไม่มีลิงก์ Figma ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้<br>
  ไม่มีลิงก์ PRD ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้
</div>
```

Include only applicable lines. Omit the block entirely if all three Types have TCs AND both links existed.

## How to build SHARED_PREP_LI

Each shared prep step as an `<li>` element:

```html
<li>เตรียมบัญชี Guest และ Learner ที่พร้อมใช้งาน</li>
```

## Opening in Chrome

After writing the file, open with:

```
mcp__Control_Chrome__open_url → file:///absolute/path/to/references/{ISSUE_KEY}_FE_TC_draft.html
```

Then post in chat (short):

> Draft TC เปิดใน Chrome แล้ว — ตรวจสอบ แล้ว approve หรือแจ้ง edit ได้เลยครับ **Not posted to Jira yet.**

Wait for user approval or edit requests. Apply edits → regenerate HTML → re-open. Repeat until approved.
