# Plan: remove metadata.proactive_triggers (ols-qa)

## Files

| Rule | Files |
|---|---|
| R1, R2 | `skills/{catch-ai,content-takedown,create-bug,retest-bug,review-result,tc-api-prep,tc-change-format,tc-fe-prep,tc-review,test-data-prep,testing-ticket}-workflow/SKILL.md`, `skills/helix/SKILL.md` |
| R3 | `docs/new-skill-template.md`, `docs/pluton-ship-checklist.md`, `docs/skill-rules-authoring.md` |
| R7 | `tools/skill-structure/check.js`, `tools/skill-structure/check.test.js`, `tools/tc-fe-prep-frontmatter/check.test.js` |

## Method

A one-off script parses each frontmatter, drops the `proactive_triggers` list (and `metadata:` when it becomes empty), and writes the phrases not found in `description` to one `Also triggers on:` line under the H1. The three docs are copied from helix PR #45 (blob-equal today on both mains).

## Moved phrases

| Skill | Phrases kept in body |
|---|---|
| catch-ai | review your work again; find your own mistakes; audit this deliverable |
| content-takedown | remove from the public catalogue |
| create-bug | open bug; log defect |
| helix | (none — all in description) |
| retest-bug | retest task; retest the fix; check if bug is fixed |
| review-result | review results; review evidence videos |
| tc-api-prep | API test cases; Swagger test cases; OpenAPI test cases |
| tc-change-format | move tc to template |
| tc-fe-prep | TC FE prep; manual test cases from story; acceptance criteria test cases |
| tc-review | review test cases; review the test case sheet; review tc; check tc coverage; review testcase |
| test-data-prep | prepare test data; create test data; build training content; make covers; seed media / course / learning path |
| testing-ticket | testing ticket; Playwright ticket; test ticket; run playwright on ticket |

## Alternatives weighed

- Drop the phrases outright: rejected, R2 (a trigger phrase could stop routing).
- Append them to `description`: rejected, always-on bytes would rise (token budget).

## What could break

- Routing for a phrase only in the old list → kept by R2 in the body.
- helix parity (`scripts/helix-parity.sh`) shows drift until the helix sync PR merges → expected; the sync PR follows this one.
- Pre-merge regression: each changed skill passes ols-qa-evidence `evals/helix-round-prep/regress_check.py`.
