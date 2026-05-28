# CSV / Excel export from markdown tables

Use when `tc-fe-prep-workflow` or `tc-api-prep-workflow` writes an export file next to `.md` in the **user’s workspace**.

## Format detection (decide before exporting)

| User’s request contains… | Output format | File extension |
|--------------------------|---------------|----------------|
| `Excel`, `xlsx`, `.xlsx`, `ไฟล์ Excel`, `excel file` | Excel | `.xlsx` |
| anything else (or no mention) | CSV (default) | `.csv` |

Check the user’s **original request** for this session — not just the latest message.

---

## Cell text cleaning (apply to EVERY cell, both formats)

Run these steps on every cell value **before** writing to any file:

1. Convert all `<br>` variants to a newline character — use a case-insensitive regex:
   ```
   pattern: <br\s*/?>   (matches <br>, <br/>, <BR>, <BR/>, <br >, <BR />, etc.)
   replace with: \n
   ```
2. Strip all remaining HTML tags — use a greedy strip:
   ```
   pattern: <[^>]+>
   replace with: (empty string)
   ```
   This removes `<b>`, `<strong>`, `<em>`, `<p>`, `<li>`, `<ul>`, etc.
3. Strip `**` markdown bold markers (replace `**` with empty string).
4. **Do NOT alter, escape, or transliterate any Thai or non-ASCII characters** — preserve them exactly.

After cleaning, a cell that contained `ตรวจสอบ<br>ผลลัพธ์` must read `ตรวจสอบ\nผลลัพธ์` (literal newline, Thai intact).

---

## CSV export (default)

MUST use this path unless the user explicitly requested Excel **or** gave an explicit Helix install directory:

1. Apply **Cell text cleaning** (above) to every cell.
2. Header row = column names from the approved table.
3. Write **UTF-8 with BOM** (`encoding='utf-8-sig'` in Python) — mandatory so Excel opens the file with UTF-8 encoding; without it, Thai and other non-ASCII characters render as garbled symbols.
4. **Multiline cells** (containing `\n`) MUST be double-quoted in the CSV — use Python's `csv.writer` which handles this automatically; do NOT build CSV by string concatenation.
5. Row count must match the approved markdown table (excluding header).

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

1. Apply **Cell text cleaning** (see above) to every cell — `<br>` variants → `\n`, strip HTML tags, strip `**`.
2. Ensure `openpyxl` is available — if not, install it first:
   ```bash
   pip install openpyxl
   ```
3. Generate and run a Python script inline — include the cleaning function:

```python
import re
import openpyxl
from openpyxl.styles import Alignment

def clean_cell(text):
    text = str(text) if text is not None else ""
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)  # <br> variants → newline
    text = re.sub(r"<[^>]+>", "", text)                            # strip remaining HTML tags
    text = text.replace("**", "")                                  # strip markdown bold
    return text.strip()

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Test Cases"

headers = ["{col1}", "{col2}", ...]   # replace with actual column names
ws.append([clean_cell(h) for h in headers])

rows = [
    ["{val}", ...],  # one list per TC row — Thai strings passed as-is
]
for row in rows:
    cleaned = [clean_cell(v) for v in row]
    ws.append(cleaned)
    # enable wrap_text for any cell that contains a newline
    row_idx = ws.max_row
    for col_idx, val in enumerate(cleaned, 1):
        if "\n" in val:
            ws.cell(row=row_idx, column=col_idx).alignment = Alignment(wrap_text=True)

wb.save("{ISSUE_KEY}_FE_TC.xlsx")
print(f"Saved {len(rows)} rows to {ISSUE_KEY}_FE_TC.xlsx")
```

4. Row count printed must match the approved markdown table (excluding header).
5. Save to `references/{ISSUE_KEY}_FE_TC.xlsx` inside the user’s workspace.

### Fallback

If xlsx generation fails (missing Python, permission error, etc.) → warn the user and offer to fall back to UTF-8 BOM CSV instead. **Do not silently produce a CSV when the user asked for xlsx.**
