# Gotchas — TC FE Prep

## Wrong issue

**Symptom:** QA looks at sub-task; table is on story (or vice versa).  
**Prevention:** Repeat the target `{ISSUE_KEY}` before publish; verify URL after post.

## Truncated comment

**Symptom:** Only table header visible on Jira.  
**Cause:** Comment body too large for MCP/markdown path.  
**Fix:** Publish via ADF + full body, or split only if user allows (default is single comment).

## Flattened cell text

**Symptom:** Steps run together on one line.  
**Cause:** Used `\n` inside markdown table cell.  
**Fix:** Use `<br>` in markdown; convert when generating ADF/CSV.

## CSV mismatch

**Symptom:** Spreadsheet row count differs from table.  
**Cause:** Exported from stale markdown or wrong parser.  
**Fix:** Regenerate CSV from the same approved markdown file.

## "Shared" confusion

**Symptom:** Testers do not know what prep was already done.  
**Fix:** Shared numbered list above table + Precondition item 1 = "Shared prep (items 1–N) completed."

## Scope creep

**Symptom:** Cases for cancel-without-edit, permissions, etc. with no EC/AC line.  
**Fix:** Delete or move to the correct story after user confirms.

## False success

**Symptom:** Agent says "posted" but Jira unchanged.  
**Fix:** Require UI verification; check HTTP status and comment id from tool output.

## Attachment not visible

**Symptom:** Footer mentions CSV but no file on issue.  
**Fix:** Upload to **same issue** as comment; refresh attachment id in footer link.

## Hardcoded paths in skill usage

**Symptom:** Comment says `C:\Users\...` or `/Users/...`.  
**Fix:** Only Jira URLs and workspace-relative paths in chat; never in Jira body.
