# Plan: remove the qa-evidence-gates old-anchor table

## Files

| Rule | File | Change |
|---|---|---|
| R1a | `references/result-quality-gate.md` (MP4 gate link) | `qa-evidence-gates.md#mp4-evidence…` → `qa-evidence-gates.md#related-gates-split-into-their-own-files` |
| R1a | `skills/procedures/review-result-workflow/WORKFLOW.md` (row **G**) | same redirect anchor → same core section |
| R1b | `references/qa-evidence-gates.md` ("Related gates" capture bullet) | names the story-testing 5-step gate |
| R2 | `references/qa-evidence-gates.md` | delete § "Related: moved sections (old anchors)" + its Contents line |

A grep on main 52a6871b finds only two inbound links (the two rows above) to redirect anchors; the other links into the core file use anchors that stay (`gate-function`, `claim--evidence-map`, …).

## Method

One-off script: read the 14 `id → home` pairs from the table, rewrite matching links, then drop the section. Link check: for every `](…qa-evidence-*.md#id)` in the tree, the target file has a heading slug or `<a id>` equal to `id`.

## Alternatives weighed

- Keep the table: rejected, ≈3.5 KB read by every skill that opens the core gates file, no rule in it.
- Keep only the `<a id>` tags without the table text: rejected, still a stub with no reader left after R1.

## What could break

- Links from outside this repo (eval notes in ols-qa-evidence) to a removed anchor land on the top of the core file instead of the section. They are historical records, not skill reads.
- helix parity drifts until the helix sync PR merges.
