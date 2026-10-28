# Tasks — tc-fe-prep-workflow: Thai trigger phrases

## T1 — Thai phrases in the description (R1, R3, R4)

- Failing first: `grep -c "เขียนเทสเคส FE" skills/tc-fe-prep-workflow/SKILL.md` → 0 on origin/main.
- Do: append `(e.g. "เขียนเทสเคส FE", "เตรียม TC FE")` to the "Use when" line.
- Done when: the "Use when" line contains both phrases; the "Do NOT use" line is byte-identical to before.

## T2 — Thai phrases in proactive_triggers (R2)

- Failing first: no Thai item under `metadata.proactive_triggers`.
- Do: add `- เขียนเทสเคส FE` and `- เตรียม TC FE`.
- Done when: both items are listed; `node tools/skill-structure/check.js` passes.

## T3 — Checks and PR (R5)

- Do: `node tools/skill-lint/lint.js`; `bash scripts/run-test-suites.sh`; `git diff origin/main --stat` shows only the SKILL.md.
- Done when: both green; PR open on `fix/tc-fe-prep-thai-triggers` citing `Spec: docs/sdd/tc-fe-prep-thai-triggers R1–R5`.
