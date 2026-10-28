# Plan — tc-fe-prep-workflow: Thai trigger phrases

## Files touched

- `skills/tc-fe-prep-workflow/SKILL.md` — frontmatter only (R1, R2, R5).

## Change

1. Description "Use when …" line: append ` (e.g. "เขียนเทสเคส FE", "เตรียม TC FE")` before the closing period — same shape as `tc-review-workflow` (R3).
2. `metadata.proactive_triggers`: add two items `เขียนเทสเคส FE` and `เตรียม TC FE` after the existing English items (R2).
3. The "Do NOT use" line is left as is (R4).

## Libraries

None (text change only; free).

## Options weighed

- Bare "เขียนเทสเคส" (no FE) — rejected: it also describes API test cases, so it would pull tc-api-prep requests here (R4).
- Thai only in `proactive_triggers`, not the description — rejected: the finding asks for both, and routing reads the description.

## What could break

- `tools/skill-structure/check.js` needs `proactive_triggers` with items and "Do NOT use" in the first 20 lines — frontmatter grows by 2 lines (14 → 16), Do NOT stays at line 6.
- `tools/skill-lint/lint.js` description rules (third person, "Use when") — unchanged wording outside the added phrases.
- helix copy of the skill is not synced in this change (sync runs from main after merge, by the main thread).
