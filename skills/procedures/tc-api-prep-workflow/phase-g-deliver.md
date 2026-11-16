# TC API prep — Phase G

Part of [WORKFLOW.md](WORKFLOW.md), opened at Phase G as its WORKFLOW.md section names. Every rule here is a full gate of the workflow.

## Phase G — Deliver (after approval only) [low freedom]

G1 and G2 are independent branches keyed on the Phase C answer: **B** runs G1 only, **A** runs G2
only, **both** runs G1 then G2 (G2 attaches the G1 files). Every branch ends in G-verify.

**Fresh-eyes:** MUST re-read the full draft table before G1/G2 when **> 15 rows** ([skill-rules-style.md](../../../references/skill-rules-style.md)) and print `Fresh-eyes: N rows, fixes: {ids or none}`.

### G1 — File export (B or both)

1. Write markdown with the table to `references/{SCOPE}_API_TC.md` (or user path).
2. **CSV:** only if the Phase C answer is CSV, `both`, or no format named — export per [csv-export-rules.md](../../../references/csv-export-rules.md) to `references/{SCOPE}_API_TC.csv` (in-agent by default). An Excel-only answer writes no CSV.
3. **Excel:** `.xlsx` only if the Phase C answer is Excel or `both` — follow the Excel/xlsx section in [csv-export-rules.md](../../../references/csv-export-rules.md) (Python + openpyxl inline). When openpyxl is missing or fails, warn the user and ask before falling back to CSV — never silently produce CSV when xlsx was requested.
4. **Write failure (steps 1–2, `.md` / `.csv`):** any error (permission, missing folder, disk) → 🔴 **STOP**: report the exact error text and the exact path tried; do not say the file is ready and give no download path for it. Offer two ways forward — write to the workspace root, or to a path the user names — and write only after the user picks one. Under **both**, ask this before G2. Delivery A then continues without the attachment: the comment does not mention one and uses no `__ATT1_ID__` placeholder.
5. **Test.md:** only if the user asked for it — write it from the same approved rows per [delivery-options.md](references/delivery-options.md) § Test.md, alongside CSV/Excel, never instead of them; a write error here is handled as in step 4.

`{SCOPE}` = user-provided name, ticket key, or kebab-case slug of `info.title` (≤ 30 chars), stated in the Phase C line.

Tell the user the **workspace-relative paths** to download.

### G2 — Comment on link (A or both)

**Jira issue destination:**

1. **Build ADF** from the approved Phase F table (only on this branch):
   - Convert every `<br>` in table cells → `{"type": "hardBreak"}` ADF node (rules: [jira-linebreak-conversion.md](../../../references/jira-linebreak-conversion.md)).
   - Build the complete ADF document; **bold every header cell**.
   - **> 50 rows:** offer a CSV/xlsx attachment + summary instead of the inline table; if accepted, write it by G1 steps 2–4 first.
   - If a CSV/Excel file was generated in this run (delivery **both**, or the accepted > 50-row offer), put the `__ATT1_ID__` placeholder in the ADF footer for the attachment link; no file → no placeholder.
2. Check against [jira-comment-post-review.md](../../../references/jira-comment-post-review.md) § Pre-post render + media check. 🔴 **STOP — show the comment preview in chat** (same table, bold headers) and post only after the user explicitly approves this preview. Skip this preview only when the user's Phase F approval message itself gives a post instruction **and** names this destination (e.g. "approved, post to {URL}"); a bare "ok", "approved" or "go" is not a post instruction — show the preview and stop.
3. **Publish — ADF-direct (do NOT try MCP first for TC tables).** Full JS patterns: [jira-fast-publish.md](../../../references/jira-fast-publish.md).
   - Navigate to the Jira issue page.
   - Pattern A: set `window.__adfBody` and one `window.__files` entry per file this run generated (an `.xlsx` as base64 with `encoding: 'base64'`).
   - File generated this run (attach it): Pattern B (upload + comment). No file: Pattern D.
   - Pattern C: read `window.__fastPublish` → check `status: 'ok'` **and** a `commentId`. A non-ok status — or `ok` with no `commentId` — is a failed post: follow that file's Error recovery table first, and never tell the user "commented" on it.
   - G-verify "re-post" of a posted comment = `PUT` to the same comment id, never a second comment.
4. **Fallback — browser JS tool unavailable, or Pattern C still not `ok` after its Error recovery:**
   publish with Jira REST v3 using the user's own credentials (the "Jira REST credentials" row of
   [dependencies.md](../../../references/dependencies.md) — run its check first):
   - Before posting, read the issue's comments (`GET /rest/api/3/issue/{KEY}/comment`) — if a partial run already posted this table, do not post a second copy; fix that comment in place (`PUT …/comment/{id}`) instead.
   - File generated this run: upload the CSV/xlsx with `POST /rest/api/3/issue/{KEY}/attachments` (header `X-Atlassian-Token: no-check`), put the returned attachment id in place of `__ATT1_ID__`.
   - Post the same ADF body with `POST /rest/api/3/issue/{KEY}/comment` (`{"body": <ADF>}`) and keep the returned comment id.
   - REST also fails (non-2xx, or credentials check fails) → 🔴 **STOP**: keep the G1 files and the ADF, report the exact HTTP status and response body to the user, and do not say "commented". Hand the failure to `superpowers:systematic-debugging`; do not retry blindly.

**Confluence page destination:** Patterns A–D and the REST fallback above are Jira-only. Read the page
first, then show in chat exactly what changes (new table appended, or which existing TC table is
replaced — never unrelated sections, per [delivery-options.md](references/delivery-options.md)
§ Confluence). 🔴 **STOP — show the Confluence change preview** and publish only after the user
explicitly approves that preview (same skip rule as the Jira preview in G2 step 2), with the Atlassian
MCP's Confluence page-update tool. MCP unavailable or the update fails → 🔴 **STOP**: write the G1 default CSV (`references/{SCOPE}_API_TC.csv`)
and tell the user its path, report the exact error, and do not say "commented".

### G-verify — Post-publish review (mandatory)

After G1 and/or G2, run the **full review checklist** from [jira-comment-post-review.md](../../../references/jira-comment-post-review.md):

1. Re-open the file path and/or comment URL on the destination.
2. Checklist (items marked **(A only)** / **(B only)** apply only to that delivery; **both** runs all):
   - [ ] Row count matches approved Phase F table.
   - [ ] Columns match Phase B confirmation.
   - [ ] Cell content matches approved draft (spot-check first, middle, last rows).
   - [ ] **(A and B)** **No literal `<br>`, HTML tags, or `**` markers** visible as text in any cell — comment and CSV/xlsx alike (zero tolerance).
   - [ ] **(A only)** Numbered items (`1. ` `2. ` `3. `) each on a **separate line** — not running together.
   - [ ] **(A only)** No truncation on the destination UI.
   - [ ] **(file generated, delivery includes A)** CSV/Excel **attached to the same issue** (not just in workspace) and footer link works.
   - [ ] **(B only)** CSV/xlsx opens with a header row (bold in xlsx) + N data rows; no missing header.
3. If any check fails → fix → re-post → re-verify on the destination UI. **Max 3 rounds** — then 🔴 **STOP** and report the specific failing checks, the destination URL/path and the best available workaround to the user.

**MUST NOT tell user "commented" or "done" until all checks pass.** If a problem cannot be auto-fixed, report the exact issue and propose the best available workaround — never give up with "can't do it."

MUST NOT run G3 close until post-publish review passes — because first export/post is often wrong.

**Go back:** If any G-verify check fails, fix and return to G2 (comment) or G1 (file) to re-post, then run G-verify again — max 3 rounds. G3 waits.

### G3 — Close

Only after **G-verify** pass, follow [session-closing.md](../../../references/session-closing.md) (artifact index, next workflow, `Verdict:`; handoff file, see also [handoff-file-template.md](../../../references/handoff-file-template.md), when > 15 rows or hand-over).

## QA closing (mandatory before "done") [low freedom]

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] Phase E review block posted with **Ready for draft: YES**, endpoint matrix complete, out-of-scope documented, tc-quality-standards PASS.
- [ ] G-verify checklist passed for the chosen delivery (A, B or both), with at least one re-read of the destination.
- [ ] **(A only)** Post-publish review passed per [jira-comment-post-review.md](../../../references/jira-comment-post-review.md).
- [ ] Close-out includes `Verified:` and test case count.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) § *TC FE / TC API prep* — skip its **Final TC review report posted** item (tc-fe-prep only), and skip its attachment item unless a CSV/Excel file was generated in this run **and** the delivery includes A (A alone or both — same rule as G-verify and the MUST table).

**Go back:** If any item above is unchecked, return to the phase it names (E or G) and redo from there; do not report done.
