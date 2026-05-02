# Exploratory Testing Patterns

## Knowledge Sources
- [James Bach & Michael Bolton — Exploratory Testing](https://www.satisfice.com/exploratory-testing)
- [Elisabeth Hendrickson — Explore It!](https://pragprog.com/titles/ehxta/explore-it/)
- [Session-Based Test Management (SBTM) — Bach](https://www.satisfice.com/sbtm)

## Charter Templates

### Risk-Focused Charter
```
Explore [FEATURE/AREA]
Using [TOOLS/RESOURCES/DATA]
To discover [QUALITY RISK / HYPOTHESIS]
```

### Examples
```
Explore the password reset flow
Using an expired token and multiple browser tabs
To discover session handling and timing vulnerabilities

Explore checkout with international addresses
Using addresses from 10 different countries
To discover validation and formatting edge cases
```

## Session Time Management

| Session Type | Duration | Breakdown |
|-------------|----------|-----------|
| Short recon | 45 min | 35 min test, 10 min notes |
| Standard | 90 min | 60 min test, 30 min debrief |
| Deep dive | 120 min | 90 min test, 30 min debrief |

**Rule:** Never extend beyond planned time — if more needed, create a new charter.

## HICCUPPS Heuristic

Test oracle for deciding if behaviour is correct:
- **H**istory — consistent with past behaviour?
- **I**mage — consistent with brand/product image?
- **C**omparable products — consistent with competitors?
- **C**laims — consistent with documentation/specs?
- **U**ser expectations — what would a reasonable user expect?
- **P**roduct — consistent with rest of product?
- **P**urpose — serves intended purpose?
- **S**tandards — meets technical/regulatory standards?

## FEW HICCUPS (Extended)

Adds: **F**amiliarity, **E**xplainability, **W**orld (external environment)

## Defect Severity in Exploratory Context

| Finding Type | Action |
|-------------|--------|
| Crash / data loss | File P0 immediately, stop session |
| Broken core flow | File P1, continue session |
| Degraded behaviour | File P2, note in session log |
| UX inconsistency | File P3, note in session log |
| Hypothesis for next charter | Add to "next sessions" list |

## Debrief Framework (PROOF)

- **P**ast — what was tested
- **R**esults — what was found
- **O**bstacles — what blocked exploration
- **O**utlook — what should be tested next
- **F**eelings — confidence level in area tested
