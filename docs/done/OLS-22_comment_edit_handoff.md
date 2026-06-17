# OLS-22 Comment Edit — Handoff (DONE ✓)

**Goal:** Edit Jira comment **ID 75215** on [OLS-22](https://skilllane.atlassian.net/browse/OLS-22) to add Test Type column, reorder rows, renumber TCs.

---

## Changes made

| Item | Status |
|------|--------|
| `references/OLS-22_FE_TC.csv` | Updated — 10 columns, TC_01–TC_11, ordered Unit→Integration→System |
| Jira attachment **87928** | New CSV uploaded to OLS-22 ✓ |
| Jira attachments 87873, 87921 | Deleted ✓ |
| Jira comment 75215 | **Updated 2026-06-12** via Control Chrome browser fetch ✓ |

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

## Resolution

Comment updated 2026-06-12 via **Control Chrome `execute_javascript`** — embedded full ADF JSON (33 KB) as JS object literal in single `fetch` PUT call. Response confirmed `"updated":"2026-06-12T16:12:46.516+0700"`.

**Why previous approaches failed:**
- Base64 chunk append: LLM transcription errors (~4 chars corrupted per 3000-char chunk)
- `fetch(http://localhost)` from HTTPS Jira: Chrome PNA block
- Atlassian MCP: only `humanintelligence.atlassian.net` auth, not `skilllane.atlassian.net`

**What worked:** Embed full ADF as JS object literal directly in `execute_javascript` `code` parameter — no transcription risk since the MCP framework JSON-encodes the parameter automatically.

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
