# Publish options — Jira comment + CSV

Choose method based on content type. **Always verify on Jira UI.**

## Decision flowchart

```
Comment has a markdown table?
├── YES — table with ≥ 1 data row
│   ├── TC table (tc-fe-prep / tc-api-prep) → ADF-direct (Option B / jira-fast-publish patterns)
│   ├── Retest comment > 3 table rows        → ADF-direct Pattern D (comment-only)
│   └── Retest comment ≤ 3 table rows        → MCP (Option A) — fast for short tables
└── NO — text-only or inline key-value pairs
    └── MCP (Option A) — fastest for short text
```

**FE bug retest with screenshots (any table size):** Always v2 wiki markup (Option B variant) — required for `!image!` embed syntax.

**Whichever option you pick, the body must be written in that option's language** — v2 takes wiki
markup, MCP takes markdown, ADF-direct takes ADF JSON. A markdown body sent to v2 returns HTTP 200
and renders as garbage with no error. Syntax map + mandatory pre/post gates:
[jira-wiki-vs-markdown.md](jira-wiki-vs-markdown.md).

Full JS patterns, decision rules, and error recovery: [jira-fast-publish.md](jira-fast-publish.md).

---

## Mandatory: convert `<br>` before posting (all options)

**MUST** convert every `<br>` in the comment body **before** posting to Jira. Chat drafts use `<br>` for readability, but Jira renders it as **literal text**.

Full rules: [jira-linebreak-conversion.md](jira-linebreak-conversion.md).

| Option | `<br>` becomes |
|--------|----------------|
| A (MCP/REST markdown) | `\n` (literal newline in body string) |
| B (ADF JSON) | `{"type": "hardBreak"}` node |
| C (manual paste) | Instruct user to press Enter inside cell |

**Never copy the chat draft directly.** Always run conversion first.

---

## Option A — Atlassian MCP / REST (markdown)

**Use when:** Retest comment ≤ 3 table rows, text-only results, or short comments < 500 chars.
**NOT for:** TC tables — MCP truncates tables consistently; go straight to Option B.
**Risk:** Body truncation — table shows header only.
**Pre-post:** Run `<br>` → `\n` conversion.
**After post:** Count rows on Jira + confirm **no literal `<br>` in any cell**; if incomplete, use Option B.

---

## Option B — ADF + authenticated browser (fast publish)

**Default for:** Any comment with a TC table (tc-fe-prep, tc-api-prep) or retest comment > 3 table rows.

**Pattern (use [jira-fast-publish.md](jira-fast-publish.md) for exact JS):**

1. Pre-compute ADF JSON from approved table (convert `<br>` → `{"type": "hardBreak"}` nodes).
2. Set CSV data + ADF on `window.*` vars (Pattern A).
3. Run single JS: upload CSVs + post ADF comment in one call (Pattern B).
4. Read `window.__fastPublish` for status (Pattern C).
5. Append footer paragraph with attachment links using captured `att1Id`/`att2Id`.

**Do not** inline CSV content as JS string literals — use `window.*` pre-set pattern always.

---

## Option C — Manual handoff

**Use when:** No Jira API or browser automation.

Deliver to user:
- Full markdown in chat.
- CSV file in workspace `references/`.
- Short instructions: attach CSV, paste markdown, verify row count.

---

## Option D — Test.md (agent-native, additive)

**Use when:** TCs will be handed to a Playwright/CLI agent, or read in a PR.

- Offer **alongside** CSV/Excel — never instead of (existing spreadsheet users must not break).
- Format spec: [test-md-format.md](test-md-format.md).
- Same reviewed chat table feeds it; emit exactly the rows shown (no fabricated cases).
- File: `{ISSUE_KEY}.test.md` in workspace `references/`.

---

## Verification checklist

- [ ] Issue key matches user request (story not sub-task).
- [ ] Row count = number of TCs in approved draft.
- [ ] **No literal `<br>` visible in any cell** (zero tolerance — fix and re-post if found).
- [ ] Multi-line cells render on separate lines (each numbered item on its own line).
- [ ] CSV opens with header + same row count.
- [ ] Attachment and comment on the **same issue**.

---

## CSV upload requirements

| Field | Value |
|-------|--------|
| Content-Type | `text/csv` with UTF-8 BOM |
| Filenames | `Draft_Jira_{ISSUE_KEY}.csv` (Jira table format) + `Import_Qase_{ISSUE_KEY}.csv` (Qase import) — upload both |
| Issue | Same as comment target |
| Upload order | `Draft_Jira` first, `Import_Qase` second, typed CSV third (if `{csv_type}` set) |
