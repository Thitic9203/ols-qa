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
  /* ── Apple-style design system ── */
  :root {
    --bg:        #f5f5f7;
    --surface:   #ffffff;
    --border:    #d2d2d7;
    --text-pri:  #1d1d1f;
    --text-sec:  #6e6e73;
    --blue:      #0071e3;
    --blue-light:#e8f1fb;
    --green:     #1a8917;
    --green-light:#e9f8ea;
    --orange:    #b35000;
    --orange-light:#fff3e8;
    --red:       #d70015;
    --yellow:    #a05c00;
    --yellow-light:#fff8e6;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
    --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.05);
    --radius-card: 14px;
    --radius-badge: 20px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, 'Noto Sans Thai', sans-serif;
    font-size: 13px;
    line-height: 1.5;
    background: var(--bg);
    color: var(--text-pri);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Layout ── */
  .page { padding: 32px 40px 60px; max-width: 100%; }

  /* ── Header ── */
  .header { margin-bottom: 28px; }
  .header h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -.4px;
    color: var(--text-pri);
    margin-bottom: 6px;
  }
  .header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .chip {
    display: inline-flex; align-items: center;
    padding: 3px 10px;
    border-radius: var(--radius-badge);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1px;
  }
  .chip-draft  { background: var(--yellow-light); color: var(--yellow); }
  .chip-count  { background: #f0f0f5; color: var(--text-sec); }
  .header-sub  { font-size: 12px; color: var(--text-sec); margin-top: 4px; }

  /* ── Cards ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-sm);
    padding: 18px 22px;
    margin-bottom: 14px;
  }
  .card-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: var(--text-sec);
    margin-bottom: 10px;
  }
  .card ol { padding-left: 18px; }
  .card ol li { color: var(--text-pri); line-height: 1.8; font-size: 13px; }

  /* ── Note bar ── */
  .note-bar {
    background: var(--blue-light);
    border-left: 3px solid var(--blue);
    border-radius: 0 8px 8px 0;
    padding: 9px 14px;
    margin-bottom: 18px;
    font-size: 12px;
    color: #003d80;
  }

  /* ── Table wrapper ── */
  .table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }
  .table-scroll { width: 100%; overflow-x: auto; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }

  colgroup col.ac    { width: 15%; }
  colgroup col.svc   { width: 7%; }
  colgroup col.id    { width: 4%; }
  colgroup col.title { width: 12%; }
  colgroup col.pre   { width: 10%; }
  colgroup col.data  { width: 7%; }
  colgroup col.steps { width: 14%; }
  colgroup col.exp   { width: 14%; }
  colgroup col.pri   { width: 5%; }
  colgroup col.type  { width: 12%; }

  /* ── Table head ── */
  thead tr {
    background: #f5f5f7;
    border-bottom: 1px solid var(--border);
  }
  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f5f5f7;
    color: var(--text-sec);
    padding: 11px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .5px;
    text-transform: uppercase;
    border-right: 1px solid var(--border);
    white-space: normal;
    word-break: break-word;
  }
  thead th:last-child { border-right: none; }

  /* ── Table body ── */
  tbody tr { border-bottom: 1px solid #f0f0f5; transition: background .1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: #f5f8ff; }

  td {
    padding: 10px 14px;
    border-right: 1px solid #f0f0f5;
    vertical-align: top;
    word-break: break-word;
    font-size: 13px;
    color: var(--text-pri);
  }
  td:last-child { border-right: none; }

  /* ── Group header rows ── */
  .group-unit        { background: var(--blue-light) !important; }
  .group-integration { background: var(--orange-light) !important; }
  .group-system      { background: var(--green-light) !important; }

  .group-unit td,
  .group-integration td,
  .group-system td {
    padding: 7px 14px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .7px;
    text-transform: uppercase;
    border-right: none;
  }
  .group-unit td        { color: var(--blue); }
  .group-integration td { color: var(--orange); }
  .group-system td      { color: var(--green); }

  /* ── TC ID ── */
  .tc-id {
    font-size: 14px;
    font-weight: 800;
    color: var(--blue);
    letter-spacing: -.2px;
  }

  /* ── Type badges ── */
  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px;
    border-radius: var(--radius-badge);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  .b-unit        { background: var(--blue-light);   color: var(--blue); }
  .b-integration { background: var(--orange-light); color: var(--orange); }
  .b-system      { background: var(--green-light);  color: var(--green); }

  /* ── Priority ── */
  .p-high   { color: var(--red);    font-weight: 700; }
  .p-medium { color: var(--yellow); font-weight: 600; }
  .p-low    { color: var(--text-sec); }

  /* ── Remark ── */
  .remark-card {
    background: var(--orange-light);
    border: 1px solid #ffd4a8;
    border-radius: var(--radius-card);
    padding: 14px 20px;
    margin-top: 14px;
    font-size: 12.5px;
    color: #7c2d00;
    line-height: 1.75;
  }
  .remark-card .remark-title {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .5px;
    color: var(--orange);
    margin-bottom: 8px;
  }

  /* ── Footer ── */
  .footer {
    margin-top: 28px;
    text-align: center;
    font-size: 11px;
    color: #aeaeb2;
    letter-spacing: .2px;
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>Draft TC FE — {ISSUE_KEY}</h1>
    <div class="header-meta">
      <span class="chip chip-draft">Not posted to Jira yet</span>
      <span class="chip chip-count">{TC_COUNT} test cases</span>
    </div>
    <p class="header-sub">ตรวจสอบแล้ว approve หรือแจ้ง edit ในแชทได้เลย</p>
  </div>

  <div class="card">
    <div class="card-title">Shared data preparation (all TCs)</div>
    <ol>
      {SHARED_PREP_LI}
    </ol>
  </div>

  <div class="note-bar">
    📌 <strong>Precondition column:</strong> หลังทำ Shared data preparation ครบแล้ว ให้ดำเนินการตาม Precondition ของแต่ละ TC ก่อนเริ่มขั้นตอนการทดสอบ
  </div>

  <div class="table-card">
    <div class="table-scroll">
      <table>
        <colgroup>
          <col class="ac"/><col class="svc"/><col class="id"/>
          <col class="title"/><col class="pre"/><col class="data"/>
          <col class="steps"/><col class="exp"/><col class="pri"/><col class="type"/>
        </colgroup>
        <thead>
          <tr>
            <th>Acceptance Criteria</th><th>Services Impacted</th><th>ID</th>
            <th>Test Title</th><th>Precondition</th><th>Test Data</th>
            <th>Test Steps</th><th>Expected Result</th><th>Priority</th><th>Type</th>
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS}
        </tbody>
      </table>
    </div>
  </div>

  {REMARK_BLOCK}

  <div class="footer">Helix · tc-fe-prep-workflow · {ISSUE_KEY}</div>

</div>
</body>
</html>
```

## How to build TABLE_ROWS

Group by Type: Unit Test → Integration Test → System Test. For each group that has TCs:

```html
<!-- group header — pick correct class: group-unit / group-integration / group-system -->
<tr class="group-unit">
  <td colspan="10">Unit Test</td>
</tr>
<tr>
  <td>{AC/EC label}: {full criterion text from ticket}</td>
  <td>{Services Impacted — plain name if 1; "1. A 2. B" if 2+}</td>
  <td class="tc-id">{TC ID number}</td>
  <td>{Test Title}</td>
  <td>{Precondition}</td>
  <td>{Test Data — or "—"}</td>
  <td>1. {step 1}<br>2. {step 2}<br>3. {step 3}</td>
  <td>1. {result 1}<br>2. {result 2}</td>
  <td class="p-high">High</td>   <!-- p-high / p-medium / p-low -->
  <td><span class="badge b-unit">Unit Test</span></td>  <!-- b-unit / b-integration / b-system -->
</tr>
```

**HTML cells CAN use `<br>` for line breaks** (unlike Jira cells — this is correct here).

## How to build REMARK_BLOCK

Include only when at least one Type has no TCs OR when Figma/PRD links were missing. Omit entirely if nothing to report.

```html
<div class="remark-card">
  <div class="remark-title">Remark — Type coverage</div>
  No <em>Unit Test</em> cases for this ticket.<br>
  ไม่มีลิงก์ Figma ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้<br>
  ไม่มีลิงก์ PRD ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้
</div>
```

## How to build SHARED_PREP_LI

```html
<li>เตรียมบัญชี Guest และ Learner ที่พร้อมใช้งาน</li>
```

## Opening in Chrome

After writing the file:

```
mcp__Control_Chrome__open_url → file:///absolute/path/to/references/{ISSUE_KEY}_FE_TC_draft.html
```

Post in chat (one line):

> Draft TC เปิดใน Chrome แล้ว — ตรวจสอบ แล้ว approve หรือแจ้ง edit ได้เลยครับ **Not posted to Jira yet.**

Wait for approval. On edit → regenerate HTML → re-open.
