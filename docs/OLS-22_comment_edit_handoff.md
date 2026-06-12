# OLS-22 Comment Edit — Handoff (in-progress)

**Goal:** Edit Jira comment **ID 75215** on [OLS-22](https://skilllane.atlassian.net/browse/OLS-22) to add Test Type column, reorder rows, renumber TCs.

---

## Changes made

| Item | Status |
|------|--------|
| `references/OLS-22_FE_TC.csv` | Updated — 10 columns, TC_01–TC_11, ordered Unit→Integration→System |
| Jira attachment **87928** | New CSV uploaded to OLS-22 ✓ |
| Jira attachments 87873, 87921 | Deleted ✓ |
| Jira comment 75215 | **NOT YET UPDATED** — blocked, see below |

### TC column order (new)

`Acceptance Criteria | Services Impacted | Test Case ID | Test Type | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority`

### Row order

| # | TC ID | Test Type | AC/EC |
|---|-------|-----------|-------|
| 1 | TC_01 | Unit | EC_07 |
| 2 | TC_02 | Unit | AC_04 / EC_01 |
| 3 | TC_03 | Unit | AC_05 / EC_02 |
| 4 | TC_04 | Unit | AC_07 / EC_05 |
| 5 | TC_05 | Integration | EC_03 |
| 6 | TC_06 | Integration | AC_06 / EC_04 |
| 7 | TC_07 | Integration | AC_07 / EC_06 |
| 8 | TC_08 | System | AC_01 |
| 9 | TC_09 | System | AC_02 |
| 10 | TC_10 | System | AC_03 (Draft path) |
| 11 | TC_11 | System | AC_03 (Submit path) |

---

## Prepared artifacts

| File | Description |
|------|-------------|
| `/tmp/adf_body2.json` | ADF JSON ready to PUT (34 KB) |
| `/tmp/adf_p1.txt` | base64 chunk 1 of 3 (15 248 chars) |
| `/tmp/adf_p2.txt` | base64 chunk 2 of 3 |
| `/tmp/adf_p3.txt` | base64 chunk 3 of 3 |

> **Note:** `/tmp` files are ephemeral. Regenerate from `/tmp/gen_adf2.py` if gone.  
> ADF footer attachment link: `https://skilllane.atlassian.net/secure/attachment/87928/OLS-22_FE_TC.csv`

---

## Blocker — cannot PUT comment via browser JS

### Symptom

```
fetch('http://localhost:PORT/adf_body2.json')  // from https://skilllane.atlassian.net
→ XHR: readyState 4, status 0, ontimeout after 3s
→ Server log: zero requests received
→ Neither .then() nor .catch() fires
```

### Root cause (suspected)

**Chrome Private Network Access (PNA) policy** silently drops HTTPS→HTTP localhost requests.  
Browser never sends the request — server receives nothing — Promise hangs.

Tried: CORS server with `Access-Control-Allow-Private-Network: true` header — same result.  
Console: no error messages captured (Chrome security blocks don't always surface to JS console).

### Approaches tried / not yet tried

| Approach | Result |
|----------|--------|
| Single large JS string (15K chars) → `window.__p1 = "..."` | `"missing value"` — Control Chrome string size limit |
| `fetch(http://localhost)` from HTTPS Jira page | Timeout — PNA block, server gets nothing |
| Atlassian MCP `fetch` tool | ARI-only, not HTTP client |
| Atlassian MCP `addCommentToJiraIssue` | Adds new comment only, no edit/delete |

### Recommended next steps (pick one)

**Option A — Progressive append via Control Chrome JS (no localhost needed)**
```javascript
// Call 1
window.__b = "";
// Calls 2–N  (each chunk ~3 000 chars, safe for Control Chrome)
window.__b += "<chunk_n>";
// Final call
var body = JSON.parse(new TextDecoder().decode(
  Uint8Array.from(atob(window.__b), c => c.charCodeAt(0))
));
fetch('/rest/api/3/issue/OLS-22/comment/75215', {
  method: 'PUT',
  headers: {'Content-Type':'application/json','X-Atlassian-Token':'no-check'},
  body: JSON.stringify({body: body})
}).then(r=>r.text()).then(t=>window.__editResult=t);
```
Split `/tmp/adf_body2.json` base64 into ~3 000-char pieces from `bash`:
```bash
fold -w 3000 /tmp/adf_p1.txt   # then p2, p3
```

**Option B — Jira API token + curl**
```bash
curl -X PUT \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d @/tmp/adf_body2.json \
  "https://skilllane.atlassian.net/rest/api/3/issue/OLS-22/comment/75215"
```
Ask user for API token from [Jira profile → API tokens](https://id.atlassian.com/manage-profile/security/api-tokens).

**Option C — Regenerate ADF + use Atlassian MCP addCommentToJiraIssue**  
Post as new comment, then manually delete old comment 75215 from Jira UI.  
Downside: comment history shows two comments.

---

## ADF generation script

```bash
python3 /tmp/gen_adf2.py   # outputs /tmp/adf_body2.json
```

If `/tmp/gen_adf2.py` is missing, recreate from the session transcript or regenerate ADF from `references/OLS-22_FE_TC.csv`.

---

## Jira context

- Issue: `OLS-22` at `skilllane.atlassian.net`
- Comment to edit: ID `75215`
- Current attachment: ID `87928` (`OLS-22_FE_TC.csv`)
- Browser tab: `https://skilllane.atlassian.net/browse/OLS-22`
