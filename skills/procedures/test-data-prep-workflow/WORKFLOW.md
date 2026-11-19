---
name: test-data-prep-workflow
description: |
  Create, fix, or verify test/training data for any project — content items, courses, paths, covers, videos, PDFs, accounts — driven by the project's own data-prep recipe, passing every quality gate before the data is used.
  Use when the user says prepare / build / seed / fix test data, make covers, /test-data-prep, or asks to create content for a QA run or training.
  Do NOT use for running a ticket's tests (testing-ticket-workflow), retesting a bug (retest-bug-workflow), or drafting TC tables (tc-fe-prep / tc-api-prep).
---

# Test data prep workflow

End-to-end preparation of a project's test/training data from a request: find the project's recipe → confirm env + account → reuse existing content → create only what is missing per the recipe → apply the recipe's naming / cover / video rules → pass every gate → get sample approval → report → clean up.

**Single source of truth = the project's data-prep recipe.** Helix carries no project's values. Every environment, role, data type, status, endpoint, tool, naming rule, cover style and gate threshold comes from the recipe (and the documents it names). This workflow orchestrates them — it never invents a formula, a tool, a value or a cover style.

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [Find the recipe](#find-the-recipe)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Gate 0 — Intake (mandatory, wait for the user) \[medium freedom\]](#gate-0--intake-mandatory-wait-for-the-user-medium-freedom)
- [Step 1 — Reuse first \[high freedom\]](#step-1--reuse-first-high-freedom)
- [Step 2 — Create only what is missing, at the exact target status \[low freedom\]](#step-2--create-only-what-is-missing-at-the-exact-target-status-low-freedom)
- [Step 3 — Names + descriptions = real content for real users \[medium freedom\]](#step-3--names--descriptions--real-content-for-real-users-medium-freedom)
- [Step 4 — Covers (only when the recipe defines a cover pipeline) \[medium freedom\]](#step-4--covers-only-when-the-recipe-defines-a-cover-pipeline-medium-freedom)
- [Step 5 — Videos (only when the recipe defines a video spec) \[medium freedom\]](#step-5--videos-only-when-the-recipe-defines-a-video-spec-medium-freedom)
- [Step 6 — Gates (pass every layer before use) \[low freedom\]](#step-6--gates-pass-every-layer-before-use-low-freedom)
- [Step 7 — Report \[high freedom\]](#step-7--report-high-freedom)
- [MUST / NEVER](#must--never)

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
Test data prep progress:
- [ ] Find the recipe
- [ ] Refusal-first (precondition gate)
- [ ] Gate 0 — Intake (mandatory, wait for the user)
- [ ] Step 1 — Reuse first
- [ ] Step 2 — Create only what is missing, at the exact target status
- [ ] Step 3 — Names + descriptions = real content for real users
- [ ] Step 4 — Covers (if the recipe defines them)
- [ ] Step 5 — Videos (if the recipe defines them)
- [ ] Step 6 — Gates (pass every layer before use)
- [ ] Step 7 — Report
- [ ] Step 8 — Register + clean up
```

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Read before creating anything.** Open the recipe and every document it names BEFORE the first login or creation. Inventing a recipe, a value, a cover style, or a tool is the single most common cause of rejected data — do not do it.

**Reuse the real tools.** If the recipe names a tools root (`{QA_TOOLS_ROOT}`) and scripts, reuse them as-is — never rewrite a divergent copy that drifts from the approved output.

**Not-all-green = not usable.** Data that fails any gate layer is not ready: never upload it, never test with it, never call the job done, never report it silently. Fail a layer → root-cause → fix at source → restart from layer 1 (no partial pass, no workaround).

**Report as you go.** Announce the plan, report each stage, and record every user correction into the recipe immediately (do not make the user repeat a correction).

## Find the recipe

Run [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) first. The recipe is the workspace file `references/*-data-prep.md` (or `references/*-test-data-guide.md`); also read any file the user names. The recipe may point to further documents (for example a private repo's guide via `{EVIDENCE_REPO}`) — read those too.

The recipe supplies these slots:

| Slot | Used in |
|------|---------|
| Source documents to read | Discipline |
| Environments, network/VPN notes, which env may be touched | Refusal-first, Gate 0.1 |
| Roles / accounts and where secrets live (`{SECRETS_DIR}`) | Gate 0.1 |
| Data types and their allowed target statuses | Gate 0.2, Step 2 |
| Style buckets / themes | Gate 0.3, Step 4 |
| List + create endpoints or UI path, and the status-transition chain per type | Steps 1–2 |
| Naming language and forbidden markers | Step 3 |
| Cover pipeline, its rules and cover gate (optional) | Step 4 |
| Video spec (optional) | Step 5 |
| Readback / publish-chain gates | Step 6 |
| Clean-up policy | Step 8 |

**No recipe, or a slot it leaves empty or marks "not configured":** ask the user for that value once, then save the answer into the recipe file in the user's repo immediately (create `references/{PROJECT}-data-prep.md` if missing) — no second "save this?" question. Never invent an account, URL, endpoint, transition, or tool. Never write a secret into a repo — store only the path of the local secrets file. If a needed capability is missing (for example an image API the recipe requires), stop and report.

## Refusal-first (precondition gate)

MUST NOT create, upload, or "seed" anything until:

1. **The recipe is found and read** (or every missing slot needed for this run has been asked and saved).
2. **Environment is confirmed by the user** from the recipe's list. Never pick an env yourself, even a more convenient one, and never touch an env the recipe forbids.
3. **Account + role is confirmed** for the create/verify surface.

If any is missing → stop and ask (Gate 0). If the request needs covers or videos and the recipe's required tool is unavailable, that work is **BLOCKED**; say so in chat, do not fall back to a plain/solid/gradient cover.

## Gate 0 — Intake (mandatory, wait for the user) [medium freedom]

**Gather EVERY requirement below and get the user's confirmation BEFORE any login, reuse check, or creation.** Ask in the ordered steps below — do not skip ahead, do not start on a partial answer. Skip a question only if the user already answered it explicitly this session (then state the value back and let them confirm with a short "ok", never re-ask).

Use the **AskUserQuestion** tool so each step is a real prompt the user answers (the type step is a checkbox / multi-select). Wait for each answer before the next step. Every option list below comes from the recipe — never from another project.

### Intake 0.1 — Environment + spec source (ask first, wait)

- **Environment** — the recipe's environments only (plus any network/VPN note it gives). Resolve real hosts from `{SECRETS_DIR}/` or the recipe; never write a host into this public repo.
- **Account / role** — offer the recipe's roles. Capture which role each item is created with (the recipe's default owner role, if it names one).
- **Spec URL** — the spec / reference page for the content to build. If the user has none, say so explicitly and note there is no spec (do not invent requirements).

### Intake 0.2 — Data type(s) to create (checkbox / multi-select, wait)

Ask which of the recipe's data types to build, as a **multi-select checkbox** (`AskUserQuestion` with `multiSelect: true`). For each selected type, also capture the **exact target status** from the recipe's status list — not "all published".

### Intake 0.3 — Style / content shape + quantity (ask last, wait)

- **Style / content format** — topic / theme / subject area, tone, language, and the recipe's style bucket (if it has covers).
- **Quantity** — how many of each selected type.
- **Purpose** — QA-run data or customer/training content (training content = stricter naming, real-user quality).

### Intake 0.4 — Detail questions (ask only the ones relevant to the selected types)

Ask these before the confirmation gate whenever they apply — each has a stated default, so a "use the defaults" answer is enough:

- **Reuse policy** — reuse existing items that already fit, or build all-new? (default: **reuse-first**, per Step 1.)
- **Owner / creator account per item** — (default: the intake account.) For isolation / permission cases, name each distinct owner.
- **Which items need a cover / video** vs text-only — only if the recipe defines covers/videos.
- **Delivery destination** — create-on-env only, or also upload evidence / deliverable somewhere? (default: create-on-env only.)
- **Lot / grouping label** — if this feeds a regression suite. (default: none.)
- **Duplicate-name clash handling** — default: **stop and ask** (offer skip / rename / proceed).
- **Sample approval** — required before the real lot for any cover/video work. (default: **yes**; confirm.)

**Confirmation gate:** restate the full captured spec (recipe file · env · account · spec URL · types+status · style · quantity · purpose · any 0.4 details) back to the user in one block and wait for a clear "go" before Step 1. Nothing is created until this is confirmed.

## Step 1 — Reuse first [high freedom]

Before creating, list what already exists on the target env through the recipe's list endpoint or UI path. If an existing item already covers the need, use it. Do not create a duplicate.

## Step 2 — Create only what is missing, at the exact target status [low freedom]

Follow the recipe's create recipe for the type and produce the **exact** status requested, using the recipe's create → transition chain for that status.

## Step 3 — Names + descriptions = real content for real users [medium freedom]

Every name and description is what a real user sees — it must read as genuine content, in the recipe's language and tone.

| Rule | Check |
|------|-------|
| No QA/test markers in name or description | none of the recipe's forbidden markers, nor generic ones (`QA Test`, `[QA TEST]`, `test`, `placeholder`, `TBC`, `dummy`, `sample`) |
| No status in the visible name | status lives in the system field, not in parentheses in the name |
| Natural, polite language only | no gibberish, no odd/rude words; the description describes real content, never "created for testing" |
| **No duplicate names** | check the new name against existing content (Step 1 list) **and** within the lot itself |

**Tracking label (for example the ticket key):** if the recipe requires one, put it in the field the recipe names; if it names no field, ask once and save the answer to the recipe. It never goes into the visible name or description.

**Duplicate-name clash → stop and ask the user.** Never silently create a second item with a colliding name. Report which item it clashes with (name / id / status) and let the user decide skip / rename / proceed.

**Go back:** If the user picks rename, return to the top of Step 3 and check the new name against the rules and existing content again.

## Step 4 — Covers (only when the recipe defines a cover pipeline) [medium freedom]

Skip this step if the recipe defines no covers. Otherwise follow the recipe's cover source, tool prerequisites (check the tool is up before starting; if it is not available, BLOCK and tell the user), its cover rules, and its approved reference lot. Tone and sharpness are **separate levers** — "make it sharper" changes resolution/sharpening only, never mood. Open every rendered image and check it by eye; never accept from the pipeline alone.

**Cover gate — pass EVERY row, or regenerate (fail-closed, no partial pass).** The recipe's own gate wins where it is stricter:

| Level | Check | Pass = |
|:--:|:--|:--|
| 1 | image source | from the recipe's image tool, not a solid/gradient/plain fill |
| 2 | scene matches content | opening it, the image is about that topic |
| 3 | no model-rendered text | no letters/logo/watermark in the background |
| 4 | overlay text char-exact | title/badges match the source char-exact, diacritics intact, contrast passes, no fake brand/metrics |
| 5 | **title fully inside the card/frame** | zero overflow past any edge; if it spills, shrink-to-fit failed → regenerate |
| 6 | **line-break + word integrity** | natural wrap per the recipe's language rules: no orphaned syllable, no split compound word |
| 7 | **sharpness** | matches the recipe's approved lot |

**Red flags — STOP and regenerate (do not ship, do not upload, do not call done):**
- any part of the title touches or crosses a card/frame edge
- a syllable or half of a compound word sits alone on a line
- the title was left long instead of shrinking to fit
- the image looks soft / not matching the approved lot
- you are about to accept it from the pipeline **without opening the image and looking**

**Go back:** If any cover-gate level fails or a red flag shows, regenerate that cover and return to level 1 of the cover gate — no partial pass.

## Step 5 — Videos (only when the recipe defines a video spec) [medium freedom]

Skip this step if the recipe defines no video spec. Otherwise follow it exactly (format, motion style, voice, size limit). **Never** a static slideshow or plain-colour background unless the recipe says so.

## Step 6 — Gates (pass every layer before use) [low freedom]

- **Readback** — read every created item back field-by-field (correct / complete / thorough).
- **Publish chain** — if the recipe has a publish chain, confirm each field survives it and the recipe's viewer (for example a guest session) sees it.
- **Cover gate** (Step 4) and any extra gate the recipe lists.

Fail any layer → root-cause → fix at source → **restart from layer 1**. No partial pass, no silence.

**Go back:** After the fix at source, return to the step that produced the failing item — Step 2 (created item or status), Step 4 (cover) or Step 5 (video) — then restart this gate from layer 1.

## Step 7 — Report [high freedom]

Report to the user: the recipe used, what was **reused**, what was **created** (type · id · final status · name), every **gate result**, and any **clash / block** encountered. Record any new user correction into the recipe.

## Step 8 — Register every record, then clean up after the test [low freedom]

Test data left on a shared env is never anonymous or permanent. Registering happens **at creation** (Steps 2, 4, 5), not at the end.

**Register.** Append one row to the run's `data-register.md` (in the run's evidence folder) the moment each record is created:

| Column | Content |
|--------|---------|
| `id` | Record id returned by the system |
| `type` | One of the recipe's data types |
| `env` | Exactly the env confirmed at Gate 0 |
| `created_by` | Account and the agent or person who ran it |
| `ticket` | Ticket key the data serves (e.g. `{TICKET_KEY}`) |
| `created_at` | Date and time with timezone |
| `deletable` | `yes` (nothing else depends on it) · `no` (shared, reused, or a published item others use) · `unknown` (counts as `no`) |
| `cleanup` | `pending` · `done {time}` · `kept — {reason + who approved}` |

Reused records (Step 1) are listed with `created_by: existing` and `deletable: no` — never delete what you did not create.

**Clean up.** When the test round ends (pass, fail or blocked), walk the register: delete each `deletable: yes` record in reverse creation order (children before parents), read the id back to confirm it is gone, then set `cleanup: done`. A record that stays gets `kept` with a reason and an approver. Every delete stays inside the env confirmed at Gate 0 and is bound to ids in the register — never a bulk or name-pattern delete. Follow the recipe's clean-up policy where it is stricter.

**Exit check (all true before "done"):**
- [ ] every record created this run has a register row with all columns filled
- [ ] no row has `cleanup: pending`
- [ ] each `done` row was read back as gone
- [ ] each `kept` row names a reason and an approver
- [ ] the register is attached to the Step 7 report

Example row: `| 4f2a… | course | dev | qa-bot / agent | {TICKET_KEY} | 2026-11-06 10:42 +07 | yes | done 2026-11-06 11:30 |`

**Go back:** a failed delete, or a read-back that still finds the record, returns to this step; root-cause it, never mark `done`.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST find and read the project's recipe (and the documents it names) before creating | Single source of truth; inventing values is how data gets rejected |
| MUST ask once and save to the recipe when a slot is missing | One question per value, ever; the next run needs no re-asking |
| NEVER use another project's values (roles, envs, statuses, endpoints, tools) | Each project's data rules differ; a borrowed value creates wrong data |
| MUST confirm env + account and wait | Choosing env yourself is not QA's call (prod-data risk) |
| MUST reuse existing content before creating | Avoids duplicates and wasted work |
| MUST make covers pass the recipe's rules + the cover gate, when covers are in scope | Overflowing / gibberish / soft covers get rejected |
| MUST get sample approval before the real lot for cover/video work | The client approves the look; QA does not decide it |
| MUST produce the exact target status, and real-user names/descriptions | Wrong status = useless fixture; test markers are seen by real users |
| NEVER ship data that fails any gate, or call unfinished data "done" | Incomplete data silently corrupts a test run |
| NEVER create a duplicate name silently | Clash → stop and ask the user first |
| NEVER fall back to a plain/solid/gradient cover when the recipe's image tool is unavailable | The cover work is BLOCKED until the tool is up — report it |
| NEVER write a secret into a repo | Only the path of the local secrets file is stored |
| MUST register each record in `data-register.md` at the moment it is created | Data with no owner, ticket or time cannot be cleaned up safely |
| MUST clean up every `deletable: yes` record after the round and read it back as gone | Leftover test data pollutes later runs and is seen by real users |
| NEVER delete a record that is not in the register as created by this run, and never bulk-delete by name pattern | A pattern can match real users' content |
