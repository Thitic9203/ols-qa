# Spec — Helix skill quality round 1

Owner order (2026-10-24, /goal): evaluate and improve every Helix skill until it scores best and works well for real users.
Baseline evidence: `ols-qa-evidence/evals/helix-skill-eval-2026-10-24/` (private) — findings are cited by id `<skill>#<n>`; P0/P1 were adversarially verified.
Owner decisions D1–D3 (2026-10-24) are recorded in the owner's memory `project_helix-eval-decisions-2026-10-24`.

## Scope
In: the 8 skills shipped in helix (catch-ai, create-bug, helix router, retest-bug, tc-api-prep, tc-fe-prep, tc-review, testing-ticket), their WORKFLOW.md, the shared references/commands they link, helix CI `scripts/ci-check-skill-structure.sh`, and the authoring docs that describe frontmatter.
Out: ols-qa-only skills' behaviour (content-takedown, review-result, test-data-prep, smoke-test) except the frontmatter move in R1, which must stay uniform across all 11 SKILL.md files.
Source of truth: ols-qa `skills/ references/ commands/` → helix via `scripts/sync-skills-to-helix.sh` after merge (CLAUDE.md §5). helix-only files (scripts/, docs/) are edited in helix.

## Rules

**R1 (D1).** Every SKILL.md frontmatter must carry `proactive_triggers` under `metadata:` and no top-level key outside {name, description, license, allowed-tools, metadata, compatibility}. When a SKILL.md is checked with skill-creator `quick_validate.py`, it must pass. Source: quick_validate.py:42; findings catch-ai#0, create-bug#5, helix#4, retest-bug#3, tc-api-prep#10, tc-fe-prep#1, tc-review#2, testing-ticket#3.
**R2 (D1).** helix CI must accept `proactive_triggers` under `metadata:` and must fail when it is missing. It must not fail on the old top-level form during the migration commit window. Source: helix `scripts/ci-check-skill-structure.sh:55`.
**R3 (D1).** The authoring docs (`docs/new-skill-template.md`, `docs/skill-rules-authoring.md`, `docs/pluton-ship-checklist.md`) in both repos must show the metadata form.

**R4 (P0).** No skill, reference or command may ask the user to type or paste a password, bearer token, API key or other credential into chat. When login fails, the skill must mark the affected cases BLOCKED with the reason and re-issue the documented login-by-command steps. Source: retest-bug#0 (`execute-and-evidence.md:75`), testing-ticket#0 (`intake-one-pager.md:26`), SKILL.md shared must-never "Never collect or fill a password".
**R5 (P0 prevention).** A test must fail when any shipped skill/reference/command text asks the user for a password/token/credential. Known-answer: it must catch the two baseline lines and must not flag lines that forbid asking.

**R6 (D2).** testing-ticket must show the intake summary + plan and wait for the user's confirmation before the first Playwright run. Every testing-ticket entry file (command, SKILL, WORKFLOW, session-intake, intake one-pager) must state the same rule. round-time-contract §2 must name testing-ticket Phase C as the exception; retest-bug keeps "show the plan, then run". Source: testing-ticket#1.
**R7 (D3).** tc-review sends the review to the project's channel every run; `references/dependencies.md` must say so for tc-review and keep "only on explicit share request" for other workflows. Source: tc-review#0, memory `tc-review-fixed-notify-channel`.

**R8 (P1, contradictions).** Each of these must end with one rule stated the same way in every file that mentions it:
- helix menu item 8 and the language of the menu (helix#0, helix#1): menu text from `references/menu-text.md`, in the user's language; `commands/helix.md` must not keep its own routing table.
- retest evidence per row (retest-bug#2).
- tc-fe-prep examples and prerequisites vs Step 5/7 (tc-fe-prep#2, tc-fe-prep#3).
- create-bug severity vocabulary = bug-priority-matrix; template has repro-matrix and verbatim expected blocks (create-bug#1, create-bug#2).

**R9 (P1, failure branches).** When a step depends on a tool, subagent, fetch or retry loop, the step must say what happens when it fails: tc-api-prep#0 (browser JS tool unavailable → REST v3), tc-api-prep#2 (delivery-specific checklist items), tc-api-prep#4 (2 failed rounds → report gaps, ask), tc-fe-prep#6 (no subagents → labelled self-review), tc-fe-prep#8 (where BLOCKED + Remark go), testing-ticket#4 (no AC/EC or fetch fails), create-bug#0 (falsification before create, section order = execution order).

**R10 (effectiveness).** The helix router must say which workflow it routes to before acting (effect helix p1). tc-fe-prep's low with-skill pass rate (7/15) must be investigated with systematic-debugging before any change; a change that weakens a gate needs owner approval.
**R11 (public repo).** Real customer ticket keys must not appear in shipped files; use `{ISSUE_KEY}`. A test must fail on `OLS-<digits>` in skills/ references/ commands/ shipped to helix. Source: catch-ai#1, catch-ai#2, create-bug#4, retest-bug#8, testing-ticket#5; CLAUDE.md §5.
**R12 (no regression).** `bash scripts/run-test-suites.sh` (ols-qa) and helix CI must be green before merge. A skill whose re-evaluation scores lower than baseline on the paired comparison is reverted, not merged.
**R13 (exit gate, owner decision 2026-10-28).** The effort ends only when one evaluation round passes all of these for every helix skill at once: (a) P0 = 0 and P1 = 0; (b) the skill's darwin total is at or above its own highest total in every earlier round; (c) the average darwin total across all skills is ≥ 85; (d) every expected item passes with the skill (`exp_with_skill = exp_total`); (e) the with-skill run finishes fast, per R14. A round that fails any item is followed by a round that works only on the skills and items that failed. Source: owner, 2026-10-28 — "every skill scores its best after the fixes, the work ends quickly after the skill is invoked, correct and complete, the user is never let down".
**R14 (speed is measured, not assumed).** Every evaluation run with the skill must record its wall-clock duration and turn count in the round's `summary.json`. The "fast" ceiling for R13(e) is set from the measured baseline values and approved by the owner before it is used to judge a round; until it is approved, R13(e) is reported as "not measured", never as a pass.

## Done when
- quick_validate passes 8/8 helix skills (R1) and helix CI is green (R2).
- No credential-asking text remains; the R5 test exists and passes its known-answer cases.
- R6–R9 contradictions and failure branches are resolved and re-checked by an independent reviewer.
- Re-evaluation round `after-1` is published on the Helix Skill Scorecard with before/after per skill, P0 = 0 and P1 reduced ≥ 80%.
- Changes are merged in ols-qa, synced to helix, and `helix-parity.sh` passes.
- Final: one evaluation round passes every R13 item for every skill, shown on the round board's Exit gate box (computed from `summary.json`, not typed by hand).
