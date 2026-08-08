---
name: test-data-prep-workflow
description: |
  Create, fix, or verify OLS test data — media, courses, learning paths, covers, videos, PDFs, accounts, logins — for QA runs or training content. Follows ols-data-prep.md as the single source of truth and passes every quality gate before the data is used.
  Use for /test-data-prep, or when the user asks to prepare / build / seed / fix OLS content or covers.
  Do NOT use for running tests on a ticket (testing-ticket-workflow), retesting a bug (retest-bug-workflow), or drafting test-case tables (tc-fe-prep / tc-api-prep).
proactive_triggers:
  - /test-data-prep
  - prepare test data
  - create test data
  - build training content
  - make covers
  - seed media / course / learning path
---

# Test data prep (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/test-data-prep-workflow/WORKFLOW.md).

> **Maintainer note (user directive 2026-08-08):** when editing THIS skill, invoke **superpowers:writing-skills** first — match the guidance form to the failure and craft precise, well-fitted wording. Sharpness and completeness checks stay strict per [ols-data-prep.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ols-data-prep.md); cover titles must never overflow the frame, break lines badly, or split a compound word (พรากคำ).

When invoked:

1. Announce once: `Using **test-data-prep-workflow** to build OLS test data per ols-data-prep.md.`
2. **Read the source first** — [ols-data-prep.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ols-data-prep.md) (private) + this repo's `CLAUDE.md` data-prep rules (the 🔴 test-data rules + the **Cover corrections 2026-08-08** 10-rule block). Never invent a recipe, tool, or cover style.
3. Read and follow [WORKFLOW.md](../deprecated/test-data-prep-workflow/WORKFLOW.md) **end-to-end** — every step and gate.

Claude Code shortcut: `/test-data-prep` → [commands/test-data-prep.md](../../commands/test-data-prep.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT create / upload / seed until the **full Gate 0 intake is confirmed** — asked in order via `AskUserQuestion` and all cleared before anything is built: **0.1** env + account + Confluence (CF) URL (never pick an env yourself), **0.2** data type(s) as a checkbox / multi-select + exact target status, **0.3** style / content shape + quantity + purpose, **0.4** the relevant detail questions (reuse policy, owner, cover/video needed, delivery, lot, clash handling, sample approval). Restate the whole spec and wait for "go". Covers require Draw Things API `:7860` ON — otherwise the cover work is BLOCKED (never fall back to a plain cover).

## QA closing (mandatory before "done")

All gates are in WORKFLOW.md: §7 (3-layer), §8 (5-layer media), and the cover 5-level. Not-all-green = **not usable** — never upload, never test with it, never call it done. Get **sample-cover approval before the real lot**, and use **real-user names/descriptions with no duplicates** (clash → stop and ask).
