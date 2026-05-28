#!/usr/bin/env python3
"""Export the first markdown pipe table in a file to UTF-8 CSV with BOM.

Usage:
  python3 scripts/export-markdown-table-to-csv.py INPUT.md [-o OUTPUT.csv]

Helix tc-fe-prep / tc-api-prep: converts <br> to newlines and strips ** bold markers.
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path


def _cell_plain(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    return text.strip()


def _parse_table(lines: list[str]) -> list[list[str]] | None:
    for i, line in enumerate(lines):
        if "|" not in line:
            continue
        row = [c.strip() for c in line.strip().strip("|").split("|")]
        if not row or not all(row):
            continue
        if i + 1 >= len(lines):
            continue
        sep = lines[i + 1].strip()
        if not re.match(r"^\|?[\s:-]+\|", sep):
            continue
        rows: list[list[str]] = [row]
        for body in lines[i + 2 :]:
            if "|" not in body:
                break
            cells = [c.strip() for c in body.strip().strip("|").split("|")]
            if len(cells) != len(row):
                break
            rows.append(cells)
        return rows if len(rows) > 1 else None
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Markdown file containing a table")
    parser.add_argument("-o", "--output", type=Path, help="Output CSV path (default: stdout)")
    args = parser.parse_args()

    text = args.input.read_text(encoding="utf-8")
    table = _parse_table(text.splitlines())
    if not table:
        print("error: no markdown table found", file=sys.stderr)
        return 1

    plain = [[_cell_plain(c) for c in r] for r in table]

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8-sig", newline="") as f:
            csv.writer(f).writerows(plain)
        print(args.output)
    else:
        import io

        buf = io.StringIO()
        csv.writer(buf).writerows(plain)
        sys.stdout.buffer.write(buf.getvalue().encode("utf-8-sig"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
