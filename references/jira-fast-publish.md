# Jira Fast Publish

Single-JS publish patterns for Jira comment + CSV upload. Reduces publish from 8–12 tool calls to 3.

**Use with:** `Control_Chrome__execute_javascript` only — `Claude_in_Chrome__javascript_tool` cannot access Jira pages (extension sandbox).

---

## Contents

- [Decision rule — which method](#decision-rule--which-method)
- [Pattern A — Pre-set data (Call 1)](#pattern-a--pre-set-data-call-1)
- [Pattern B — Upload files + post comment (Call 2)](#pattern-b--upload-files--post-comment-call-2)
- [Pattern C — Read result (Call 3)](#pattern-c--read-result-call-3)
- [Pattern D — Comment-only, no CSVs (retest-bug > 3 table rows)](#pattern-d--comment-only-no-csvs-retest-bug--3-table-rows)
- [ADF pre-compute rules](#adf-pre-compute-rules)
- [Large-table handling (> 50 rows)](#large-table-handling--50-rows)
- [Constraints](#constraints)
- [Error recovery](#error-recovery)

## Decision rule — which method

| Content | Method | Pattern |
|---------|--------|---------|
| TC table (tc-fe-prep, tc-api-prep) — any table size | ADF-direct via single JS | Pattern A → B → C |
| Retest comment > 3 table rows | ADF-direct via single JS | Pattern A (ADF only) → Pattern D → C |
| Retest comment ≤ 3 table rows or text-only | MCP `addCommentToJiraIssue` | MCP → verify |
| FE bug retest with screenshots (any size) | v2 wiki markup via browser JS | v2 path, not ADF |

**Definition of "table":** A `| col | col |` markdown table with data rows. The evidence summary block (`**Env:** staging`) is NOT a table.

**Body language follows the row you picked** — the v2 row means **wiki markup**, not markdown. A
markdown body on the v2 path posts fine (HTTP 200) and renders wrong: `**x**` → `*<b>x</b>*`,
`---` → an em-dash, `|---|` → a visible row of dashes. Syntax map + pre/post gates:
[jira-wiki-vs-markdown.md](jira-wiki-vs-markdown.md).

**Never try MCP first for TC tables** — TC tables always have many rows; MCP truncates consistently.

---

## Pattern A — Pre-set data (Call 1)

Always call this BEFORE Pattern B/D. Sets the files and the ADF body on `window.*` to avoid JS string escaping issues.

```javascript
// Call 1 — set data on window (avoids escaping nightmares with quotes, Thai chars, newlines)
// One entry per file, in upload order. File n (1-based) fills placeholder __ATT{n}_ID__.
window.__files = [
  {name: '{FILE1_NAME}', data: {FILE1_CONTENT_JSON}},   // e.g. Draft_Jira_{ISSUE_KEY}.csv
  {name: '{FILE2_NAME}', data: {FILE2_CONTENT_JSON}}    // e.g. Import_Qase_{ISSUE_KEY}.csv — add one entry per extra file
];
window.__adfBody = '{ADF_JSON_STRING}';  // Pre-built ADF with one __ATT{n}_ID__ placeholder per file
'data set ok: ' + window.__files.length + ' file(s)';
```

**Generating the escaped strings:** Use `JSON.stringify(content)` in the Python/inline script that builds each file. This handles Thai characters, quotes, and newlines. Paste each result directly as a `data:` value above.

**Legacy form (still accepted by Pattern B):** `window.__csv1Data` / `window.__csv2Data` with filenames passed in Pattern B. Use `window.__files` for anything new, and always when there are more than two files or exactly one.

**MUST NOT navigate** after Pattern A — navigation clears `window.*`. Navigate to the Jira issue page first, then run Pattern A.

**`window.*` persistence:** Variables persist across `Control_Chrome__execute_javascript` calls on the same tab. Lost only on page navigation or refresh.

---

## Pattern B — Upload files + post comment (Call 2)

Runs after Pattern A. Uploads every file in `window.__files` in order, replaces each `__ATT{n}_ID__` with the id of file n, then posts `window.__adfBody`.

```javascript
(function(){
  var issueKey = '{ISSUE_KEY}';
  var baseUrl = '/rest/api/3/issue/' + issueKey;
  var hdrs = {'X-Atlassian-Token': 'no-check'};
  var files = window.__files || [
    {name: '{CSV1_FILENAME}', data: window.__csv1Data},
    {name: '{CSV2_FILENAME}', data: window.__csv2Data}
  ].filter(function(f){ return typeof f.data === 'string'; });
  var attIds = [];
  function state(extra){
    window.__fastPublish = Object.assign({attIds: attIds.slice(), total: files.length,
      att1Id: attIds[0], att2Id: attIds[1]}, extra);
  }
  state({status: 'running'});

  function uploadFile(name, content) {
    var blob = new Blob(['\uFEFF', content], {type: 'text/csv;charset=utf-8'});
    var file = new File([blob], name, {type: 'text/csv'});
    var fd = new FormData();
    fd.append('file', file);
    return fetch(baseUrl + '/attachments', {
      method: 'POST', headers: hdrs, body: fd
    }).then(function(r){ return r.json(); });
  }

  function postComment(body) {
    return fetch(baseUrl + '/comment', {
      method: 'POST',
      headers: Object.assign({}, hdrs, {'Content-Type': 'application/json'}),
      body: body
    }).then(function(r){ return r.json(); });
  }

  var chain = Promise.resolve();
  files.forEach(function(f, i){
    chain = chain.then(function(){ return uploadFile(f.name, f.data); })
      .then(function(r){ attIds.push(r[0].id); state({status: 'file' + (i + 1) + '_done'}); });
  });
  chain.then(function(){
      var body = window.__adfBody;
      attIds.forEach(function(id, i){
        body = body.split('__ATT' + (i + 1) + '_ID__').join(id);
      });
      if (/__ATT\d+_ID__/.test(body)) { throw new Error('unfilled __ATT placeholder — files and placeholders differ'); }
      return postComment(body);
    })
    .then(function(cr){
      state({status: 'ok', commentId: cr.id, commentUrl: cr.self});
    })
    .catch(function(e){
      state({status: 'error', message: e.message || String(e)});
    });
})();
```

**Filenames (tc-fe-prep upload order):** `Draft_Jira_{ISSUE_KEY}.csv`, `Import_Qase_{ISSUE_KEY}.csv`, then each generated typed CSV in order `Unit_Test`, `Integration_Test`, `System_Test` — at most 5 files. tc-api-prep uploads one CSV.

**ADF placeholders:** Build the full ADF JSON before this call with exactly one literal `__ATT{n}_ID__` per uploaded file (n = its position in `window.__files`, 1-based). Pattern B refuses to post when a placeholder is left unfilled.

---

## Pattern C — Read result (Call 3)

```javascript
JSON.stringify(window.__fastPublish || {status: 'pending'});
```

**Interpret result:**

| `status` | What it means | Action |
|----------|--------------|--------|
| `ok` | Upload + comment done | Proceed to screenshot verify |
| `pending`, `running` or `file{n}_done` | Still in flight | Wait 2s, read again |
| `error` with `attIds.length == total` | Uploads done, comment failed (or a placeholder was unfilled — see `message`) | Fix the cause, then retry comment-only with the saved `attIds` |
| `error` with `0 < attIds.length < total` | Upload of file `attIds.length + 1` failed | Retry from that file only; keep the saved `attIds` |
| `error` with empty `attIds` | Upload #1 failed | Check auth (401/403?), re-navigate, retry from Pattern A |

`att1Id` / `att2Id` stay in the result as aliases of `attIds[0]` / `attIds[1]`.

---

## Pattern D — Comment-only, no CSVs (retest-bug > 3 table rows)

Use when there are no CSV uploads — just a large ADF comment.

```javascript
(function(){
  var issueKey = '{ISSUE_KEY}';
  fetch('/rest/api/3/issue/' + issueKey + '/comment', {
    method: 'POST',
    headers: {'X-Atlassian-Token': 'no-check', 'Content-Type': 'application/json'},
    body: window.__adfBody
  }).then(function(r){ return r.json(); })
  .then(function(cr){
    window.__fastPublish = {status: 'ok', commentId: cr.id, commentUrl: cr.self};
  })
  .catch(function(e){
    window.__fastPublish = {status: 'error', message: e.message || String(e)};
  });
})();
```

Then read with Pattern C.

---

## ADF pre-compute rules

Build ADF JSON **in the same step as file writing** (not after) — the agent already has the final table content at that point.

**Build process:**
1. Iterate every cell of the approved table (same pass used for CSV cleaning)
2. Convert `<br>` → `{"type": "hardBreak"}` ADF node
3. Build complete ADF document with one `__ATT{n}_ID__` literal string placeholder per uploaded file (n = upload position, 1-based) in attachment link nodes
4. Store ADF string in agent context — no need to write to a file (it's transient)

**Validate before posting:** Verify ADF has correct node count and no malformed JSON before running Pattern B.

---

## Large-table handling (> 50 rows)

If CSV content may exceed JS string literal limits, use the standard Pattern A → B → C flow unchanged — Pattern A already separates data-setting from the publish call.

Call sequence:
1. Navigate to Jira issue page
2. Pattern A: set `window.__files` and `window.__adfBody`
3. Pattern B: upload + comment (references `window.*` — no size limit issue)
4. Pattern C: read result

---

## Constraints

- **Always use Pattern A** (pre-set window vars) before Pattern B — never inline CSV as JS string literals. Even for small tables. Prevents escaping failures with quotes, Thai characters, newlines.
- **MUST convert `<br>` before building ADF** — rules in [jira-linebreak-conversion.md](jira-linebreak-conversion.md).
- **MUST NOT navigate between Pattern A and Pattern B** — clears `window.*`.
- **UTF-8 BOM** (`﻿`) preserved in Blob constructor in Pattern B.
- **Use `Control_Chrome__execute_javascript`** — not `Claude_in_Chrome__javascript_tool` (Jira incompatible).
- **No `async`/`await`** in Control_Chrome JS — use `.then()` chains only.

---

## Error recovery

| Error | Recovery |
|-------|----------|
| `401`/`403` in error message | Re-navigate to Jira page (re-establishes auth session), then retry from Pattern A |
| All `attIds` saved, comment failed | Skip re-upload; post comment with saved IDs directly |
| Some `attIds` saved | Re-upload only the files after the last saved id; use saved + new ids for the comment |
| `pending`/`running` after 3s | Read Pattern C once more; if still running, re-execute Pattern B |
| JS execution error (not fetch error) | Verify page is on correct Jira issue; re-run Pattern A + B |
