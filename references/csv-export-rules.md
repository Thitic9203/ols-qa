# CSV export from markdown tables

Use when `tc-fe-prep-workflow` or `tc-api-prep-workflow` writes `.csv` next to `.md` in the **user’s workspace**.

## In-agent export (default)

MUST use this path unless the user gave an explicit Helix install directory:

1. Header row = column names from the approved table.
2. Convert `<br>` / `<br/>` in cells to newlines.
3. Strip `**` markdown bold for plain CSV text.
4. Write **UTF-8 with BOM** (Excel-friendly).
5. Row count must match the approved markdown table (excluding header).

## Optional script (user-provided install root only)

If and only if the user states where Helix is installed (e.g. they paste a directory path), you MAY run:

```bash
python3 "{HELIX_INSTALL_ROOT}/scripts/export-markdown-table-to-csv.py" \
  "{workspace-relative-input}.md" \
  -o "{workspace-relative-output}.csv"
```

- `{HELIX_INSTALL_ROOT}` = path **the user provided** in this session.
- NEVER assume `~/.helix`, the agent home directory, or `scripts/` relative to the project under test.

If the script is missing or fails, fall back to in-agent export — do not block delivery.
