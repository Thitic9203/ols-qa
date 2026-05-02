---
name: qa-explore
description: "[QA Process · Session-Based Test Management — Bach & Hendrickson] Structured exploratory testing session — charter-based, time-boxed, with session notes and debrief. Use to find defects automation misses."
---

# Helix — Exploratory Testing Session

> 📚 **Knowledge References** (loaded automatically):
> `qa-explore-patterns.md` — Session-Based Test Management (SBTM), charter templates, heuristics (HICCUPPS, FEW HICCUPS), session debrief format

Exploratory testing is simultaneous learning, test design, and execution. It finds defects that scripted tests miss — especially edge cases, UX issues, and unexpected state combinations.

## Step 1: Define Charter

A charter answers: **What to explore**, **With what**, **To discover what**.

```
Charter: Explore [AREA] using [RESOURCES/TOOLS]
         to discover [QUALITY RISKS]

Example:
"Explore the checkout flow using a guest account
 to discover data validation and state transition issues"
```

Ask user:
```
1. What area to explore? (feature, workflow, integration)
2. Any specific risk hypothesis? (e.g. "suspect session handling is broken")
3. Time budget? (default: 90-minute session)
4. Target environment? (staging / prod-like)
```

## Step 2: Session Setup

```
Session ID: EXPLORE-YYYY-MM-DD-001
Charter:    [from Step 1]
Tester:     [name]
Start:      [HH:MM]
Duration:   90 min (60 min testing + 30 min debrief)
Build:      [version/commit]
```

## Step 3: Execute with Heuristics

Use **HICCUPPS** to guide exploration:
- **H**istory — what has broken before in this area?
- **I**mage — does it match the brand/product image?
- **C**omparable products — how do competitors handle this?
- **C**laims — does it do what docs/specs say?
- **U**ser expectations — what would a user expect?
- **P**roduct — does it fit the overall product?
- **P**urpose — does it serve its intended purpose?
- **S**tandards — does it meet technical/legal standards?

Document findings in real time.

## Step 4: Session Notes Template

```markdown
## Findings
| # | Area | Finding | Severity | Reproducible? |
|---|------|---------|----------|---------------|

## Issues Filed
| # | ID | Title | Severity |
|---|-----|-------|----------|

## Areas Covered
[List of areas explored]

## Areas NOT Covered (for next session)
[List of areas skipped]

## Tester Notes
[Observations, hypotheses, patterns noticed]
```

## Step 5: Debrief

After session:
- Review findings with team (15 min)
- File defects from findings
- Update risk matrix if new risks discovered
- Decide: follow-up charter needed?

## Step 6: Output

Save to `docs/qa/explore-sessions/YYYY-MM-DD-001.md`
Commit to repo.

## Done

Present session summary: areas covered, defect count by severity, follow-up charters needed.

## Self-Evaluation Loop

```
1. Charter ชัดเจน focus เดียวไหม?
2. Findings มี reproduction steps ไหม?
3. Severity สมเหตุสมผลไหม?
4. มี follow-up charters ที่ควรทำต่อไหม?
```
