#!/usr/bin/env python3
"""Export a Markdown TC table to Test.md (TestMu AI / Kane CLI agent-native format).

Reads a Markdown file containing exactly one pipe table (the reviewed test-case
table) and writes a Test.md file in the official TestMu format: YAML frontmatter
(name/url/tags) + an H1 + one ``## {title}`` section per reviewed TC, whose steps
are a numbered plain-English list (actions + ``Verify ...`` assertions).

Format spec (single source of truth): references/test-md-format.md
Official spec: https://github.com/LambdaTest/agent-skills/blob/main/playwright-skill/reference/test-md-format.md
Sibling exporter (CSV): scripts/export-markdown-table-to-csv.py

Test.md is ADDITIVE — it never replaces CSV/Excel.
Portable: no hard-coded paths, IDs, or customer names.

Usage:
    python3 export-test-md.py INPUT.md [--url https://app.example.com] [-o OUT.test.md]
    python3 export-test-md.py INPUT.md --stdout --url https://app.example.com
    python3 export-test-md.py --self-test     # CI regression point #8

Exit codes:
    0 success, 1 no table found, 2 bad args, 3 self-test failed.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

URL_PLACEHOLDER = "REPLACE_ME"  # surfaced (never guessed) when no --url given

# Column header (lower-cased) -> internal key.
FIELD_MAP = {
    "test case id": "id", "tc id": "id", "id": "id",
    "title": "title", "test title": "title",
    "module/feature": "module", "module": "module", "module / feature": "module",
    "services impacted": "services",
    "priority": "priority",
    "traceability": "traceability",
    "precondition": "precondition",
    "test data": "test_data",
    "test steps": "steps", "steps": "steps",
    "expected result": "expected", "expected": "expected",
}

# An assertion line already phrased as one (Verify/Expect/Check) is kept verbatim.
_ASSERTION_RE = re.compile(r"(?i)^(verify|expect|check that|check\b|assert)\b")


def find_table_lines(text: str) -> list[str]:
    table: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("|") and s.endswith("|"):
            table.append(s)
        elif table:
            break
    return table


def parse_table(table_lines: list[str]) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in table_lines:
        if re.match(r"^\|[\s:|-]+\|$", line):
            continue
        rows.append([c.strip() for c in line.strip("|").split("|")])
    return rows


def split_items(cell: str) -> list[str]:
    if not cell or cell == "—":
        return []
    norm = cell.replace("<br>", "\n").replace("<br/>", "\n").replace("\\n", "\n")
    parts = re.split(r"\n|(?<!\d);(?!\d)", norm)
    out: list[str] = []
    for p in parts:
        p = re.sub(r"^\s*(\d+[.)]|[-*])\s*", "", p.strip()).strip()
        if p:
            out.append(p)
    return out


def _kebab(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.strip().lower()).strip("-")


def _assert_line(text: str) -> str:
    """Phrase an expected-result line as an assertion (prefix 'Verify' if needed)."""
    return text if _ASSERTION_RE.match(text) else f"Verify {text}"


def _section(header_keys, row) -> str:
    data: dict[str, str] = {}
    for key, value in zip(header_keys, row):
        if key:
            data[key] = value

    title = data.get("title", "").strip()
    tc_id = data.get("id", "").strip()
    head = title or tc_id or "Unnamed case"
    heading = f"## {head} ({tc_id})" if (title and tc_id) else f"## {head}"

    # Build the ordered, numbered step list.
    steps: list[str] = []
    pre = data.get("precondition", "").strip()
    if pre and pre != "—":
        steps.append(f"Ensure {pre}")
    td = data.get("test_data", "").strip()
    if td and td != "—":
        steps.append(f"Use test data: {td}")
    steps.extend(split_items(data.get("steps", "")))
    steps.extend(_assert_line(e) for e in split_items(data.get("expected", "")))
    # Unmapped columns -> trailing note steps (no data loss).
    for key, value in zip(header_keys, row):
        if not key and value and value != "—":
            steps.append(f"Note: {value}")

    if not steps:
        steps = ["(no steps provided)"]
    numbered = "\n".join(f"{i}. {s}" for i, s in enumerate(steps, 1))
    return f"{heading}\n\n{numbered}\n"


def build_test_md(text: str, name: str = "", url: str = "") -> str | None:
    table_lines = find_table_lines(text)
    if not table_lines:
        return None
    rows = parse_table(table_lines)
    if len(rows) < 2:
        return None

    raw_header = rows[0]
    header_keys = [FIELD_MAP.get(h.strip().lower(), "") for h in raw_header]
    body = [(r + [""] * len(raw_header))[: len(raw_header)] for r in rows[1:]]

    # File-level tags from distinct module values.
    mod_idx = [i for i, k in enumerate(header_keys) if k == "module"]
    tags: list[str] = []
    if mod_idx:
        for r in body:
            v = r[mod_idx[0]].strip()
            t = _kebab(v) if v and v != "—" else ""
            if t and t not in tags:
                tags.append(t)

    name = name or "Test suite"
    front = ["---", f"name: {name}", f"url: {url or URL_PLACEHOLDER}"]
    if tags:
        front.append(f"tags: [{', '.join(tags)}]")
    front += ["---", "", f"# {name}", ""]

    sections = [_section(header_keys, r) for r in body]
    return "\n".join(front) + "\n".join(sections)


_SELF_TEST_INPUT = """\
| Test Case ID | Title | Precondition | Test Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|
| TC-LOGIN-001 | Valid login | Active user | 1. Open the page; 2. Enter credentials; 3. Submit | user=a@b.com | Dashboard is shown; Verify cookie set | High |
"""


def self_test() -> int:
    out = build_test_md(_SELF_TEST_INPUT, name="SELFTEST", url="https://app.example.com")
    if not out:
        print("self-test FAIL: no output", file=sys.stderr)
        return 3
    required = [
        "name: SELFTEST",
        "url: https://app.example.com",
        "# SELFTEST",
        "## Valid login (TC-LOGIN-001)",
        "Ensure Active user",
        "Use test data: user=a@b.com",
        "Open the page",
        "Enter credentials",
        "Verify Dashboard is shown",   # 'Verify ' prefixed (no assertion verb in source)
        "Verify cookie set",           # already had 'Verify' -> kept verbatim
    ]
    missing = [r for r in required if r not in out]
    if missing:
        print(f"self-test FAIL: missing {missing}", file=sys.stderr)
        return 3
    # The numbered list must actually be numbered.
    if "1. Ensure Active user" not in out:
        print("self-test FAIL: steps not numbered", file=sys.stderr)
        return 3
    print("self-test OK", file=sys.stderr)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", nargs="?", type=Path, help="Markdown file with one table")
    parser.add_argument("-o", "--output", type=Path, help="Test.md output path")
    parser.add_argument("--stdout", action="store_true", help="write to stdout")
    parser.add_argument("--name", default="", help="suite name (frontmatter name + H1)")
    parser.add_argument("--url", default="", help="entry-point URL (required by spec)")
    parser.add_argument("--self-test", action="store_true", help="run internal check")
    args = parser.parse_args(argv)

    if args.self_test:
        return self_test()
    if not args.input:
        parser.error("input is required (or use --self-test)")
    if not args.input.exists():
        print(f"error: input not found: {args.input}", file=sys.stderr)
        return 2

    text = args.input.read_text(encoding="utf-8")
    doc = build_test_md(text, name=args.name or args.input.stem, url=args.url)
    if doc is None:
        print("error: no Markdown table found", file=sys.stderr)
        return 1

    if not args.url:
        print(f"warning: no --url given; wrote '{URL_PLACEHOLDER}' placeholder (spec requires url)", file=sys.stderr)

    if args.stdout:
        sys.stdout.write(doc)
    else:
        out_path = args.output or args.input.with_suffix(".test.md")
        out_path.write_text(doc, encoding="utf-8")
        n = doc.count("\n## ")
        print(f"wrote {out_path} ({n} cases)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
