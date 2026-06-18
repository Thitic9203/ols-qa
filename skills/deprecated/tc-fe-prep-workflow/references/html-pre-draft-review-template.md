# HTML Pre-Draft Review Template — TC FE

Used in **Step 2a + Step 2.5** to render the AC/EC consistency check and PRD/Figma conflict check as a single HTML page opened in Chrome, instead of posting tables in chat.

## When to use

Every time Step 2.5 completes (or Step 2a completes when Step 2.5 is skipped because no PRD/Figma exists). Generate one combined HTML report covering both checks.

## File path

`references/{ISSUE_KEY}_FE_pre_draft_review.html` in the workspace root.

Open with: `mcp__Control_Chrome__open_url` → `file:///absolute/path/to/references/{ISSUE_KEY}_FE_pre_draft_review.html`

## HTML template

Generate the file from this template. Replace all `{placeholders}` with real values.

```html
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pre-Draft Review — {ISSUE_KEY}</title>
<style>
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
    --red-light: #ffeaea;
    --yellow:    #a05c00;
    --yellow-light:#fff8e6;
    --purple:    #6839cc;
    --purple-light:#f0ebff;
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

  .page { padding: 32px 40px 60px; max-width: 100%; }

  /* ── Header ── */
  .header { margin-bottom: 28px; }
  .header h1 {
    font-size: 22px; font-weight: 700;
    letter-spacing: -.4px; color: var(--text-pri); margin-bottom: 6px;
  }
  .header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .chip {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: var(--radius-badge);
    font-size: 11px; font-weight: 600; letter-spacing: .1px;
  }
  .chip-review   { background: var(--purple-light); color: var(--purple); }
  .chip-pass     { background: var(--green-light);  color: var(--green); }
  .chip-issues   { background: var(--red-light);    color: var(--red); }
  .header-sub    { font-size: 12px; color: var(--text-sec); margin-top: 4px; }

  /* ── Section divider ── */
  .section-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 32px 0 18px; font-size: 14px; font-weight: 700;
    color: var(--text-pri);
  }
  .section-divider .step-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    font-size: 13px; font-weight: 800; color: #fff;
  }
  .step-2a .step-num { background: var(--purple); }
  .step-25 .step-num { background: #0071e3; }
  .section-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  /* ── Cards ── */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-card); box-shadow: var(--shadow-sm);
    padding: 18px 22px; margin-bottom: 14px;
  }
  .card-title {
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .6px; color: var(--text-sec); margin-bottom: 10px;
  }

  /* ── Status banner ── */
  .status-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-radius: 10px; margin-bottom: 14px;
    font-size: 13px; font-weight: 600;
  }
  .status-pass {
    background: var(--green-light); color: var(--green);
    border: 1px solid #b8e6b8;
  }
  .status-fail {
    background: var(--red-light); color: var(--red);
    border: 1px solid #f5c0c0;
  }
  .status-icon { font-size: 18px; }

  /* ── Table ── */
  .table-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-card); box-shadow: var(--shadow-sm);
    overflow: hidden; margin-bottom: 14px;
  }
  .table-scroll { width: 100%; overflow-x: auto; }

  table { width: 100%; border-collapse: collapse; }

  thead tr { background: #f5f5f7; border-bottom: 1px solid var(--border); }
  thead th {
    position: sticky; top: 0; z-index: 2; background: #f5f5f7;
    color: var(--text-sec); padding: 10px 14px; text-align: left;
    font-size: 11px; font-weight: 700; letter-spacing: .5px;
    text-transform: uppercase; border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  thead th:last-child { border-right: none; }

  tbody tr { border-bottom: 1px solid #f0f0f5; transition: background .1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: #f5f8ff; }

  td {
    padding: 10px 14px; border-right: 1px solid #f0f0f5;
    vertical-align: top; word-break: break-word; font-size: 13px;
  }
  td:last-child { border-right: none; }

  td.empty-row { text-align: center; color: var(--text-sec); padding: 16px; }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: var(--radius-badge);
    font-size: 11px; font-weight: 600; white-space: nowrap;
  }
  .b-dup  { background: var(--yellow-light); color: var(--yellow); }
  .b-red  { background: var(--orange-light); color: var(--orange); }
  .b-con  { background: var(--red-light);    color: var(--red); }
  .b-high { background: var(--red-light);    color: var(--red); }
  .b-med  { background: var(--yellow-light); color: var(--yellow); }
  .b-low  { background: var(--blue-light);   color: var(--blue); }

  /* ── Source recency card ── */
  .recency-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px; margin-bottom: 14px;
  }
  .recency-item {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px;
  }
  .recency-item.newest { border: 2px solid var(--blue); }
  .recency-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .4px; color: var(--text-sec); margin-bottom: 4px;
  }
  .recency-date { font-size: 13px; font-weight: 600; color: var(--text-pri); }
  .recency-note { font-size: 11px; color: var(--text-sec); margin-top: 2px; }
  .newest-tag {
    font-size: 10px; font-weight: 700; color: var(--blue);
    text-transform: uppercase; letter-spacing: .4px;
  }

  /* ── Recommendation card ── */
  .rec-card {
    background: var(--purple-light); border: 1px solid #d4c5f0;
    border-radius: var(--radius-card); padding: 14px 20px; margin-top: 14px;
  }
  .rec-card .rec-title {
    font-size: 12px; font-weight: 800; text-transform: uppercase;
    letter-spacing: .5px; color: var(--purple); margin-bottom: 8px;
  }
  .rec-card ul { padding-left: 18px; }
  .rec-card li { font-size: 13px; line-height: 1.8; color: #3a1d6e; }

  /* ── Scope gap card ── */
  .gap-card {
    background: var(--orange-light); border: 1px solid #ffd4a8;
    border-radius: var(--radius-card); padding: 14px 20px; margin-top: 14px;
  }
  .gap-card .gap-title {
    font-size: 12px; font-weight: 800; text-transform: uppercase;
    letter-spacing: .5px; color: var(--orange); margin-bottom: 8px;
  }

  /* ── Footer ── */
  .footer {
    margin-top: 28px; text-align: center;
    font-size: 11px; color: #aeaeb2; letter-spacing: .2px;
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>Pre-Draft Review — {ISSUE_KEY}</h1>
    <div class="header-meta">
      <span class="chip chip-review">Review before TC design</span>
    </div>
    <p class="header-sub">ตรวจสอบผลการเช็คด้านล่าง แล้วตอบกลับในแชทเพื่อดำเนินการต่อ</p>
  </div>

  <!-- ═══════════ STEP 2a ═══════════ -->
  <div class="section-divider step-2a">
    <span class="step-num">2a</span>
    AC/EC internal consistency check
  </div>

  {STEP_2A_STATUS_BANNER}

  {STEP_2A_TABLE}

  {STEP_2A_RECOMMENDATION}

  <!-- ═══════════ STEP 2.5 ═══════════ -->
  <div class="section-divider step-25">
    <span class="step-num">2.5</span>
    Conflict check — ticket vs PRD / Figma
  </div>

  <div class="recency-grid">
    {RECENCY_ITEMS}
  </div>

  {STEP_25_STATUS_BANNER}

  {STEP_25_TABLE}

  {SCOPE_GAP_BLOCK}

  {STEP_25_RECOMMENDATION}

  <div class="footer">Helix · tc-fe-prep-workflow · {ISSUE_KEY}</div>

</div>
</body>
</html>
```

## How to build STEP_2A_STATUS_BANNER

Pick one:

```html
<!-- no issues -->
<div class="status-banner status-pass">
  <span class="status-icon">✓</span>
  Issues found: NO — ไม่พบ AC/EC ซ้ำ ซ้ำซ้อน หรือขัดแย้งกัน
</div>

<!-- issues found -->
<div class="status-banner status-fail">
  <span class="status-icon">!</span>
  Issues found: YES — พบ {N} รายการที่ต้องตรวจสอบ
</div>
```

## How to build STEP_2A_TABLE

When issues found — build a `table-card` with these columns:

```html
<div class="table-card">
  <div class="table-scroll">
    <table>
      <thead>
        <tr><th>#</th><th>Items</th><th>Category</th><th>Detail</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>AC_02 ↔ AC_05</td>
          <td><span class="badge b-dup">Duplicate</span></td>
          <td>
            <strong>AC_02:</strong> "{full text from ticket}"<br>
            <strong>AC_05:</strong> "{full text from ticket}"<br>
            → {explanation of why these overlap}
          </td>
        </tr>
        <!-- b-dup = Duplicate, b-red = Redundant, b-con = Contradictory -->
      </tbody>
    </table>
  </div>
</div>
```

When no issues — use empty-row:

```html
<div class="table-card">
  <div class="table-scroll">
    <table>
      <thead>
        <tr><th>#</th><th>Items</th><th>Category</th><th>Detail</th></tr>
      </thead>
      <tbody>
        <tr><td class="empty-row" colspan="4">— ไม่พบรายการ —</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

## How to build STEP_2A_RECOMMENDATION

When issues found:

```html
<div class="rec-card">
  <div class="rec-title">Recommendation</div>
  <ul>
    <li><strong>Item 1:</strong> {recommended action}</li>
    <li><strong>Item 2:</strong> {recommended action}</li>
  </ul>
</div>
```

When no issues — omit entirely (empty string).

## How to build RECENCY_ITEMS

One card per source. Add class `newest` to the most recently updated source:

```html
<div class="recency-item">
  <div class="recency-label">Ticket ({ISSUE_KEY})</div>
  <div class="recency-date">{DD Mon YYYY HH.MM AM/PM}</div>
  <div class="recency-note">Status: {Open/In Progress/Done}</div>
</div>
<div class="recency-item newest">
  <div class="recency-label">Figma</div>
  <div class="recency-date">{DD Mon YYYY HH.MM AM/PM}</div>
  <div class="recency-note">{frame/version label}</div>
  <div class="newest-tag">← newest source</div>
</div>
<div class="recency-item">
  <div class="recency-label">PRD</div>
  <div class="recency-date">{DD Mon YYYY HH.MM AM/PM}</div>
  <div class="recency-note">{version label}</div>
</div>
```

If a source is missing (no PRD / no Figma), still show the card but with `ไม่พบลิงก์` as date and a note:

```html
<div class="recency-item">
  <div class="recency-label">Figma</div>
  <div class="recency-date" style="color:var(--text-sec);">ไม่พบลิงก์</div>
  <div class="recency-note">ไม่มีลิงก์ Figma ระบุไว้ใน ticket</div>
</div>
```

## How to build STEP_25_STATUS_BANNER

Same structure as Step 2a banner — pick `status-pass` or `status-fail`.

## How to build STEP_25_TABLE

Conflicts table with these columns:

```html
<div class="table-card">
  <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>#</th><th>AC/EC</th><th>Area</th>
          <th>Ticket says</th><th>PRD/Figma says</th>
          <th>Newer source (ICT)</th><th>Severity</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>{AC_0n}: {full AC/EC text from ticket}</td>
          <td>{specific UI element / field / flow}</td>
          <td>{exact wording from ticket}</td>
          <td>{exact wording from PRD/Figma — include frame/section ref}</td>
          <td>{Source} — {DD Mon YYYY HH.MM AM/PM}</td>
          <td><span class="badge b-high">High</span></td>
          <!-- b-high / b-med / b-low -->
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

When no conflicts — use empty-row same as Step 2a.

## How to build SCOPE_GAP_BLOCK

When scope gaps found:

```html
<div class="gap-card">
  <div class="gap-title">Scope gaps — in PRD/Figma but no AC/EC covers it</div>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr>
        <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--orange);border-bottom:1px solid #ffc88a;">#</th>
        <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--orange);border-bottom:1px solid #ffc88a;">Source</th>
        <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--orange);border-bottom:1px solid #ffc88a;">Where</th>
        <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--orange);border-bottom:1px solid #ffc88a;">What is shown</th>
        <th style="text-align:left;padding:6px 10px;font-size:11px;color:var(--orange);border-bottom:1px solid #ffc88a;">Why it may matter</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 10px;color:#7c2d00;">1</td>
        <td style="padding:8px 10px;color:#7c2d00;">{Figma frame ref / PRD section ref}</td>
        <td style="padding:8px 10px;color:#7c2d00;">{screen / page name}</td>
        <td style="padding:8px 10px;color:#7c2d00;">{full description}</td>
        <td style="padding:8px 10px;color:#7c2d00;">{impact}</td>
      </tr>
    </tbody>
  </table>
</div>
```

When no scope gaps — omit entirely (empty string).

## How to build STEP_25_RECOMMENDATION

Same structure as Step 2a recommendation card. Omit when no conflicts and no gaps.

## Opening in Chrome

After writing the file:

```
mcp__Control_Chrome__open_url → file:///absolute/path/to/references/{ISSUE_KEY}_FE_pre_draft_review.html
```

Post in chat (short — details are in the HTML page):

> Pre-draft review เปิดใน Chrome แล้ว — ตรวจสอบผลการเช็ค AC/EC consistency + PRD/Figma conflict ได้เลยครับ

Then follow up in chat with the user decision prompt (Step 2a.3) if issues were found, or confirm proceeding if clean.

## Regeneration

If the user asks to update the report (e.g. after resolving a conflict), regenerate the HTML file and re-open in Chrome. Do not create a new file — overwrite the same path.
