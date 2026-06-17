# Jira Fast Publish

Single-JS publish patterns for Jira comment + CSV upload. Reduces publish from 8–12 tool calls to 3.

**Use with:** `Control_Chrome__execute_javascript` only — `Claude_in_Chrome__javascript_tool` cannot access Jira pages (extension sandbox).

---

## Decision rule — which method

| Content | Method | Pattern |
|---------|--------|---------|
| TC table (tc-fe-prep, tc-api-prep) — any table size | ADF-direct via single JS | Pattern A → B → C |
| Retest comment > 3 table rows | ADF-direct via single JS | Pattern A (ADF only) → Pattern D → C |
| Retest comment ≤ 3 table rows or text-only | MCP `addCommentToJiraIssue` | MCP → verify |
| FE bug retest with screenshots (any size) | v2 wiki markup via browser JS | v2 path, not ADF |

**Definition of "table":** A `| col | col |` markdown table with data rows. The evidence summary block (`**Env:** staging`) is NOT a table.

**Never try MCP first for TC tables** — TC tables always have many rows; MCP truncates consistently.

---

## Pattern A — Pre-set data (Call 1)

Always call this BEFORE Pattern B/D. Sets CSV content and ADF body on `window.*` to avoid JS string escaping issues.

```javascript
// Call 1 — set data on window (avoids escaping nightmares with quotes, Thai chars, newlines)
window.__csv1Data = '{CSV1_CONTENT_ESCAPED}';  // Draft_Jira CSV — JSON.stringify'd
window.__csv2Data = '{CSV2_CONTENT_ESCAPED}';  // Import_Qase CSV — JSON.stringify'd
window.__adfBody = '{ADF_JSON_STRING}';        // Pre-built ADF with __ATT1_ID__ / __ATT2_ID__ placeholders
'data set ok';
```

**Generating the escaped strings:** Use `JSON.stringify(csvContent)` in the Python/inline script that builds the CSV. This handles Thai characters, quotes, and newlines. Paste the result directly into the pattern above.

**MUST NOT navigate** after Pattern A — navigation clears `window.*`. Navigate to the Jira issue page first, then run Pattern A.

**`window.*` persistence:** Variables persist across `Control_Chrome__execute_javascript` calls on the same tab. Lost only on page navigation or refresh.

---

## Pattern B — Upload CSVs + post comment (Call 2)

Runs after Pattern A. Reads `window.__csv1Data`, `window.__csv2Data`, `window.__adfBody`.

```javascript
(function(){
  var issueKey = '{ISSUE_KEY}';
  var baseUrl = '/rest/api/3/issue/' + issueKey;
  var hdrs = {'X-Atlassian-Token': 'no-check'};
  window.__fastPublish = {status: 'running'};

  function uploadFile(name, content) {
    var blob = new Blob(['﻿', content], {type: 'text/csv;charset=utf-8'});
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

  var att1Id, att2Id;
  uploadFile('{CSV1_FILENAME}', window.__csv1Data)
    .then(function(r1){
      att1Id = r1[0].id;
      window.__fastPublish = {status: 'csv1_done', att1Id: att1Id};
      return uploadFile('{CSV2_FILENAME}', window.__csv2Data);
    })
    .then(function(r2){
      att2Id = r2[0].id;
      window.__fastPublish = {status: 'csv2_done', att1Id: att1Id, att2Id: att2Id};
      var body = window.__adfBody
        .replace('__ATT1_ID__', att1Id)
        .replace('__ATT2_ID__', att2Id);
      return postComment(body);
    })
    .then(function(cr){
      window.__fastPublish = {
        status: 'ok',
        commentId: cr.id,
        commentUrl: cr.self,
        att1Id: att1Id,
        att2Id: att2Id
      };
    })
    .catch(function(e){
      window.__fastPublish = Object.assign(
        window.__fastPublish || {},
        {status: 'error', message: e.message || String(e)}
      );
    });
})();
```

**Filenames:** `Draft_Jira_{ISSUE_KEY}.csv` and `Import_Qase_{ISSUE_KEY}.csv`.

**ADF placeholders:** Build the full ADF JSON before this call. Use `__ATT1_ID__` and `__ATT2_ID__` as literal strings in the ADF's attachment link nodes — Pattern B replaces them with real IDs after upload.

---

## Pattern C — Read result (Call 3)

```javascript
JSON.stringify(window.__fastPublish || {status: 'pending'});
```

**Interpret result:**

| `status` | What it means | Action |
|----------|--------------|--------|
| `ok` | Upload + comment done | Proceed to screenshot verify |
| `pending` or `running` | Still in flight | Wait 2s, read again |
| `error` + `att1Id` + `att2Id` present | Uploads done, comment failed | Retry comment-only (build fresh fetch call with saved IDs) |
| `error` + `att1Id` only | CSV #2 upload failed | Retry CSV #2 + comment (use saved `att1Id`) |
| `error` + no IDs | Upload #1 failed | Check auth (401/403?), re-navigate, retry from Pattern A |

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
3. Build complete ADF document with `__ATT1_ID__` / `__ATT2_ID__` as literal string placeholders in attachment link nodes
4. Store ADF string in agent context — no need to write to a file (it's transient)

**Validate before posting:** Verify ADF has correct node count and no malformed JSON before running Pattern B.

---

## Large-table handling (> 50 rows)

If CSV content may exceed JS string literal limits, use the standard Pattern A → B → C flow unchanged — Pattern A already separates data-setting from the publish call.

Call sequence:
1. Navigate to Jira issue page
2. Pattern A: set `window.__csv1Data`, `window.__csv2Data`, `window.__adfBody`
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
| `att1Id` + `att2Id` saved, comment failed | Skip re-upload; post comment with saved IDs directly |
| `att1Id` saved, `att2Id` missing | Re-upload CSV #2 only; use saved `att1Id` + new `att2Id` for comment |
| `pending`/`running` after 3s | Read Pattern C once more; if still running, re-execute Pattern B |
| JS execution error (not fetch error) | Verify page is on correct Jira issue; re-run Pattern A + B |
