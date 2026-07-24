#!/bin/bash
# ols-qa secret guard — THIS REPO IS PUBLIC. Nothing identifying the OLS system may land in it.
#
# Two independent detection mechanisms, neither of which stores a real value in this file:
#   TIER1  shape regexes  — generic leak *shapes* (any .go.th host, any atlassian tenant, any
#                           Google/Figma resource URL, tokens, keys, local paths, snowflake ids).
#                           Names no customer; safe to publish.
#   TIER2  hash set       — exact OLS identifiers (accounts, passwords, hosts, resource ids,
#                           staff names) stored ONLY as truncated SHA-256 of the lowercased
#                           token. The cleartext never appears here, yet an exact appearance
#                           anywhere in a scanned file is still caught.
#
# Real values live in ~/.ols-qa-secrets/ols-secrets.md (chmod 600, outside the repo).
# Repo docs must use the placeholders from that file: <DEV_HOST>, <JIRA_DOMAIN>, <TEST_ACCOUNT_n>, …
#
# Usage:  scripts/check-no-secrets.sh <file> [file...]
#         SCAN_ROOT=/tmp/staged scripts/check-no-secrets.sh <path-relative-file>...
# Exit:   0 clean · 1 secret found · 2 scanner error (callers must treat 2 as BLOCK — fail closed)

set -uo pipefail
ROOT="${SCAN_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || echo .)}"
[ "$#" -gt 0 ] || { echo "[guard] usage: $0 <file>..." >&2; exit 2; }
command -v python3 >/dev/null 2>&1 || { echo "[guard] python3 missing — cannot scan" >&2; exit 2; }

SCAN_ROOT="$ROOT" python3 - "$@" <<'PY'
import hashlib, os, re, sys

ROOT = os.environ.get("SCAN_ROOT", ".")

# ---- TIER 2: truncated sha256 (first 16 hex) of each lowercased OLS literal ----
HASHES = {
 "0aaf7876a0d97574","107479db766a4e52","1e7fb61e0c52e09a","28aada8630d19ed0",
 "2f30d4fda3b93580","30e3eb9790be8dfc","430b77817648f751","471e693d1d60fcad",
 "4f5f282a62bcba78","5482c82d6354cf9f","583df84135159c6e","5880330f98adb6b5",
 "5b5148b5b895b431","632c5740d3ee4b2d","6740b9b687d9d85e","6905c2788d8ae015",
 "6944a8aebeedd379","6d039b92e59762e5","71c7c9368622ad7e","734f4d3817b25e2c",
 "7a119b31af7e5b71","7b0685a33f744e78","7c970c1ee0344674","7ce9b8f0ddc285bb",
 "7d84069ff6c499f5","8703dd6648f6b157","8ac161bf9d3dc448","96139b2b7aeb33bb",
 "993c3d59b6478cdf","9b6038a35fa9ed70","a075d17f3d453073","a70816351919e630",
 "b32ae39ad99061a9","b5421f89399b81eb","c48bf74cfd3f2aae","cc9fdb1056a96399",
 "cd8676898a13324c","d7b63fe25c4f0652","d96d71697eda3c18","dbe72ebd6141953e",
 "dd1279dcf5fe9614","ddef587dfb29408f","e0a93c59a497e90b","e6ab62076d81fff7",
 "e7bfb8820ac5888d","eacf6712f81e1e9d","eb86d911fd97c11e","eebe39eb291ea2b0",
 "ef616f6ff602a4a6",
}

# Candidate tokens: ASCII identifier-ish runs (emails, hosts, ids, names) + Thai runs.
TOKEN_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._@+-]{2,}|[฀-๿]{2,}")

# ---- TIER 1: generic leak shapes. No customer named; safe to publish. ----
# A value is a leak only when it is a REAL value. Documentation placeholders
# (<DEV_HOST>, {JIRA_DOMAIN}, example.*, your-org.*, /Users/...) are the fix, not the bug.
PLACEHOLDER = (r"(?<![A-Za-z0-9.-])"                       # start of the token, not mid-word
               r"(?![<{]|\.\.\.|example\.|your-org\.|your-domain\.|domain\.|YOUR-|ORG-)")
TIER1 = [
 (r"[A-Za-z0-9-]+\.go\.th",                                    "Thai-government host (.go.th)"),
 (PLACEHOLDER + r"[A-Za-z0-9-]+\.atlassian\.net",              "Atlassian tenant URL"),
 (r"docs\.google\.com/spreadsheets/d/(?:e/)?" + PLACEHOLDER + r"[A-Za-z0-9_-]{15,}",
                                                               "hardcoded Google Sheet id"),
 (r"drive\.google\.com/drive/folders/" + PLACEHOLDER + r"[A-Za-z0-9_-]{15,}",
                                                               "hardcoded Google Drive folder id"),
 (r"figma\.com/(?:design|file)/" + PLACEHOLDER + r"[A-Za-z0-9]{15,}",
                                                               "hardcoded Figma file id"),
 (r"discord\.com/api/webhooks",                                 "Discord webhook URL"),
 (r"discord\.com/channels/\d+",                                 "Discord channel/thread link"),
 (r"\b\d{17,20}\b",                                            "Discord snowflake id"),
 (r"Bearer\s+[A-Za-z0-9._-]{10,}",                              "Bearer token"),
 (r"eyJ[A-Za-z0-9_-]{20,}",                                     "JWT"),
 (r"xox[baprs]-[A-Za-z0-9-]{10,}",                              "Slack token"),
 (r"gh[pousr]_[A-Za-z0-9]{20,}",                                "GitHub token"),
 (r"AKIA[0-9A-Z]{16}",                                          "AWS access key id"),
 (r"-----BEGIN [A-Z ]*PRIVATE KEY",                             "private key"),
 (r"\b6L[A-Za-z0-9_-]{38}\b",                                   "reCAPTCHA site key"),
 (r"/Users/" + PLACEHOLDER + r"[A-Za-z0-9._-]+",                 "local machine path"),
 (r"C:\\\\Users\\\\" + PLACEHOLDER + r"[A-Za-z0-9._-]+",           "local machine path (Windows)"),
 (r"(?i)\bp@ssw[o0]rd",                                         "password literal"),
]
TIER1 = [(re.compile(p), why) for p, why in TIER1]

# Files that legitimately contain the *shapes* because they define/scan for them.
EXEMPT_TIER1 = {"scripts/check-no-secrets.sh", "SECURITY.md"}

bad = 0
for rel in sys.argv[1:]:
    path = os.path.join(ROOT, rel)
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            lines = fh.read().splitlines()
    except (FileNotFoundError, IsADirectoryError):
        continue
    except OSError as exc:
        print(f"[guard] ERROR reading {rel}: {exc}", file=sys.stderr)
        sys.exit(2)

    for n, line in enumerate(lines, 1):
        if rel not in EXEMPT_TIER1:
            for rx, why in TIER1:
                m = rx.search(line)
                if m:
                    print(f"{rel}:{n}: SHAPE  {why}  ->  {m.group(0)[:60]}")
                    bad += 1
                    break
        for tok in TOKEN_RE.findall(line):
            if hashlib.sha256(tok.lower().encode()).hexdigest()[:16] in HASHES:
                print(f"{rel}:{n}: EXACT  known OLS identifier (redacted)")
                bad += 1
                break

if bad:
    print(f"\n[guard] {bad} finding(s). This repo is PUBLIC.")
    print("[guard] Replace the value with its placeholder; real values live in")
    print("[guard]   ~/.ols-qa-secrets/ols-secrets.md  (chmod 600, never committed).")
    sys.exit(1)
sys.exit(0)
PY
