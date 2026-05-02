---
name: qa-full
description: "[QA Pipeline Orchestrator] Runs the complete QA workflow: strategy → plan → risk → test tiers → exploratory → report → defect → metrics. For QA Engineers running a full release cycle."
---

# Helix — QA Full Pipeline

> Full QA lifecycle for a release. Run individual skills directly or use this orchestrator for the complete workflow.

## Pipeline

```
Step 1: qa-strategy   — define test strategy
Step 2: qa-plan       — create test plan + schedule
Step 3: qa-risk       — risk matrix + prioritization
Step 4: test tiers    — execute Tier 1 → Tier 2
Step 5: qa-explore    — exploratory testing session
Step 6: qa-data       — verify test data coverage
Step 7: qa-report     — generate test report + sign-off
Step 8: qa-defect     — document open defects
Step 9: qa-metrics    — generate HTML + MD dashboard
Step 10: Tier 3 perf  — if qa-risk flagged critical paths
```

## Step 0: Intake

```
1. Project / repo location?
2. Release name or sprint number?
3. Run full pipeline or start from a specific step?
   → full / from step N
4. Enable parallel execution for test tiers? (faster, more tokens)
```

## Step 1–3: QA Foundation

Invoke in sequence:
```
/helix qa-strategy  → outputs: docs/qa/qa-strategy.md
/helix qa-plan      → outputs: docs/qa/qa-plan-[date].md
/helix qa-risk      → outputs: docs/qa/qa-risk-[date].md
```

Wait for user confirmation after each doc before proceeding.

## Step 4: Test Tier Execution

Run in tier order (never skip Tier 1 to run Tier 2):

**Tier 1 — Functional:**
```
/helix test-unit → /helix test-integration → /helix test-contract → /helix test-e2e
```

**Tier 2 — Non-Functional Quality** (only after Tier 1 green):
```
/helix test-security → /helix test-a11y → /helix test-visual
```

Report progress every 10 minutes as a table.

## Step 5–6: Exploratory + Data

```
/helix qa-explore   — structured session based on qa-risk findings
/helix qa-data      — verify test data health, fill gaps
```

## Step 7–9: Reporting

```
/helix qa-report    → sign-off decision
/helix qa-defect    → document all open defects
/helix qa-metrics   → HTML dashboard + MD summary
```

## Step 10: Tier 3 Performance (conditional)

If `qa-risk` flagged any area as critical AND Tier 1+2 pass:
```
/helix test-perf-load → /helix test-perf-stress
→ /helix test-perf-db → /helix test-perf-frontend
```

Requires running environment. Ask for confirmation before starting.

## Done

Present final summary:
```
📊 QA Pipeline Complete — [Release] — [Date]

| Phase          | Status | Output |
|----------------|--------|--------|
| qa-strategy    | ✅     | docs/qa/qa-strategy.md |
| qa-plan        | ✅     | docs/qa/qa-plan-[date].md |
| qa-risk        | ✅     | docs/qa/qa-risk-[date].md |
| Tier 1 Tests   | ✅/❌  | [pass/fail count] |
| Tier 2 Tests   | ✅/❌  | [pass/fail count] |
| qa-explore     | ✅     | [session count] defects found |
| qa-report      | ✅/❌  | Sign-off: PASS/FAIL |
| qa-metrics     | ✅     | qa-reports/metrics-[date].html |
```

If sign-off = ✅ PASS → suggest `/helix deploy`
If sign-off = ❌ FAIL → list blockers clearly

## Self-Evaluation Loop

```
1. ทุก step execute จริงไหม (ไม่ skip)?
2. Tier 2 รอ Tier 1 pass ก่อนไหม?
3. Sign-off decision มีเหตุผลชัดเจนไหม?
4. Outputs ทุกอย่าง commit เข้า repo แล้วไหม?
```
