#!/usr/bin/env bash
# Record with: asciinema rec demo.cast -c "bash demo/helix-demo.sh"

BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
WHITE='\033[1;37m'
RESET='\033[0m'

type_out() {
  local text="$1"
  local delay="${2:-0.04}"
  for ((i=0; i<${#text}; i++)); do
    printf "%s" "${text:$i:1}"
    sleep "$delay"
  done
}

pause() { sleep "${1:-0.6}"; }
line() { echo; }
hr() { echo -e "${DIM}────────────────────────────────────────────────────────────────────${RESET}"; }

clear
pause 0.5

# Prompt
printf "${GREEN}\$${RESET} "
type_out "/helix qa-full" 0.07
line; pause 0.8

hr
echo -e "${WHITE}${BOLD}◈ Helix — QA Full Pipeline${RESET}"
echo -e "${DIM}ISO 25010 · ISTQB CTFL v4.0 · IEEE 829 · ISO 31000${RESET}"
hr
line; pause 0.5

# Phase 1
echo -e "${CYAN}${BOLD}[1/7] QA STRATEGY${RESET}  ${DIM}(ISO 25010 + ISTQB)${RESET}"
pause 0.4
echo -e "  ${GREEN}✓${RESET} Scope: full-stack web application"
pause 0.3
echo -e "  ${GREEN}✓${RESET} Quality characteristics: Functional Suitability, Performance Efficiency, Security"
pause 0.3
echo -e "  ${GREEN}✓${RESET} Test approach: risk-based, shift-left"
pause 0.3
echo -e "  ${GREEN}✓${RESET} Entry criteria defined · Exit criteria defined"
pause 0.5; line

# Phase 2
echo -e "${CYAN}${BOLD}[2/7] RISK MATRIX${RESET}  ${DIM}(ISO 31000 · Likelihood × Impact)${RESET}"
pause 0.4
echo -e "  ${RED}HIGH${RESET}    Auth bypass — P=4 I=5 → score 20  ${BOLD}▶ prioritised${RESET}"
pause 0.3
echo -e "  ${YELLOW}MEDIUM${RESET}  Payment edge cases — P=3 I=4 → score 12"
pause 0.3
echo -e "  ${YELLOW}MEDIUM${RESET}  Search query injection — P=2 I=4 → score 8"
pause 0.3
echo -e "  ${GREEN}LOW${RESET}     UI layout on mobile — P=3 I=2 → score 6"
pause 0.5; line

# Phase 3 - Tier 1
echo -e "${CYAN}${BOLD}[3/7] TIER 1 — FUNCTIONAL TESTS${RESET}"
pause 0.4
printf "  ${DIM}unit        ${RESET}"; pause 0.2
printf "${YELLOW}running...${RESET}"; pause 1.2
printf "\r  ${DIM}unit        ${RESET}${GREEN}✓ 147 passed${RESET}  ${DIM}(0 failed · 2.1s)${RESET}\n"
pause 0.3
printf "  ${DIM}integration ${RESET}"; pause 0.2
printf "${YELLOW}running...${RESET}"; pause 1.5
printf "\r  ${DIM}integration ${RESET}${GREEN}✓ 38 passed${RESET}   ${DIM}(0 failed · real DB · 8.4s)${RESET}\n"
pause 0.3
printf "  ${DIM}e2e         ${RESET}"; pause 0.2
printf "${YELLOW}running...${RESET}"; pause 1.8
printf "\r  ${DIM}e2e         ${RESET}${GREEN}✓ 24 passed${RESET}   ${DIM}(0 failed · Playwright · 31s)${RESET}\n"
pause 0.3
printf "  ${DIM}contract    ${RESET}"; pause 0.2
printf "${YELLOW}running...${RESET}"; pause 1.0
printf "\r  ${DIM}contract    ${RESET}${GREEN}✓ 12 passed${RESET}   ${DIM}(0 failed · Pact · 4.2s)${RESET}\n"
pause 0.5; line

# Phase 4 - Tier 2
echo -e "${CYAN}${BOLD}[4/7] TIER 2 — QUALITY TESTS${RESET}"
pause 0.4
printf "  ${DIM}security    ${RESET}"; pause 0.2
printf "${YELLOW}scanning...${RESET}"; pause 1.4
printf "\r  ${DIM}security    ${RESET}${GREEN}✓ clean${RESET}       ${DIM}(OWASP · semgrep · trufflehog · trivy)${RESET}\n"
pause 0.3
printf "  ${DIM}a11y        ${RESET}"; pause 0.2
printf "${YELLOW}auditing... ${RESET}"; pause 1.0
printf "\r  ${DIM}a11y        ${RESET}${YELLOW}⚠ 2 warnings${RESET}  ${DIM}(axe-core · WCAG 2.1 AA — non-blocking)${RESET}\n"
pause 0.3
printf "  ${DIM}visual      ${RESET}"; pause 0.2
printf "${YELLOW}comparing...${RESET}"; pause 1.2
printf "\r  ${DIM}visual      ${RESET}${GREEN}✓ no diff${RESET}     ${DIM}(Playwright snapshots · 18 screens)${RESET}\n"
pause 0.5; line

# Phase 5 - Exploratory
echo -e "${CYAN}${BOLD}[5/7] EXPLORATORY SESSION${RESET}  ${DIM}(SBTM · HICCUPPS)${RESET}"
pause 0.4
echo -e "  ${GREEN}✓${RESET} Session charter: auth flow under concurrent load"
pause 0.3
echo -e "  ${GREEN}✓${RESET} 3 anomalies logged → 1 defect raised (P2)"
pause 0.3
echo -e "  ${YELLOW}⚠${RESET} Edge case: password reset with expired token → unclear error message"
pause 0.5; line

# Phase 6 - Defect
echo -e "${CYAN}${BOLD}[6/7] DEFECT REPORT${RESET}"
pause 0.4
echo -e "  ${BOLD}DEF-001${RESET}  P2 · Password reset UX — 5-Whys RCA complete"
pause 0.3
echo -e "  ${DIM}Root cause:${RESET} error handler returns HTTP 200 with error in body"
pause 0.3
echo -e "  ${DIM}Fix:${RESET} return HTTP 400 + user-friendly message"
pause 0.5; line

# Phase 7 - Report
echo -e "${CYAN}${BOLD}[7/7] TEST REPORT + SIGN-OFF${RESET}  ${DIM}(IEEE 829)${RESET}"
pause 0.6
hr
printf "${BOLD}%-22s${RESET}" "  Total tests"
echo -e "${WHITE}221${RESET}"
printf "${BOLD}%-22s${RESET}" "  Passed"
echo -e "${GREEN}219${RESET}"
printf "${BOLD}%-22s${RESET}" "  Warnings"
echo -e "${YELLOW}2${RESET}  ${DIM}(a11y — non-blocking)${RESET}"
printf "${BOLD}%-22s${RESET}" "  Failed"
echo -e "${GREEN}0${RESET}"
printf "${BOLD}%-22s${RESET}" "  Open defects"
echo -e "${YELLOW}1${RESET}  ${DIM}(P2 — DEF-001, fix in progress)${RESET}"
hr
pause 0.8

echo -e "\n  ${BOLD}SIGN-OFF DECISION:${RESET}"
pause 1.0
echo -e "\n  ${YELLOW}${BOLD}  ⚡ CONDITIONAL PASS  ${RESET}"
echo -e "  ${DIM}Release approved pending DEF-001 fix (P2 · no blocking issues)${RESET}"
line
pause 0.5
hr
echo -e "${DIM}  Helix QA Full Pipeline complete · Report saved to qa-report.md${RESET}"
hr
line
