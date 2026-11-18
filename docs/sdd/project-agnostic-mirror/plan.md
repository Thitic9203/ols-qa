# project-agnostic-mirror — plan

## Files touched

- The 11 shared files in spec M1 — copied from Helix 60a426a:
  `references/workspace-guide-discovery.md`, `references/skill-routing.md`, `references/menu-text.md`,
  `references/intent-shortcuts.md`, `references/result-quality-gate.md`, `references/skill-reference-index.md`,
  `skills/procedures/retest-bug-workflow/comment-and-post.md`,
  `skills/procedures/retest-bug-workflow/execute-and-evidence.md`,
  `skills/procedures/retest-bug-workflow/references/comment-template-v2.md`,
  `skills/procedures/retest-bug-workflow/references/worked-example.md`,
  `skills/procedures/testing-ticket-workflow/results-update.md`.
- `references/ols-project-guide.md` — one line: workspace name `ols-qa` (M2). OLS-only, never synced.
- `tools/skill-structure/check.js`, `tools/skill-routing/routing.test.js` — label `(workspace only)` (M3).
- `tools/a17-create-bug/check.test.js`, `tools/retest-guard/workflow_template.test.js` — new pinned text (M4).

## Options weighed

- Keep `(ols-qa workspace only)` in ols-qa only → rejected: the next sync copies it back to Helix (Helix R8).
- Accept both labels in the parsers → rejected: no file uses the old label after M1; one label is stricter.

## What could break

- Usage dashboards that read `src=` from OLS comments: kept by M2.
- Sync to Helix: these files are not in `helix-owned-files.txt`, so they sync as identical text (no-op).

No new cost; no other repo touched from here.
