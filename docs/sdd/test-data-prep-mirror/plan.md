# test-data-prep-mirror — plan

## Files touched

- Copied from Helix origin/main (D1): `skills/test-data-prep-workflow/SKILL.md`,
  `skills/procedures/test-data-prep-workflow/WORKFLOW.md`, `commands/test-data-prep.md`,
  `references/data-prep-recipe-template.md` (new in ols-qa).
- Tests only if one pinned the old OLS text (D3), found by running `npm test` after the copy.

## Options weighed

- Push the OLS text to Helix again → rejected: Helix's portable-skills gate refuses it, and these files are Helix-owned.
- Exempt test-data-prep from the pluton-ai-agent S9 check → rejected: the OLS worker would run a skill text that differs
  from Helix, which S9 exists to stop.
- Copy every file that differs (content-takedown, smoke-test too) → rejected (D4).

## What could break

- An OLS agent that reads only the skill must find the recipe: the glob `references/*-data-prep.md` matches
  `references/ols-data-prep.md` (#295 pointer), which points to Appendix H.
- Sync back to Helix: the four files are identical after the copy, so the sync proposes nothing for them.

No new cost; touches another repo: NO (Helix is read only).
