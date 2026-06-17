# Jira Fast Publish — Speed Optimization Plan

Reduce Jira comment + attachment publish time across all workflows that post to Jira,
without reducing quality gates (post-publish review, formatting checks, verification).

**Problem:** User feedback — commenting is slow, wait time too long.  
**Date:** 2026-06-17  
**Status:** Draft  
**Affected workflows:** `tc-fe-prep`, `tc-api-prep`, `retest-bug`

---

## Current state — where time goes

### TC FE prep (Step 7) — typical 8–12 tool calls, ~2–4 min wall time

| # | Operation | Tool calls | Bottleneck |
|---|-----------|-----------|------------|
| 1 | Navigate to Jira issue page | 1 (Control_Chrome) | Page load ~3s |
| 2 | Upload CSV #1 (Draft_Jira) via browser JS | 1 execute + 1 read result | Async fetch + 2nd read |
| 3 | Upload CSV #2 (Import_Qase) via browser JS | 1 execute + 1 read result | Async fetch + 2nd read |
| 4 | Build comment body (convert `<br>`, build ADF/markdown) | Agent compute | String processing |
| 5 | Try MCP `addCommentToJiraIssue` | 1 MCP call | Often truncates → wasted |
| 6 | Fallback: build ADF JSON + post via browser JS | 1 execute + 1 read | Redo work from #5 |
| 7 | Navigate to issue for verification | 1 navigate | Page load ~3s |
| 8 | Screenshot + visual check | 1–2 screenshot | Render wait |
| 9 | If fail → fix + re-post + re-verify | 3–6 more calls | Full retry loop |

**Total:** 8–12 calls minimum. With one fix round: 14–18 calls.

### Retest bug (Step 7) — typical 5–8 tool calls

| # | Operation | Tool calls | Bottleneck |
|---|-----------|-----------|------------|
| 1 | Try MCP `addCommentToJiraIssue` | 1 | Truncation risk |
| 2 | Fallback: browser session + ADF/wiki | 2–3 | Build + execute + read |
| 3 | Navigate to issue for verification | 1 | Page load |
| 4 | Screenshot + check | 1–2 | Render |
| 5 | FE screenshots upload (if FE bug) | 2–4 | Per-image upload |

### TC API prep (Phase G2) — similar to TC FE prep minus CSV uploads

---

## Root cause analysis

| Root cause | Impact | Frequency |
|-----------|--------|-----------|
| **Sequential file uploads** — each CSV is a separate JS execute + read cycle | +4 tool calls, ~15s | Every tc-fe-prep |
| **MCP-first → ADF-fallback dance** — tries MCP, truncates, rebuilds as ADF, re-posts | +3–4 tool calls, ~20s | Most tables > 5 rows |
| **Comment body built after uploads** — serial dependency chain | Blocks all downstream | Every publish |
| **No parallel operations** — uploads, comment build, navigate all sequential | Cumulative | Every publish |
| **Verification requires fresh navigation** — can't reuse existing page state | +1 navigate + load | Every publish |
| **`Control_Chrome` result-reading requires separate call** — `.then()` chains work but result must be read via `window.*` in a follow-up execute | +1 call per async op | Every browser JS call |

---

## Optimization plan — three changes

### Change 1: Single JS execution for upload + comment (biggest win)

**Current:** 6–8 separate tool calls (navigate + upload #1 + read + upload #2 + read + post comment + read)

**Proposed:** 1 navigate + 1 JS execution that does everything + 1 result read = **3 tool calls total**

#### Design

Create a new reference file `references/jira-fast-publish.md` containing a **single JS snippet pattern** that agents copy and adapt:

#### Pattern A: Pre-set CSV data (Call 1 — always do this first)

```javascript
// Call 1 — set CSV content on window (avoids JS string escaping issues)
// Agent generates CSV content via Python/inline, then sets it here
window.__csv1Data = {CSV1_CONTENT_AS_JS_STRING};  // Draft_Jira CSV
window.__csv2Data = {CSV2_CONTENT_AS_JS_STRING};  // Import_Qase CSV
window.__adfBody = {ADF_JSON_STRING};              // Pre-computed ADF with __ATT1_ID__ / __ATT2_ID__ placeholders
'data set ok';
```

**For the JS string:** Agent must properly escape the content. Safest approach: use `JSON.stringify()` in the Python/inline script that generates the CSV, then paste the escaped string directly. This handles quotes, newlines, and Thai characters.

#### Pattern B: Upload + comment (Call 2 — the single publish call)

```javascript
// Call 2 — runs on Jira issue page; reads window.__csv1Data, __csv2Data, __adfBody
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
      // Preserve partial state so agent can retry just the failed part
      window.__fastPublish = Object.assign(
        window.__fastPublish || {},
        {status: 'error', message: e.message || String(e)}
      );
    });
})();
```

#### Pattern C: Read result (Call 3)

```javascript
JSON.stringify(window.__fastPublish || {status: 'pending'});
```

Agent reads this and checks:
- `status: 'ok'` → publish complete, proceed to verification
- `status: 'error'` + `att1Id` + `att2Id` present → uploads succeeded, only comment failed → retry comment-only
- `status: 'error'` + `att1Id` only → CSV #2 upload failed → retry CSV #2 + comment
- `status: 'error'` + no IDs → upload #1 failed → check auth, retry from start
- `status: 'pending'` or `'running'` → not finished yet → wait 2s, read again

#### Pattern D: Comment-only (retest-bug, no CSVs)

For retest-bug with > 3 table rows (ADF-direct, no CSV uploads):

```javascript
// Simpler variant — just post comment
(function(){
  var issueKey = '{ISSUE_KEY}';
  fetch('/rest/api/3/issue/' + issueKey + '/comment', {
    method: 'POST',
    headers: {'X-Atlassian-Token': 'no-check', 'Content-Type': 'application/json'},
    body: window.__adfBody || '{ADF_JSON_STRING}'
  }).then(function(r){ return r.json(); })
  .then(function(cr){
    window.__fastPublish = {status: 'ok', commentId: cr.id, commentUrl: cr.self};
  })
  .catch(function(e){
    window.__fastPublish = {status: 'error', message: e.message || String(e)};
  });
})();
```

#### Tool call savings

| Scenario | Before | After | Saved |
|----------|--------|-------|-------|
| TC FE prep (2 CSVs + comment) | 8–10 calls | 3 calls | **5–7 calls** |
| Retest bug (comment only, no CSV) | 3–5 calls | 2–3 calls | **1–2 calls** |
| TC API prep (comment + optional CSV) | 4–6 calls | 2–3 calls | **2–3 calls** |

#### Constraints

- Agent MUST still convert `<br>` before building ADF — no change to conversion rules
- Agent MUST pre-build ADF JSON before the JS call — placeholder substitution only for attachment IDs
- **Always use the pre-set pattern** (Pattern A → Pattern B) — never inline CSV content as JS string literals. This avoids escaping nightmares with quotes, Thai characters, and newlines. Even for small tables, the pre-set pattern is safer and barely slower (1 extra call)
- UTF-8 BOM prefix (`﻿`) preserved in Blob constructor
- Agent MUST NOT navigate between Pattern A (pre-set) and Pattern B (publish) calls — navigation clears `window.*` variables
- `Control_Chrome__execute_javascript` runs in the same page context across calls (verified by existing `window.__result` pattern in CLAUDE.md)

#### Large table handling (> 50 rows)

For tables with > 50 rows, CSV content may exceed JS string literal limits. Pattern:

1. **Call 1:** Navigate to Jira issue page (if not already there)
2. **Call 2:** Set CSV data on window variables: `window.__csv1Data = '...'` and `window.__csv2Data = '...'`
3. **Call 3:** Run the upload + comment script referencing `window.__csv1Data` and `window.__csv2Data`
4. **Call 4:** Read `window.__fastPublish`

**Note:** `window.*` variables persist across `Control_Chrome__execute_javascript` calls on the same tab/page — verified in existing CLAUDE.md workaround pattern (`window.__result`). Each call runs in the same page context. Variables are lost only on page navigation or refresh.

Still saves 2–4 calls vs current flow (4 calls vs 6–8).

---

### Change 2: Skip MCP for tables — go ADF-direct

**Current:** Agent tries `addCommentToJiraIssue` (MCP) first → often truncates for any table > 5 rows → falls back to ADF via browser session. This wastes 1–2 calls + the time to discover truncation.

**Proposed decision rule:**

| Content type | Method | Rationale |
|-------------|--------|-----------|
| **TC table** (tc-fe-prep, tc-api-prep) — markdown table with ≥ 1 data row | **ADF-direct** via browser JS (batched in single JS) | TC tables always have many rows; MCP truncates consistently |
| **Retest comment with > 3 table rows** (multi-case evidence table) | **ADF-direct** via browser JS | Enough table content to risk truncation |
| **Retest comment with ≤ 3 table rows or no table** (simple pass/fail + evidence) | **MCP** `addCommentToJiraIssue` | Comment body is short; MCP is fastest for simple text |
| **FE bug retest with screenshots** (any table size) | **v2 wiki** via browser JS | Required for `!image!` syntax; MCP can't embed images |

**Definition of "table" for this rule:** A markdown `| col | col |` table with data rows — not inline key-value pairs like `**Env:** staging`. The evidence summary block (Env, API, Swagger, Date) is NOT a table. The `| Test Case | Input | Result | Status |` block IS a table.

**Key change:** The "try MCP first" fallback pattern is **removed** for TC table comments. For retest-bug, MCP stays as primary for simple comments (≤ 3 table rows). Agent goes straight to ADF/browser path only when table content is substantial.

#### Implementation

Update `references/publish-options.md`:
- Current Option A (MCP) — add: "Use ONLY for short text comments without tables (< 500 chars)"
- Current Option B (ADF) — becomes: "Default for any comment with a table"
- Add decision flowchart at top of file

Update workflow WORKFLOW.md files:
- tc-fe-prep Step 7: Remove "try MCP first" language; ADF-direct is default
- tc-api-prep Phase G2: Same
- retest-bug Step 7a/7b: Rewrite — MCP only for text-only short results; table results go ADF-direct

#### Savings

| Scenario | Calls saved | Time saved |
|----------|-------------|------------|
| TC FE prep (always has table) | 1–2 calls | ~10–15s |
| TC API prep (always has table) | 1–2 calls | ~10–15s |
| Retest bug > 3 table rows | 1–2 calls | ~10–15s |
| Retest bug ≤ 3 table rows | 0 (MCP stays) | 0 |
| Retest bug text-only (no table) | 0 (MCP stays) | 0 |

---

### Change 3: Pre-compute ADF alongside file-write step

**Current:** After user approves draft, agent: (1) writes CSV files (Step 6), then (2) builds ADF JSON (Step 7 start), then (3) publishes. ADF build happens after approval, adding serial time.

**Proposed:** Agent builds ADF JSON **in the same step as file writing** (Step 6 / Phase G1). Since Step 6 already processes the approved table to generate CSV, the agent has the final table content — build ADF at the same time.

#### Design

Merge ADF construction into the file-write step:

```
Step 6 (after user approval):
1. Write markdown file ({ISSUE_KEY}_FE_TC.md)
2. Write Draft_Jira CSV (with <br> → \n conversion)
3. Write Import_Qase CSV
4. Build ADF JSON from the SAME approved table:
   - Convert <br> → {"type": "hardBreak"} nodes
   - Build complete ADF with __ATT1_ID__ and __ATT2_ID__ placeholders
   - Store ADF string in agent context (not a file — it's transient)
5. Report to user: "Files saved. ADF ready. Publishing..."

Step 7:
→ ADF is already built; proceed directly to single JS publish
```

#### Why this timing works

- Step 6 runs **after** user approval — table content is final
- If user requested edits, those were applied before Step 6
- Step 6 already iterates over every cell (for CSV cleaning) — ADF build is a parallel output of the same iteration
- No risk of stale ADF: build happens on the final approved content

#### What if user edits AFTER Step 6?

This is already handled: if user edits after Step 6, the existing workflow re-runs Step 6 (re-write files with changes). ADF is rebuilt as part of the re-run — no special handling needed.

#### Where it applies

| Workflow | Build ADF at | Why |
|----------|-------------|-----|
| tc-fe-prep | Step 6 (file write) | Table is final; CSV and ADF share same source |
| tc-api-prep | Phase G1 (file export) | Same — table finalized at export |
| retest-bug | Step 6 (draft approval) | Comment body is final after approval; ADF built inline if needed (> 3 table rows) |

#### Savings

Eliminates 1 agent "thinking turn" between Step 6 and Step 7 publish. Estimated: **5–15s saved** depending on table size. For small tables, savings are minimal; for 20+ row tables, ADF construction is noticeable.

---

## Combined impact estimate

### TC FE prep (worst case → best case)

| Phase | Before | After | Savings |
|-------|--------|-------|---------|
| Upload 2 CSVs | 4–6 calls | 0 (batched into single JS) | 4–6 calls |
| Post comment | 1–3 calls (MCP try + ADF fallback) | 0 (batched into single JS) | 1–3 calls |
| Single JS (upload + comment) | — | 3 calls (navigate + execute + read) | — |
| ADF build time | ~10s after approval | 0 (pre-computed) | ~10s |
| **Subtotal publish** | **8–12 calls** | **3 calls** | **5–9 calls saved** |
| Verification (unchanged) | 2–3 calls | 2–3 calls | 0 |
| **Total Step 7** | **10–15 calls** | **5–6 calls** | **5–9 calls, ~30–60s** |

### Retest bug API (comment only, > 3 table rows)

| Phase | Before | After | Savings |
|-------|--------|-------|---------|
| Post comment (MCP try + ADF fallback) | 3–5 calls | 2–3 calls (ADF-direct Pattern D) | 1–2 calls |
| Skip MCP fallback | 1–2 wasted calls | 0 | 1–2 calls |
| **Total Step 7** | **5–8 calls** | **4–5 calls** | **1–3 calls, ~15–30s** |

### Retest bug API (simple pass/fail, ≤ 3 table rows)

| Phase | Before | After | Savings |
|-------|--------|-------|---------|
| Post comment (MCP) | 1 call | 1 call (MCP stays) | 0 |
| Verify | 2–3 calls | 2–3 calls | 0 |
| **Total Step 7** | **3–4 calls** | **3–4 calls** | **0 (already fast)** |

### Retest bug FE (comment + screenshots)

| Phase | Before | After | Savings |
|-------|--------|-------|---------|
| Upload screenshots | 2–4 calls | 2–4 calls (images can't batch with CSV easily) | 0 |
| Post comment (v2 wiki) | 2–4 calls | 2–3 calls (ADF-direct skipped for v2 wiki) | 0–1 calls |
| Skip MCP fallback | 1–2 calls | 0 | 1–2 calls |
| **Total Step 7** | **7–10 calls** | **5–7 calls** | **2–3 calls, ~20s** |

---

## Files to create / modify

### New files

| File | Purpose |
|------|---------|
| `references/jira-fast-publish.md` | Core reference — single JS pattern, decision rules, large-table handling, constraints |

### Modified files

| File | Changes |
|------|---------|
| `references/publish-options.md` | Add decision flowchart; MCP restricted to retest-bug short text (≤ 3 table rows); ADF-direct default for TC tables |
| `skills/deprecated/tc-fe-prep-workflow/WORKFLOW.md` | Step 6: add ADF pre-compute alongside CSV write. Step 7: rewrite to use single JS publish pattern, remove MCP-first, link to `jira-fast-publish.md` |
| `skills/deprecated/tc-fe-prep-workflow/references/publish-options.md` | **Replace with thin redirect** to shared `references/jira-fast-publish.md` — no duplicated logic (prevents divergence) |
| `skills/deprecated/tc-api-prep-workflow/WORKFLOW.md` | Phase G1: add ADF pre-compute. Phase G2: rewrite to ADF-direct, link to `jira-fast-publish.md` |
| `skills/deprecated/retest-bug-workflow/WORKFLOW.md` | Step 7a/7b: rewrite with decision rule (≤ 3 rows → MCP, > 3 rows → ADF-direct Pattern D, FE screenshots → v2 wiki); link to `jira-fast-publish.md` |

### Unchanged (quality gates preserved)

| File | Why unchanged |
|------|---------------|
| `references/jira-comment-post-review.md` | Post-publish review stays — mandatory verification not touched |
| `references/jira-linebreak-conversion.md` | `<br>` conversion rules unchanged — still mandatory pre-post |
| `references/csv-export-rules.md` | CSV formatting rules unchanged |
| `references/qa-evidence-gates.md` | Evidence requirements unchanged |
| All Step 7.5 / QA closing / verify-closing | Quality checklist intact |

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Single JS too large for `Control_Chrome` | Script rejected or truncated | Large-table pattern: pre-set CSV on `window.*` in prior call, then run shorter publish script |
| ADF JSON malformed (no MCP safety net) | Comment posts with broken formatting | Pre-compute step validates ADF structure; post-publish review catches rendering issues. Agent must validate ADF has correct node count before posting |
| Browser session expired mid-chain | All uploads + comment fail in `.catch()` | Agent detects `status: 'error'` in `window.__fastPublish`; specific check: if error message contains `401` or `403` → re-navigate to Jira login page, wait for auth, retry |
| CSV content contains quotes/backslashes breaking JS string literal | Upload corrupted or JS syntax error | **Always use `window.__csv*` pre-set pattern** for CSV content (even for small tables). Never inline CSV as a JS string literal — too fragile. Set `window.__csv1Data` in one call, then reference it in the publish call |
| Network error between upload and comment post | Files uploaded but no comment; orphan attachments | `window.__fastPublish` must record partial state: `{status: 'partial', att1Id: '...', att2Id: '...', error: '...'}`. Agent retries comment-only using saved attachment IDs — no re-upload needed |
| Removing MCP-first means losing a working path for short comments | Over-engineering simple comments | Decision rule preserves MCP for retest-bug ≤ 3 table rows and text-only comments. TC workflows always go ADF-direct |
| Skill-specific `publish-options.md` diverges from shared reference | Agents follow stale instructions | **Consolidate:** skill-specific `tc-fe-prep-workflow/references/publish-options.md` becomes a thin redirect to shared `references/jira-fast-publish.md`. No duplicated logic |
| Page navigation between pre-set and publish call clears `window.*` | CSV data lost; publish fails | Agent MUST NOT navigate between the `window.__csv*` pre-set call and the publish call. If navigation is needed (e.g., not on Jira page), navigate FIRST, then pre-set, then publish |

---

## Rollout order

1. **Create** `references/jira-fast-publish.md` — core reference: JS patterns A/B/C/D, decision rules, error handling, constraints
2. **Update** `references/publish-options.md` — add decision flowchart at top; restrict MCP to retest-bug ≤ 3 rows; ADF-direct default for tables; link to `jira-fast-publish.md`
3. **Consolidate** `tc-fe-prep-workflow/references/publish-options.md` — replace with thin redirect to shared references (prevents future divergence)
4. **Update** `tc-fe-prep-workflow/WORKFLOW.md` — Step 6: add ADF pre-compute. Step 7: rewrite to single JS publish, remove MCP-first
5. **Update** `retest-bug-workflow/WORKFLOW.md` — Step 7a/7b: decision rule + Pattern D for > 3 rows
6. **Update** `tc-api-prep-workflow/WORKFLOW.md` — Phase G1: ADF pre-compute. Phase G2: ADF-direct
7. **Test** — run each workflow on a real Jira issue to verify:
   - Speed: count tool calls in transcript (target per success criteria)
   - Quality: post-publish review checklist passes on first try
   - Error recovery: simulate auth failure mid-publish → verify partial state detection + retry

---

## Success criteria

| Metric | Before | Target | How to measure |
|--------|--------|--------|----------------|
| Tool calls for TC FE publish | 10–15 | 5–6 | Count in session transcript |
| Tool calls for retest publish | 5–8 | 4–5 | Count in session transcript |
| Wall time for publish phase | ~2–4 min | ~30–90s | Stopwatch from approval to "verified" |
| Post-publish review pass rate | ~70% first try | ≥ 70% (no regression) | Track fix rounds |
| Quality gate coverage | 100% | 100% (no change) | Checklist items unchanged |

---

## Call sequence — before vs after

### TC FE prep Step 7 (2 CSVs + comment)

**Before (10–15 calls):**
```
navigate → execute(upload CSV1) → read(__result) → execute(upload CSV2) → read(__result)
→ MCP(addComment) → [truncated] → build ADF → execute(postComment) → read(__result)
→ navigate(verify) → screenshot → [fail?] → fix → re-post → screenshot
```

**After (5–6 calls):**
```
navigate → execute(Pattern A: pre-set CSV + ADF)
→ execute(Pattern B: upload + comment) → execute(Pattern C: read result)
→ screenshot(verify) → [fail?] → fix → re-post → screenshot
```

### Retest bug API > 3 rows (comment only)

**Before (5–8 calls):**
```
MCP(addComment) → [truncated] → build ADF → execute(postComment) → read(__result)
→ navigate(verify) → screenshot
```

**After (4–5 calls):**
```
navigate → execute(Pattern A: pre-set ADF) → execute(Pattern D: comment-only)
→ execute(Pattern C: read result) → screenshot(verify)
```

### Retest bug API ≤ 3 rows (simple comment)

**Before and after (3–4 calls) — no change:**
```
MCP(addComment) → navigate(verify) → screenshot
```

---

## Out of scope

- Screenshot upload batching (FE bug retest) — images need per-file metadata, hard to batch safely
- Qase import automation — separate concern, not in publish path
- Jira transition/assign speed — already fast (single MCP call each)
- Comment editing (vs delete + re-post) — Jira API edit is unreliable for ADF updates
