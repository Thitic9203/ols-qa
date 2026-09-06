#!/bin/bash
# Count the OPEN rows in a post-mortem debt ledger — the shell fallback used when the
# Node gate (check.js --gate) cannot be run at all.
#
#   bash tools/postmortem-guard/ledger_open_count.sh <path to PENDING.md>
#
#   stdout "N"          exit 0   N open rows, counted with confidence
#   stdout "REFUSE:why" exit 2   could not determine — the CALLER MUST TREAT THIS AS BLOCKING
#
# There is no third outcome, and "0" is never printed for a ledger this could not read.
# That distinction is the whole reason this file exists: the first version of the gate
# inlined an awk one-liner whose output went straight into `[ "$COUNT" -gt 0 ]`, so an
# unreadable ledger produced an empty string, the test quietly evaluated false, and the
# commit sailed through with debt outstanding. Measured 2026-09-06: awk on an unreadable
# file writes nothing to stdout and exits 2 — nothing about that says "no debt".
#
# The path is an ARGUMENT, never an environment variable: the two real callers pass the
# one real ledger, and the tests pass fixtures. An env override would be a bypass.
set -uo pipefail

LEDGER="${1:-}"
[ -n "$LEDGER" ]  || { echo "REFUSE:no ledger path given"; exit 2; }
[ -e "$LEDGER" ]  || { echo "REFUSE:ledger does not exist: $LEDGER"; exit 2; }
[ -f "$LEDGER" ]  || { echo "REFUSE:ledger is not a regular file: $LEDGER"; exit 2; }
[ -r "$LEDGER" ]  || { echo "REFUSE:ledger exists but is unreadable: $LEDGER"; exit 2; }

# Columns are resolved from the header row BY NAME, never by position.
#
# The inlined version tested `NF < 7` and read `$6`. Both were wrong, and wrong quietly:
# with -F'|' a correct 6-column row yields NF=8 (the empty strings either side of the
# outer pipes), so a row cut down to 5 columns yields NF=7, passes the guard, and `$6`
# then reads a different column — an OPEN row read as something else and never counted.
# Same class as PM-010: identity, not position.
#
# LC_ALL=C IS LOAD-BEARING, not tidiness. The header names are Thai, and on the awk this
# machine ships (version 20200816) `==` compares by COLLATION as soon as the locale is a
# UTF-8 one. An en_US collation table orders every Thai string equal to every other:
#
#   LC_ALL=en_US.UTF-8 awk 'BEGIN{ print ("อาการ"=="สถานะ"), ("อาการ"<"สถานะ") }'  →  1 0
#   LC_ALL=C           awk 'BEGIN{ print ("อาการ"=="สถานะ"), ("อาการ"<"สถานะ") }'  →  0 1
#
# so the loop below matched EVERY Thai column and kept the last one (รายงาน). `$status_col
# == "OPEN"` then never matched and this script printed 0 for a ledger with an OPEN row —
# the fail-closed fallback of report #0003 running fail-open on the machine's own default
# locale, which is en_US.UTF-8. Measured 2026-09-06. ASCII names ("ID") were unaffected,
# which is why the header was still found at all and nothing looked wrong.
#
# C makes `==` a byte comparison, which is what a fixed literal needs. The duplicate check
# below is the second, independent net: had it existed, the bug would have arrived as a
# refusal instead of a silent zero.
OUT="$(LC_ALL=C awk -F'|' '
  function trim(s) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", s); return s }

  !/^[[:space:]]*\|/ { if (hdr) done = 1; next }

  {
    if (done) next

    if (!hdr) {
      n_id = 0; n_status = 0; n_report = 0
      for (i = 1; i <= NF; i++) {
        f = trim($i)
        if (f == "ID")     { n_id++;     id_col = i }
        if (f == "สถานะ")   { n_status++; status_col = i }
        if (f == "รายงาน")  { n_report++ }
      }
      # Only a row carrying all three names is the ledger header; anything else is some
      # other table and we keep looking. But once it IS the header, a name that matched
      # more than one column is unresolvable — no rule can say which of them holds the
      # data, so refuse rather than keep whichever the loop happened to see last.
      if (n_id >= 1 && n_status >= 1 && n_report >= 1) {
        if (n_id > 1 || n_status > 1 || n_report > 1) {
          printf "REFUSE:line %d names a ledger column more than once (ID x%d, สถานะ x%d, รายงาน x%d)\n", NR, n_id, n_status, n_report
          refused = 1; exit 2
        }
        hdr = 1; hdr_nf = NF
      }
      next
    }

    sep = 1
    for (i = 2; i < NF; i++) if (trim($i) !~ /^:?-{2,}:?$/) { sep = 0; break }
    if (sep) next

    if (NF != hdr_nf) {
      printf "REFUSE:line %d has %d columns, the header has %d\n", NR, NF - 2, hdr_nf - 2
      refused = 1; exit 2
    }

    id = trim($id_col)
    if (id !~ /^PM-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/) {
      printf "REFUSE:line %d id \"%s\" is not a ledger id\n", NR, id
      refused = 1; exit 2
    }

    if (trim($status_col) == "OPEN") n++
  }

  END {
    if (refused) exit 2
    if (!hdr) { print "REFUSE:no ledger table header found (need ID … สถานะ … รายงาน)"; exit 2 }
    print n + 0
  }
' "$LEDGER" 2>/dev/null)"
rc=$?

# A non-zero awk is a refusal even when it printed nothing, and an unexpected stdout shape
# is a refusal too. Anything that is not a bare integer must never reach the caller's
# arithmetic test, because that is exactly where an empty string reads as "no debt".
if [ "$rc" -ne 0 ]; then
  case "$OUT" in
    REFUSE:*) echo "$OUT" ;;
    *)        echo "REFUSE:could not read the ledger (awk exit $rc)" ;;
  esac
  exit 2
fi

case "$OUT" in
  ''|*[!0-9]*) echo "REFUSE:unusable count '$OUT' from the ledger"; exit 2 ;;
esac

echo "$OUT"
exit 0
