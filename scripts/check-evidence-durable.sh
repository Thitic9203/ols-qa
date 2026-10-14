#!/bin/bash
# Refuses an evidence location that will not survive a reboot or is not under version control.
#
# Evidence that a decision depends on (eval scenarios, fixtures, run outputs, grader scores,
# lane ledgers) must outlive the session that made it. On 2026-10-14 every eval output of the
# skill-authoring plan lived only in the session scratchpad under /private/tmp; a reboot wiped
# it and the final eval could no longer be compared to the baseline (report #0192, repeat of
# #0008). Run this on the evidence folder BEFORE the first file is written there.
#
#   bash scripts/check-evidence-durable.sh <path> [<path> ...]
#
# Prints one line per path, exactly one of:
#   DURABLE <path> (git work tree <top>)
#   VOLATILE <path> — under <temp root>
#   NOT-VERSIONED <path> — no git work tree above it
#   CANNOT-CHECK <path> — <reason>
#
# exit 0 = every path DURABLE · 1 = at least one VOLATILE / NOT-VERSIONED · 2 = usage, or a path
# could not be checked. "Could not check" is never reported as durable.
set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <path> [<path> ...]" >&2
  exit 2
fi

# Temp roots on macOS and Linux. /tmp and /var are symlinks into /private on macOS, so the
# physical form is checked as well as the spelling the caller used.
TEMP_ROOTS=(/tmp /private/tmp /var/tmp /private/var/tmp /var/folders /private/var/folders)
if [ -n "${TMPDIR:-}" ]; then
  t="${TMPDIR%/}"
  [ -n "$t" ] && TEMP_ROOTS+=("$t")
  tp="$(cd "$t" 2>/dev/null && pwd -P)" && TEMP_ROOTS+=("$tp")
fi

under_temp() { # $1 = absolute path; prints the matching root
  local p="$1" r
  for r in "${TEMP_ROOTS[@]}"; do
    case "$p" in
      "$r" | "$r"/*) printf '%s' "$r"; return 0 ;;
    esac
  done
  return 1
}

worst=0
note() { [ "$1" -gt "$worst" ] && worst="$1"; }

for arg in "$@"; do
  if [ -z "$arg" ]; then
    echo "CANNOT-CHECK '' — empty path"; note 2; continue
  fi
  case "$arg" in
    /*) abs="$arg" ;;
    *) abs="$(pwd -P)/$arg" ;;
  esac
  # A ".." segment could walk out of a durable folder into a temp one after this check.
  case "/$abs/" in
    */../*) echo "CANNOT-CHECK $arg — contains '..'; pass the resolved path"; note 2; continue ;;
  esac

  # The spelling first: /tmp/x is volatile even when it does not exist yet.
  if root="$(under_temp "${abs%/}")"; then
    echo "VOLATILE $arg — under $root (wiped on reboot)"; note 1; continue
  fi

  # Then the physical path of the nearest existing ancestor, so a symlink into a temp root is caught.
  probe="${abs%/}"
  rest=""
  while [ -n "$probe" ] && [ ! -d "$probe" ]; do
    rest="/${probe##*/}$rest"
    probe="${probe%/*}"
  done
  [ -n "$probe" ] || probe="/"
  phys="$(cd "$probe" 2>/dev/null && pwd -P)" || { echo "CANNOT-CHECK $arg — cannot enter $probe"; note 2; continue; }
  if root="$(under_temp "${phys%/}$rest")"; then
    echo "VOLATILE $arg — resolves under $root (wiped on reboot)"; note 1; continue
  fi

  if ! command -v git >/dev/null 2>&1; then
    echo "CANNOT-CHECK $arg — git not installed"; note 2; continue
  fi
  top="$(git -C "$phys" rev-parse --show-toplevel 2>/dev/null)"
  if [ -z "$top" ]; then
    echo "NOT-VERSIONED $arg — no git work tree above it (commit evidence to the evidence repo)"; note 1; continue
  fi
  if root="$(under_temp "$top")"; then
    echo "VOLATILE $arg — its git work tree $top is under $root"; note 1; continue
  fi
  echo "DURABLE $arg (git work tree $top)"
done

exit "$worst"
