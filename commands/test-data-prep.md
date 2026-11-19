---
description: |
  Create, fix, or verify test data for any project — content items, courses, paths, covers, videos, PDFs, accounts — per the project's own data-prep recipe, passing every quality gate before use.
  Do NOT use for running a test (testing-ticket), retesting a bug (retest-bug), or drafting TC tables (tc-fe-prep / tc-api-prep).
---

Read and follow [the test-data-prep-workflow skill](../skills/test-data-prep-workflow/SKILL.md) end-to-end.

Start by finding the project's recipe in the workspace `references/` (`*-data-prep.md`); missing values are asked once and saved there, never guessed. Then **Gate 0 — Intake**: confirm environment + account and wait for the user before any login or creation. Reuse existing content first, create only what is missing per the recipe, apply its naming / cover / video rules, pass every gate, get sample approval before the real lot, report, then clean up.
