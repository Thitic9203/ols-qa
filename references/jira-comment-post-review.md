# Jira comment post-publish review (mandatory before reporting "done")

After posting a TC comment to Jira, the agent MUST review the rendered comment on Jira UI, fix any issues, and re-verify — **before telling the user it's done.**

## Rule

```
Post comment → Review on Jira UI → Pass all checks?
  YES → Report to user: "commented"
  NO  → Fix → Re-post → Re-review (max 3 rounds)
        Still failing → Report specific failures to user, do NOT claim success
```

**MUST NOT say "commented", "posted", "done", or any success phrase until all checks pass.**

## Review checklist (all items must pass)

### 1. Content completeness

- [ ] **All TC rows present** — count rows on Jira UI, must match approved draft row count
- [ ] **Shared data preparation section** visible above table (if applicable)
- [ ] **Precondition note** visible (if applicable)
- [ ] **Table header row** visible with all column names
- [ ] **Footer** visible (CSV/Excel reference line, attachment link)

### 2. Content accuracy

- [ ] **Cell content matches approved draft** — spot-check at least 3 rows: first, middle, last
- [ ] **Test Case IDs** sequential and correct (no gaps, no duplicates)
- [ ] **Priority values** match draft (High/Medium/Low)
- [ ] **Bold header cells** render as bold on Jira (not literal `**`)

### 3. No stray markup or HTML tags

- [ ] **No literal `<br>`** in any cell (zero tolerance)
- [ ] **No literal `<br/>`** or `<BR>` variants
- [ ] **No other HTML tags** visible as text (`<b>`, `<p>`, `<li>`, `<ul>`, `<strong>`, etc.)
- [ ] **No literal `**`** showing as text (markdown bold markers should render, not display)
- [ ] **No `\n`** showing as literal text

### 4. Numbered item formatting

- [ ] **Numbered items** use `1. ` `2. ` `3. ` format (dot + space after number)
- [ ] **Each numbered item starts on a new line** — must not run together on same line
- [ ] **Numbering is sequential** within each cell (no skipped numbers, no restart mid-cell)
- [ ] **Consistent format** across all cells — same pattern in Test Steps, Expected Result, Precondition

### 5. Attachment (when CSV/Excel was generated)

- [ ] **CSV or Excel file attached** to the same Jira issue (not just in workspace)
- [ ] **Attachment filename** matches convention (`{ISSUE_KEY}_FE_TC.csv` or similar)
- [ ] **Attachment opens correctly** — row count matches table, Thai characters intact
- [ ] **Footer link** in comment points to the actual attachment (not a broken/missing link)

If CSV/Excel was generated in a prior step but NOT attached to Jira → **attachment is missing. Fix before reporting done.**

## Fix procedure (when any check fails)

| Failure | Fix |
|---------|-----|
| Missing rows / truncated table | Re-post full comment (delete old if partial); consider ADF for large tables |
| Literal `<br>` or HTML tags | Re-run [jira-linebreak-conversion.md](jira-linebreak-conversion.md), strip tags, re-post |
| Numbered items on same line | Verify conversion produced actual line breaks; re-post with corrected body |
| Literal `**` visible | Jira may not support markdown bold in this context; switch to ADF bold or remove markers |
| CSV not attached | Upload CSV/Excel to the issue via MCP or browser; update footer link |
| Footer link broken | Get correct attachment URL after upload; edit comment footer |

After fix → **re-read on Jira UI again** and re-run the full checklist. Do not assume the fix worked.

## Reporting to user

Only after ALL checks pass:

```text
Commented on {ISSUE_KEY} — {N} test cases posted.
Attachment: {FILENAME} ({N} rows).
Verified on Jira UI: all rows visible, formatting correct, attachment present.
```

If a fix attempt fails, **find the best alternative — never give up or say "can't do it":**

| Blocked by | Escalation path |
|------------|-----------------|
| MCP post shows `<br>` literal | Delete comment → re-post with `\n` conversion. If MCP still fails → switch to ADF via browser. If no browser → provide corrected body for user to paste manually. |
| MCP truncates table | Switch to ADF + browser session. If no browser → split into 2 comments (header+first half, second half) with clear labels. |
| CSV upload fails via MCP | Try browser upload. If no browser → save CSV in workspace + instruct user to drag-and-drop attach. |
| Bold `**` not rendering | Switch to ADF bold nodes. If not possible → accept plain text headers (functional over pretty). |
| Numbered items still on same line | Check conversion output — likely `\n` not actually inserted. Re-run conversion with explicit verification before re-post. |

After exhausting automated options → provide the user with:
1. **Corrected comment body** (ready to paste)
2. **CSV file path** (ready to attach)
3. **Specific instructions** for what to do manually

```text
Comment posted on {ISSUE_KEY} but {specific issue} requires manual adjustment.
Here's the corrected body ready to paste: [see above]
CSV file: {workspace path} — please attach to {ISSUE_KEY}
```

Never use vague success language. Be specific about what was verified.
