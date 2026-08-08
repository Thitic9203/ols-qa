---
name: test-data-prep
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

# Test data prep (OLS)

Prepare OLS test/training data **only** by the single-source workflow — never invent formulas, tools, or cover styles.

**Announce once:** `Using **test-data-prep** to build OLS test data per ols-data-prep.md.`

## Single source of truth (read BEFORE creating anything)

- **[ols-data-prep.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ols-data-prep.md)** (private) — every recipe, formula, gate, and the real off-repo tools in `~/ols-qa-testing-bot/`. Read §0.0 Intake → §5–6 (reuse first · cover formula §5.7.2 · video §5.7.2F) → gates §7 (3-layer) + §8 (5-layer) → §11 report.
- **This repo's `CLAUDE.md`** — the data-prep hard rules + the 🔴 **Cover corrections (2026-08-08)** block (10 rules). Both govern this skill.
- Reuse the real tools in `~/ols-qa-testing-bot/` — never rewrite them into a divergent copy.

## Gate 0 — Intake (mandatory, wait for the user)

Confirm **environment** (dev / pre-prod / staging / prod / training-*) **and account/role** before any login or creation. If not already stated this session, ask once and **wait** — never pick an environment yourself. State it back (`env=<X> · account=<role>`) and let the user confirm.

## Flow

1. **Reuse first.** Check what is already published on the target env (`GET /api/media|courses|learning-paths`). If it covers the need, use it — do not create duplicates.
2. **Create only what's missing**, per the ols-data-prep.md recipe for that type/status (PUBLISHED · UNPUBLISHED · DRAFT · REJECTED · FLAGGED · PENDING_EDIT — make the exact target status, not all PUBLISHED).
3. **Names + descriptions = real content for real users.** No QA/test markers (`QA Test`, `[QA TEST]`, `ทดสอบระบบ`, `dummy`, `placeholder`), no status parentheses in the name (`(เผยแพร่)`), natural Thai. **No duplicate names** — check against existing + within the lot; on a clash **stop and ask the user** before creating.
4. **Covers = the 10 Cover-correction rules** (CLAUDE.md) — photograph only (hard guard `cover_photo_guard.js`, fail-closed), **colour varied per theme** (not all brown), **one non-tiling hero subject** (bg 1536, no duplicates), realistic (no deformed objects), no in-photo gibberish (avoid paper/passport/globe-with-labels), title **shrink-to-fit** (never overflow the card), Thai wrap keeps compounds whole (ความพร้อม), **max sharp** (dsf3 + unsharp). Draw Things API `:7860` must be ON (open it yourself first).
5. **Videos** = motion-graphics (§5.7.2F) — Ken Burns + kinetic text, Thai male voice, ≤25MB. Never a static slideshow.
6. **Pass every gate before use** — §7 (3-layer: correct/complete/thorough), §8 (5-layer media), cover 5-level. Fail any layer → root-cause → fix → restart from layer 1. Not all-green = **not usable**; never upload, never test, never call it done.
7. **Approval gate.** Before building the real lot, render **sample covers (varied subject/colour/topic)** and get the user's approval. Never build the full lot before approval.
8. **Report** what was created, reused, and every gate result.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST read ols-data-prep.md + CLAUDE.md cover rules before creating | Single source of truth; inventing formulas is how covers get rejected |
| MUST confirm env + account and wait | Choosing env yourself is not QA's call (prod-DB risk) |
| MUST reuse existing published content before creating | Avoids duplicates + wasted work |
| MUST make covers pass the hard guard + the 10 cover rules + 5-level visual gate | Doodle / brown-only / duplicated / blurry / overflowing / gibberish covers were all rejected by the client |
| MUST get sample-cover approval before the real lot | The client approves the look; QA does not decide it |
| NEVER ship data that fails any gate, or call unfinished data "done" | Incomplete data silently corrupts a test run |
| NEVER put QA/test markers, status parentheses, or duplicate names in user-facing names | Real users see these |
