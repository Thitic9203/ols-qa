# CSV / Excel export from markdown tables

Use when `tc-fe-prep-workflow` or `tc-api-prep-workflow` writes an export file next to `.md` in the **user’s workspace**.

## Format detection (decide before exporting)

| User’s request contains… | Output format | File extension |
|--------------------------|---------------|----------------|
| `Excel`, `xlsx`, `.xlsx`, `ไฟล์ Excel`, `excel file` | Excel | `.xlsx` |
| anything else (or no mention) | CSV (default) | `.csv` |

Check the user’s **original request** for this session — not just the latest message.

---

## CSV export (default)

MUST use this path unless the user explicitly requested Excel **or** gave an explicit Helix install directory:

1. Header row = column names from the approved table.
2. Convert `<br>` / `<br/>` in cells to newlines.
3. Strip `**` markdown bold for plain CSV text.
4. Write **UTF-8 with BOM** — the BOM (`﻿`) is mandatory so Excel opens the file with UTF-8 encoding; without it, Thai and other non-ASCII characters render as garbled symbols.
5. **Do NOT alter, escape, or transliterate any Thai or non-ASCII characters** — preserve them exactly as they appear in the approved table.
6. Row count must match the approved markdown table (excluding header).

### Optional CSV script (user-provided install root only)

If and only if the user states where Helix is installed (e.g. they paste a directory path), you MAY run:

```bash
python3 "{HELIX_INSTALL_ROOT}/scripts/export-markdown-table-to-csv.py" \
  "{workspace-relative-input}.md" \
  -o "{workspace-relative-output}.csv"
```

- `{HELIX_INSTALL_ROOT}` = path **the user provided** in this session.
- NEVER assume `~/.helix`, the agent home directory, or `scripts/` relative to the project under test.

If the script is missing or fails, fall back to in-agent CSV export — do not block delivery.

---

## Excel / xlsx export (when user explicitly requests Excel)

Use this path when format detection resolves to `.xlsx`.

### In-agent xlsx export

1. Parse the approved markdown table into header row + data rows.
2. Convert `<br>` / `<br/>` in cells to `\n`.
3. Strip `**` markdown bold for plain text.
4. **Do NOT alter, escape, or transliterate any Thai or non-ASCII characters** — openpyxl handles Unicode natively; pass Thai strings as-is into `ws.append()`.
5. Ensure `openpyxl` is available — if not, install it first:
   ```bash
   pip install openpyxl
   ```
5. Generate and run a Python script inline:

```python
import openpyxl

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Test Cases"

headers = ["{col1}", "{col2}", ...]   # replace with actual column names
ws.append(headers)

rows = [
    ["{val}", ...],  # one list per TC row
]
for row in rows:
    ws.append(row)

wb.save("{ISSUE_KEY}_FE_TC.xlsx")
print(f"Saved {len(rows)} rows to {ISSUE_KEY}_FE_TC.xlsx")
```

6. Row count printed must match the approved markdown table (excluding header).
7. Save to `references/{ISSUE_KEY}_FE_TC.xlsx` inside the user’s workspace.

### Fallback

If xlsx generation fails (missing Python, permission error, etc.) → warn the user and offer to fall back to UTF-8 BOM CSV instead. **Do not silently produce a CSV when the user asked for xlsx.**
