---
name: test-data-prep-workflow
description: |
  Create, fix, or verify OLS test/training data — media, courses, learning paths, covers, videos, PDFs, accounts, logins — driven end-to-end by ols-data-prep.md as the single source of truth, passing every quality gate before the data is used.
  Use when the user says prepare / build / seed / fix test data, make covers, /test-data-prep, or asks to create OLS content for a QA run or training.
  Do NOT use for running a ticket's tests (testing-ticket-workflow), retesting a bug (retest-bug-workflow), or drafting TC tables (tc-fe-prep / tc-api-prep).
---

# Test data prep workflow

End-to-end preparation of OLS test/training data from a request: confirm env + account → reuse existing published content → create only what is missing per the recipe → apply the cover / video / naming rules → pass every gate → get sample approval → report.

**Single source of truth:** every recipe, formula, tool, and gate lives in
**[ols-data-prep.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ols-data-prep.md)** (private) and this repo's `CLAUDE.md`. This workflow orchestrates them — it never re-invents a formula, a tool, or a cover style. Read the source first; follow it exactly.

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Read before creating anything.** Open ols-data-prep.md and this repo's `CLAUDE.md` data-prep section (the 🔴 test-data rules + the **Cover corrections (2026-08-08)** 10-rule block) BEFORE the first login or creation. Both govern this workflow. Inventing a recipe, a cover style, or a tool is the single most common cause of rejected data — do not do it.

**Reuse the real tools.** The working tools are off-repo in `~/ols-qa-testing-bot/` (`dt_client.js`, `thumb_ai.js`, `thumb_final.js`, `thai_wrap.js`, `cover_prompts.json`, `cover_photo_guard.js`, capture harness, upload). Reuse them as-is — never rewrite a divergent copy that drifts from the client-approved output.

**Not-all-green = not usable.** Data that fails any gate layer is "ยังไม่เรียบร้อย": never upload it to Drive, never test with it, never call the job done, never report it silently. Fail a layer → root-cause → fix at source → restart from layer 1 (no partial pass, no workaround).

**Report as you go.** Announce the plan, report each stage, and record every user correction back into `CLAUDE.md` / ols-data-prep.md immediately (do not make the user repeat a correction).

## Refusal-first (precondition gate)

MUST NOT create, upload, or "seed" anything until:

1. **Environment is confirmed by the user** (dev / pre-prod / staging / prod / training-*). Never pick an env yourself, even a more convenient one.
2. **Account + role is confirmed** for the create/verify surface.
3. **ols-data-prep.md has been read** for the exact type + target status being produced.

If any is missing → stop and ask (Gate 0). Covers additionally require Draft Things API `:7860` ON — if the app is not installed, the cover work is **BLOCKED**; say so in chat, do not fall back to a solid/gradient/PIL cover.

## Gate 0 — Intake (mandatory, wait for the user)

Per ols-data-prep.md §0.0 and CLAUDE.md's env-intake rule. **Gather EVERY requirement below and get the user's confirmation BEFORE any login, reuse check, or creation.** Ask in the three ordered steps below — do not skip ahead, do not start on a partial answer. Skip a question only if the user already answered it explicitly this session (then state the value back and let them confirm with a short "ok", never re-ask).

Use the **AskUserQuestion** tool so each step is a real prompt the user answers (the type step is a checkbox / multi-select). Wait for each answer before the next step.

### Intake 0.1 — Environment + spec source (ask first, wait)

- **Environment** — dev / pre-prod / staging / prod / training-* . Never pick one yourself, even a more convenient one (per CLAUDE.md env-intake rule). Also capture the **account / role** to create with.
- **Confluence (CF) URL** — the spec / reference page for the content to build. If the user has none, say so explicitly and note there is no CF spec (do not invent requirements).

### Intake 0.2 — Data type(s) to create (checkbox / multi-select, wait)

Ask which types to build, as a **multi-select checkbox** (`AskUserQuestion` with `multiSelect: true`). Options:

- **Media** (สื่อ — video / PDF / ePub content item)
- **Course** (คอร์ส)
- **Learning Path** (เส้นทางการเรียนรู้ / LP)
- **Cover only** (regenerate cover art for existing content)
- **Video (motion-graphics)**
- **PDF**
- **Account / Login** (test accounts, roles)

For each selected type, also capture the **exact target status** it must end in (`PUBLISHED · UNPUBLISHED · DRAFT · REJECTED · FLAGGED · PENDING_EDIT`) — not "all published".

### Intake 0.3 — Style / content shape + quantity (ask last, wait)

- **Style / content format** — topic / theme / subject area, tone, language, and the cover style bucket (careers / exams / subjects / digital / scholarships / languages / …) so the per-theme colour grade applies.
- **Quantity** — how many of each selected type.
- **Purpose** — QA-run data or customer/training content (training content = stricter naming, real-user quality).

### Intake 0.4 — Detail questions (ask only the ones relevant to the selected types)

Ask these before the confirmation gate whenever they apply — each has a stated default, so a "use the defaults" answer is enough:

- **Reuse policy** — reuse existing published items that already fit, or build all-new? (default: **reuse-first**, per Step 1.)
- **Owner / creator account per item** — who owns each content item. (default: the intake account.) For creator-isolation / permission cases, name each distinct owner.
- **Which items need a cover / video** vs text-only — so covers/videos are generated only where wanted.
- **Delivery destination** — create-on-env only, or also upload evidence / deliverable to a Drive folder or sheet? If yes, which. (default: create-on-env only.)
- **Lot / grouping label** — e.g. `Regression Lot1` / `Lot2`, if this feeds a regression suite. (default: none.)
- **Duplicate-name clash handling** — default: **stop and ask** (offer skip / rename / proceed). Confirm if the user wants a different default.
- **Sample-cover approval** — required before the real lot for any cover/video work. (default: **yes**; confirm.)

Keep it lean: skip a detail question if the selected types make it irrelevant, or if the user already answered it.

**Confirmation gate:** restate the full captured spec (env · account · CF URL · types+status · style · quantity · purpose · any 0.4 details) back to the user in one block and wait for a clear "go" before Step 1. Nothing is created until this is confirmed.

## Step 1 — Reuse first

Before creating, list what already exists on the target env — `GET /api/media|courses|learning-paths`. If a published item already covers the need, use it. Do not create a duplicate.

## Step 2 — Create only what is missing, at the exact target status

Follow the ols-data-prep.md §5–6 recipe for the type. Produce the **exact** status requested — `PUBLISHED · UNPUBLISHED · DRAFT · REJECTED · FLAGGED · PENDING_EDIT` — not "all published". For each status, follow the recipe's create → transition chain (see the LP state model + test-data recipes in `references/ols-project-guide.md` for which ticket/role produces which state).

## Step 3 — Names + descriptions = real content for real users

Per CLAUDE.md §5.1 and the 2026-08-08 naming feedback. Every name and description is what a real user sees — it must read as genuine content.

| Rule | Forbidden examples |
|------|--------------------|
| No QA/test markers in name or description | `QA Test`, `QA_OLS…`, `[QA TEST]`, `ทดสอบระบบ`, `สำหรับการตรวจรับ`, `test`, `placeholder`, `TBC`, `dummy`, `sample` |
| No status parentheses in the name | `…(เผยแพร่)`, `(ร่าง)`, `(ยกเลิกเผยแพร่)`, `(รอแก้ไข)`, `(ถูกรายงาน)` — status lives in the system field, not the visible name |
| Natural, polite Thai only | no gibberish, no odd/rude words; description describes real content, never "created for testing/acceptance" |
| **No duplicate names** | check the new name against existing content (`GET /api/media\|courses\|learning-paths`) **and** within the lot itself |

**Duplicate-name clash → stop and ask the user.** Never silently create a second item with a colliding name. Report which item it clashes with (name / id / status) and let the user decide skip / rename / proceed.

## Step 4 — Covers (the 10 Cover-correction rules + 5-level gate)

Cover source = ols-data-prep.md §5.7.2 (client-approved FINAL). **Prereq:** Draw Things API `HTTP:7860` ON — open it yourself first (check `curl :7860/sdapi/v1/options`; if not installed, BLOCK and tell the user, never fall back to a plain cover).

Every cover = **a photograph** from Draw Things (SDXL, warm editorial, `seed=hash(id)`) + **Thai text overlaid by the program layer** (the model renders no text — negative prompt strips letters/logo/watermark/gibberish). Apply all 10 corrections (CLAUDE.md, 2026-08-08):

1. **Photo only** — hard guard `cover_photo_guard.js` (fail-closed): no doodle / line-art / collage / pattern / solid / gradient / PIL.
2. **Title shrink-to-fit** — never overflow the card; font shrinks to fit however long the name.
3. **Colour varied per theme** — not all brown; palette color-grade per theme (careers=blue, exams=pink, subjects=green, digital=purple, scholarships=amber, languages=coral, default=mixed).
4. **One non-tiling hero subject** — bg `1536×896` (not 1792 = SDXL duplicates the subject); anti-duplicate negative; pick a subject that does not tile.
5. **Realistic, not deformed** — avoid subjects AI renders broken (tripods, complex mechanisms); use simple solid objects.
6. **No in-photo gibberish** — avoid text-bearing subjects (paper, passport, documents, map, labelled globe, open book); control via subject choice + visual gate.
7. **Max sharp** — render at dsf3 (3840×2160) + unsharp; sharpness comes from composite+unsharp, not bg res.
8. **Thai wrap keeps compounds whole** — glue prefixes `ความ/การ/ผู้/นัก/เพื่อ` to the next word (ความพร้อม never splits).
9. **Sample-approve before the real lot** — render varied sample covers (subject / colour / topic) and get the user's approval first.
10. **Report every round + log every user correction here** immediately.

Tone (STYLE_TAIL) and sharpness are **separate levers** — "make it sharper" means push res/unsharp only, never change mood.

**Cover 5-level gate — pass all, or regenerate:**

| Level | Check | Pass = |
|:--:|:--|:--|
| 1 | bg from Draw Things | photo, high variance — not solid/gradient/PIL |
| 2 | scene matches content | opening it, the image is about that topic |
| 3 | no model-rendered text | no letters/logo/watermark in bg |
| 4 | Thai overlay | title/badge/kicker char-exact, tone marks intact, contrast passes, no fake "OLS"/metrics |
| 5 | visual vs approved lot | same style as the client-approved lot (sharp photo + frosted card) — QA looks, does not guess |

## Step 5 — Videos (motion-graphics)

VIDEO type = motion-graphics (ols-data-prep.md §5.7.2F, client-approved FINAL): Ken Burns + kinetic text, warm editorial, Thai male voice `th-TH-NiwatNeural` +4%, ≤25MB. **Never** a static slideshow / PowerPoint / plain-colour background.

## Step 6 — Gates (pass every layer before use)

- **§7 — 3-layer** (correct / complete / thorough): readback field-by-field after create.
- **§8 — 5-layer media** (publish chain + guest verify): confirm each field survives the publish chain and a guest session sees it.
- **Cover 5-level** (Step 4 table).

Fail any layer → root-cause → fix at source → **restart from layer 1**. No partial pass, no silence.

## Step 7 — Report

Report to the user: what was **reused**, what was **created** (type · id · final status · name), every **gate result**, and any **clash / block** encountered. Record any new user correction into `CLAUDE.md` + ols-data-prep.md.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST read ols-data-prep.md + CLAUDE.md cover/naming rules before creating | Single source of truth; inventing formulas is how covers/data get rejected |
| MUST confirm env + account and wait | Choosing env yourself is not QA's call (prod-DB risk) |
| MUST reuse existing published content before creating | Avoids duplicates and wasted work |
| MUST make covers pass the hard guard + all 10 cover rules + the 5-level visual gate | Doodle / brown-only / duplicated / blurry / overflowing / gibberish covers were all client-rejected |
| MUST get sample-cover approval before the real lot | The client approves the look; QA does not decide it |
| MUST produce the exact target status, and real-user names/descriptions | Wrong status = useless fixture; QA/test markers + status parens are seen by real users |
| NEVER ship data that fails any gate, or call unfinished data "done" | Incomplete data silently corrupts a test run |
| NEVER create a duplicate name silently | Clash → stop and ask the user first |
| NEVER fall back to a solid/gradient/PIL/doodle cover when Draw Things is unavailable | The cover work is BLOCKED until the API is up — report it |
