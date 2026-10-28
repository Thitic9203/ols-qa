# Spec — tc-fe-prep-workflow: Thai trigger phrases

**Source:** Helix skill eval after-3 (25/Oct/2026), finding `tc-fe-prep-workflow#7` (P2, dimension "Description triggers"), file `ols-qa-evidence/evals/helix-skill-eval-2026-10-25-after3/data/after-3/findings.json`:

- where: `skills/tc-fe-prep-workflow/SKILL.md:5`
- problem: "Trigger phrases are English only; Thai requests (e.g. 'เขียนเทสเคส FE') are not named although TC content and users are Thai."
- fix: "Add 1–2 Thai trigger phrases to the WHEN line and metadata.proactive_triggers."

Re-verified on origin/main 85e3a91 (main thread, 28/Oct/2026): the description and `metadata.proactive_triggers` contain no Thai phrase.

## Rules

- **R1** — When a user asks in Thai for FE test cases (e.g. "เขียนเทสเคส FE", "เตรียม TC FE"), the skill description must name those phrases so the request routes to tc-fe-prep-workflow. Source: finding fix, "WHEN line".
- **R2** — `metadata.proactive_triggers` must list the same Thai phrases as R1 (1–2 items). Source: finding fix, "metadata.proactive_triggers".
- **R3** — The Thai phrases must follow the repo's existing style: quoted in parentheses at the end of the "Use when" sentence (as `tc-review-workflow` "รีวิวเทสเคส", `testing-ticket-workflow` "เทส ticket นี้ให้หน่อย"), and listed verbatim in `proactive_triggers` (as `tc-review-workflow`, `content-takedown-workflow`). Source: those SKILL.md files on origin/main.
- **R4** — The "Do NOT use" line must stay unchanged, so API-only test cases still route to tc-api-prep-workflow. Each Thai phrase must say FE, never a bare "เขียนเทสเคส" that would also match API test cases. Source: `tools/skill-structure/check.js:24` (Do NOT use in first 20 lines) and the existing description.
- **R5** — No other skill and no other line of this SKILL.md changes. Source: lane scope.

## Edge cases

- "เขียนเทสเคส API" — must not match: R1 phrases carry "FE", and the Do NOT line names tc-api-prep-workflow.
- Description grows ~40 characters: must stay valid for `node tools/skill-lint/lint.js` and `tools/skill-structure/check.js`.

## Done when

- `skills/tc-fe-prep-workflow/SKILL.md` description "Use when" line ends with the two Thai phrases in parentheses.
- `metadata.proactive_triggers` lists both Thai phrases.
- `node tools/skill-lint/lint.js` and `bash scripts/run-test-suites.sh` pass.
- PR open on `fix/tc-fe-prep-thai-triggers`, commit cites `Spec: docs/sdd/tc-fe-prep-thai-triggers R1–R5`.
