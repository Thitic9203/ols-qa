# Tasks — TC review fixed notify channel

1. **T1 (R5)** — Add failing tests to `tools/ask-guard/ask_rules.test.js` for the four "Done when" guard cases. Done: they fail on current code.
2. **T2 (R5)** — Implement `fixed-destination` in `ask_rules.js` + deny message; README row. Done: `node tools/ask-guard/ask_rules.test.js` green.
3. **T3 (R1–R4, R6, R7)** — Rewrite Step 5, checklist, description, MUST/NEVER in `SKILL.md`; update `commands/tc-review.md`. Done: no "Optional"/"explicit request" left in Step 5; portable check passes.
4. **T4 (R2)** — Placeholder section in `references/ols-project-guide.md`; real values in local secrets. Done: `scripts/check-no-secrets.sh` passes.
5. **T5** — `bash scripts/run-test-suites.sh` green → PR → merge → confirm auto-version bump on origin → helix sync + parity.
