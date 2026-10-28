# Plan — Helix skill quality round 1

## Order (why)
1. **helix CI first (R2).** If SKILL.md moves `proactive_triggers` under `metadata:` before helix CI accepts it, the sync commit turns helix CI red. So: helix PR that accepts both forms → merge → then content.
2. **ols-qa content PRs**, split so no two touch the same file:
   - PR-A frontmatter + docs (R1, R3) — 11 SKILL.md + 3 docs.
   - PR-B safety (R4, R5, R11) — `skills/procedures/retest-bug-workflow/execute-and-evidence.md`, `references/intake-one-pager.md`, new test under `tools/skill-text-guard/`, key placeholders in the files the findings name.
   - PR-C contradictions + failure branches (R6–R10) — WORKFLOW.md and references named in the findings. Not SKILL.md frontmatter (owned by PR-A); PR-C rebases after PR-A.
3. **Sync** each merged PR to helix with `scripts/sync-skills-to-helix.sh <files>` from ols-qa main, then `scripts/helix-parity.sh`.
4. **helix CI tighten (R2 final)**: after content lands, require the metadata form only.
5. **Re-evaluate** with the frozen briefs in the evidence folder → round `after-1` → paired comparison → republish the scorecard.

## Files
- helix: `scripts/ci-check-skill-structure.sh`, `docs/new-skill-template.md`, `docs/skill-rules-authoring.md`, `docs/pluton-ship-checklist.md`.
- ols-qa: the 11 `skills/*/SKILL.md`, same 3 docs, files named in findings (see tasks.md), `tools/skill-text-guard/` (new: check.js + check.test.js), wired into `scripts/run-test-suites.sh`.

## Libraries / cost
Node ≥18 built-ins only, no new dependency. No paid service. No change to any other repo. New cost: NO. Touches other repos: helix only (owned, in scope).

## Options weighed
- Frontmatter: metadata form (chosen, D1) vs keep top-level (rejected by owner).
- Credential test: regex over shipped text with an allowlist for lines that forbid asking (chosen; deterministic) vs model grader (rejected: not repeatable in CI).
- tc-fe-prep effectiveness: investigate first (R10) instead of loosening the glossary gate.

## Rounds 5+ (R13, R14 — added 2026-10-28)
- Exit gate is judged on one evaluation round, item by item, by the round board generator reading every round's `summary.json`; nobody types a pass by hand.
- Timing (R14) goes into the evaluation tooling in the evidence repo, not into the skills. No new dependency, no paid service.
- Each round's lanes are scoped to the R13 items their skill failed in the previous round, so a skill that already passes is not touched again.
- The helix lane also owns SKILL.md frontmatter and the shared `references/` files that skill lanes could not edit in round 4.

## What could break
- helix CI red if order is wrong → mitigated by step 1.
- Tools that parse frontmatter top-level `proactive_triggers`: grep found none in either repo (only CI + docs).
- Sync guard blocks a file that carries a secret → the placeholder work in PR-B lowers this risk.
- Re-evaluation noise ±8 → decisions use paired judging, not absolute totals.
