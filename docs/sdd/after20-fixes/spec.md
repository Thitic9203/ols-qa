# after-20 fixes — spec

Source: ols-qa-evidence `evals/helix-skill-eval-2026-11-15-after19/GATE.md` § Fix list (P1 raised by one scorer, CONFIRMED by verify), and map `docs/helix-quality/wayfinder-a20-finish/map.md` T4. The list is closed (D8): no rule outside R1–R4 is added.

## Rules

- **R1 retest worked example sub-bullets.** When the retest worked example shows a multi-point header value (Fixture), it must use the label bullet, one `**` sub-bullet per point, then one blank line — the same shape as the template and renderer. Source: GATE.md `retest-bug-workflow#s3-0` (`references/worked-example.md:114`); template `references/comment-template-v2.md:34-35`, `:130-136`; `comment-and-post.md:43-49`; renderer `tools/retest-guard/retest_render.js:99`.
- **R2 tc-fe footer link href.** When the tc-fe ADF example links an uploaded attachment, the href must be the full attachment URL `https://{JIRA_DOMAIN}/secure/attachment/__ATT{n}_ID__/{FILENAME}`, so Pattern B's substring fill of `__ATT{n}_ID__` (`references/jira-fast-publish.md:133`) yields the URL form of `jira-formatting.md:84`. It must not be the bare placeholder. Source: GATE.md `tc-fe-prep-workflow#s3-0` (`references/jira-comment-adf-template.md:68`); line 69 carries the same defect for `__ATT2_ID__` (same-topic sweep, G2).
- **R3 testing-ticket hedged expected.** testing-ticket's allowed BLOCKED causes in the no-wait gate must include an expected that is still hedged or unconfirmed after the E3 challenge gate, as its cause (e). The count stays "seven" (the cause widens (e); it is not an eighth). Source: GATE.md `testing-ticket-workflow#0` (`references/no-wait-decision-gate.md:88`); the four references that already require it: `references/non-pass-challenge-gate.md:80-81`, `:90`; `references/settle-and-strategize.md:23`; `references/result-quality-gate.md:110`; and retest's own cause (e) at `references/no-wait-decision-gate.md:85`.
- **R4 retest evidence binding.** When a retest binds an evidence file to a case row, the file must name that case's id or its content must be stated; a file that does neither must become a question to whoever supplied it, and must never be bound to a case by guess. The rule lives once, at the `evidence-per-row` anchor. It adds no BLOCKED cause. Source: map T4 ("retest never binds an evidence file to a case by guess"); after-19 grade `grade/retest-bug-workflow.json` p1r1 (TC_04 BLOCKED "no evidence" while the mock listed `SHOP-42_TC_03.mp4` with no stated content).

## Constraints

- Any MUST / NEVER / STOP / GATE / 🔴 line changed is listed old → new in the PR body as a reword for the helix rule-line register (task T5); none is dropped.
- helix token budget: measured with helix `scripts/token-measure.py measure` on the ols-qa tree before and after; no skill's `direct` or `routed` number rises.
- Scope (G2): only the cited files plus same-topic lines found by grep, listed in the PR body.

## Done when

- R1–R4 text in the named files.
- `bash scripts/run-test-suites.sh` green; `node tools/sdd-gate/check.js` ok.
- `regress_check.py` (ols-qa-evidence `feat/after20-prep`) PASS for retest-bug-workflow, tc-fe-prep-workflow and testing-ticket-workflow: 3 static scorings each on the fix commit, median not below after-19 − `score_allowance`, no P0/P1 on a changed line.
- PR open to ols-qa main with that evidence; reviewed by a fresh Opus subagent.
