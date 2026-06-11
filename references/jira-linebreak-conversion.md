# Jira cell line-break conversion (mandatory pre-post gate)

**Problem:** `<br>` in markdown table cells renders as **literal text** on Jira — not a line break. This applies to every delivery method (MCP, REST, paste).

**Rule:** MUST convert `<br>` **before** posting any table to Jira. The chat draft keeps `<br>` for readability; the Jira-bound body does not.

## Conversion by delivery method

| Method | `<br>` becomes | Why |
|--------|----------------|-----|
| **Atlassian MCP** (addCommentToJiraIssue) | `\n` (literal newline) in the body string | MCP converts markdown → ADF internally; `\n` within a cell triggers a hard break in the resulting ADF |
| **ADF JSON** (REST v3 / browser PUT) | `{"type": "hardBreak"}` node inside the paragraph content array | ADF spec; raw `<br>` text is not a valid node |
| **Wiki markup** (REST v2) | `\\` (double backslash) | Jira wiki line-break syntax |
| **User pastes** (manual) | Instruct user: "press Enter inside the cell" | Jira editor handles it |
| **CSV / Excel** | `\n` (real newline character) | Already covered by [csv-export-rules.md](csv-export-rules.md) |

## Conversion pseudocode (agent inline)

```python
import re

def convert_for_jira(text, method="mcp"):
    """Convert <br> tags to Jira-native line breaks."""
    if method in ("mcp", "csv", "excel"):
        return re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    elif method == "wiki":
        return re.sub(r"<br\s*/?>", r"\\\\", text, flags=re.IGNORECASE)
    elif method == "adf":
        # For ADF: split on <br>, interleave with {"type": "hardBreak"} nodes
        # (handled at ADF-building layer, not string replacement)
        raise ValueError("ADF conversion is structural — use ADF builder")
    return text
```

## When to apply

```
Chat draft (Step 5 / Phase F)     →  keep <br>  (readable in markdown)
      ↓ user approves
Jira comment body (Step 7 / G2)   →  CONVERT <br>  ← THIS GATE
CSV / Excel export (Step 6 / G1)  →  CONVERT <br>  (csv-export-rules handles this)
```

## Verification after post

After posting to Jira, re-read the comment on Jira UI and check:

- [ ] No literal `<br>` text visible in any cell
- [ ] Multi-line cells display each numbered item on a separate line
- [ ] If literal `<br>` found → delete comment, re-convert, re-post

## Common mistakes

| Mistake | Result |
|---------|--------|
| Copy chat draft directly to Jira body | `<br>` literal in every multi-line cell |
| Use `\n` in chat draft markdown | Table row breaks in chat (unreadable) |
| Forget conversion for one column | Mixed: some cells OK, some show `<br>` |
| Convert twice (`\n\n`) | Double-spaced cells |
