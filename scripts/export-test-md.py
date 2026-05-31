#!/usr/bin/env python3
"""Export a Markdown TC table to Test.md (agent-native test cases).

Reads a Markdown file containing exactly one pipe table (the test-case table)
and writes a Test.md file: one ``## {id} — {title}`` block per case, with
labeled fields, a numbered Steps list, and an Expected bullet list.

Format spec (single source of truth): references/test-md-format.md
Sibling exporter (CSV): scripts/export-markdown-table-to-csv.py

Test.md is ADDITIVE — it never replaces CSV/Excel.
Portable: no hard-coded paths, IDs, or customer names.

Usage:
    python3 export-test-md.py INPUT.md [-o OUTPUT.test.md]
    python3 export-test-md.py INPUT.md --stdout
    python3 export-test-md.py --self-test     # CI regression point #8

Exit codes:
    0 success, 1 no table found, 2 bad args, 3 self-test failed.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Column header (lower-cased) -> Test.md field key. Order = emission order.
FIELD_MAP = {
    "test case id": "id",
    "tc id": "id",
    "id": "id",
    "title": "title",
    "module/feature": "module",
    "module": "module",
    "services impacted": "services",
    "priority": "priority",
    "traceability": "traceability",
    "precondition": "precondition",
    "test data": "test_data",
    "test steps": "steps",
    "steps": "steps",
    "expected result": "expected",
    "expected": "expected",
}

# Fields rendered as inline ``- key: value`` lines (in this order).
INLINE_FIELDS = ["id", "priority", "traceability", "module", "services",
                 "precondition", "test_data"]


def find_table_lines(text: str) -> list[str]:
    """Return the lines of the first contiguous pipe table in *text*."""
    table: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            table.append(stripped)
        elif table:
            break
    return table


def parse_table(table_lines: list[str]) -> list[list[str]]:
    """Parse pipe-table lines into rows of cells (skips the --- separator)."""
    rows: list[list[str]] = []
    for line in table_lines:
        if re.match(r"^\|[\s:|-]+\|$", line):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        rows.append(cells)
    return rows


def split_items(cell: str) -> list[str]:
    """Split a multi-step / multi-expected cell into clean items."""
    if not cell or cell == "—":
        return []
    # Normalize common in-cell separators to newlines.
    norm = cell.replace("<br>", "\n").replace("<br/>", "\n").replace("\\n", "\n")
    parts = re.split(r"\n|(?<!\d);(?!\d)", norm)
    items: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # Strip leading "1." / "1)" / "- " numbering.
        p = re.sub(r"^\s*(\d+[.)]|[-*])\s*", "", p).strip()
        if p:
            items.append(p)
    return items


def build_test_md(text: str, suite: str = "", source: str = "") -> str | None:
    """Convert one-table Markdown *text* to a Test.md document, or None."""
    table_lines = find_table_lines(text)
    if not table_lines:
        return None
    rows = parse_table(table_lines)
    if len(rows) < 2:
        return None

    raw_header = rows[0]
    body = rows[1:]
    header_keys = [FIELD_MAP.get(h.strip().lower(), "") for h in raw_header]

    # Preserve unmapped columns by name.
    unmapped = [(i, raw_header[i]) for i, k in enumerate(header_keys) if not k]

    front = [
        "---",
        f"suite: {suite or '—'}",
        "format: test.md/v0 (helix)",
        f"source: {source or '—'}",
        f"count: {len(body)}",
        "---",
        "",
    ]
    blocks: list[str] = []
    for row in body:
        row = (row + [""] * len(raw_header))[: len(raw_header)]
        blocks.append(_render_block(header_keys, row, unmapped))
    return "\n".join(front) + "\n".join(blocks)


def _render_block(header_keys, row, unmapped) -> str:
    data: dict[str, str] = {}
    for key, value in zip(header_keys, row):
        if key:
            data[key] = value
    tc_id = data.get("id", "TC-UNNAMED")
    title = data.get("title", "").strip()
    heading = f"## {tc_id} — {title}" if title else f"## {tc_id}"
    lines = [heading, ""]
    for f in INLINE_FIELDS:
        if data.get(f, "") != "":
            lines.append(f"- {f}: {data[f]}")
    for idx, name in unmapped:
        val = row[idx] if idx < len(row) else ""
        if val:
            lines.append(f"- {name.strip().lower().replace(' ', '_')}: {val}")
    steps = split_items(data.get("steps", ""))
    if steps:
        lines += ["", "**Steps:**"] + [f"{i}. {s}" for i, s in enumerate(steps, 1)]
    expected = split_items(data.get("expected", ""))
    if expected:
        lines += ["", "**Expected:**"] + [f"- {e}" for e in expected]
    return "\n".join(lines).rstrip() + "\n\n"


_SELF_TEST_INPUT = """\
| Test Case ID | Title | Precondition | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| TC-LOGIN-001 | Valid login | Active user | 1. Open page; 2. Enter creds; 3. Submit | user=a@b.com | Dashboard shown; cookie set | High |
"""


def self_test() -> int:
    out = build_test_md(_SELF_TEST_INPUT, suite="SELFTEST", source="self-test")
    if not out:
        print("self-test FAIL: no output", file=sys.stderr)
        return 3
    required = [
        "format: test.md/v0 (helix)",
        "count: 1",
        "## TC-LOGIN-001 — Valid login",
        "- id: TC-LOGIN-001",
        "- priority: High",
        "- precondition: Active user",
        "**Steps:**",
        "1. Open page",
        "2. Enter creds",
        "3. Submit",
        "**Expected:**",
        "- Dashboard shown",
        "- cookie set",
    ]
    missing = [r for r in required if r not in out]
    if missing:
        print(f"self-test FAIL: missing {missing}", file=sys.stderr)
        return 3
    print("self-test OK", file=sys.stderr)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", nargs="?", type=Path, help="Markdown file with one table")
    parser.add_argument("-o", "--output", type=Path, help="Test.md output path")
    parser.add_argument("--stdout", action="store_true", help="write to stdout")
    parser.add_argument("--suite", default="", help="suite name for frontmatter")
    parser.add_argument("--source", default="", help="source ref for frontmatter")
    parser.add_argument("--self-test", action="store_true", help="run internal round-trip check")
    args = parser.parse_args(argv)

    if args.self_test:
        return self_test()

    if not args.input:
        parser.error("input is required (or use --self-test)")
    if not args.input.exists():
        print(f"error: input not found: {args.input}", file=sys.stderr)
        return 2

    text = args.input.read_text(encoding="utf-8")
    doc = build_test_md(text, suite=args.suite or args.input.stem, source=args.source)
    if doc is None:
        print("error: no Markdown table found", file=sys.stderr)
        return 1

    if args.stdout:
        sys.stdout.write(doc)
    else:
        out_path = args.output or args.input.with_suffix(".test.md")
        out_path.write_text(doc, encoding="utf-8", errors="strict")
        n = doc.count("\n## ")
        print(f"wrote {out_path} ({n} cases)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
