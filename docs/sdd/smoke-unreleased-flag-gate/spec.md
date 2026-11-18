# Spec — Smoke test: unreleased work must stay hidden on production / training

Status: owner order 2026-11-18 · applies to `skills/smoke-test-workflow/SKILL.md` and `commands/smoke-test.md`

## Why

Owner 2026-11-18: when a smoke round runs on production or a training environment, work that is not
released as of the test day must be switched off by its flag and must not show on the web. Which work
is "not released" is read from the ticket's **fix version** in Jira. Every piece of unreleased work
that does show must be listed as a bullet: which ticket, which fix version, which environment.

## Rules

- **R1.** When the round's environment is production or a training environment (the owner named it
  for this round), the workflow must run the unreleased-work check before the result quality gate.
  On dev and pre-prod the check does not run. Source: owner 2026-11-18 "ถ้าทดสอบใน prod หรือ traning env.".
- **R2.** The test date is measured with `date` at the start of the check (Asia/Bangkok), never assumed.
  Source: CLAUDE.md §0 (time is measured).
- **R3.** A fix version is a **future release** only when its `releaseDate` is after the test date
  (a version releasing on the test day counts as released). A version with no `releaseDate` is not
  counted; its name is listed once in the round record as `no release date — not checked`. The list is
  read read-only from the Jira REST versions endpoint of the OLS project. Source: owner "ดูจาก fix
  version ในทิคเกตบน jira"; owner 2026-11-18 plan answer "นับเฉพาะ releaseDate".
- **R4.** The check must cover every ticket whose fix version is a future release, every status and
  issue type. The search uses `GET /rest/api/3/search/jql`, paged with `nextPageToken` until
  `isLast` is true (Atlassian Jira Cloud REST v3, Issue search, read 2026-11-18). `POST
  /rest/api/3/search/approximate-count` for the same JQL is a cross-check only; both numbers are
  recorded and a difference is reported, never resolved by picking one. `/rest/api/2/search` must not be used — it returns HTTP 410
  (removed), measured 2026-11-18. Source: owner "ทั้งหมด"; CLAUDE.md §0 (numbers carry query + divisor).
- **R5.** For each ticket the check derives what it would put on screen (route, label, button, section)
  from the ticket's description / AC fields and the `ols-monorepo` commits that cite its key, plus the
  flag that guards it when the code has one. A ticket with no screen surface is recorded
  `no UI surface` with the evidence; a ticket whose surface cannot be pinned is `unverifiable` with the
  reason. Neither is ever counted as hidden. Source: CLAUDE.md §0 (three states only).
- **R6.** The look is made through the real UI of that environment, read-only, as every role that could
  reach the surface. Evidence is a front-end screenshot. Nothing is written to the environment or to
  Jira. Source: CLAUDE.md §6; `test-through-real-steps.md`.
- **R7.** Each ticket ends in exactly one outcome: `hidden` · `visible` · `no UI surface` · `unverifiable`.
- **R8.** Every `visible` ticket is listed as one bullet, in the chat report and the round record:
  `พบงานของ ticket <KEY> (<summary>) · fix version <version> · แสดงบน <env> (<role>, <page>)`.
  `unverifiable` tickets are listed in their own bullet list with the reason. Source: owner
  "ต้องลิสต์ออกมาเป็นบลุเลท ว่า พบงานของทิคเกตไหน อยู่ใน fixversion ไหน อยู่บน xx env.".
- **R9.** A `visible` finding is a release-gate finding, not a filed bug: no ticket or issue is opened
  without the owner's live order, and while any is open the round must not be reported clean nor the
  notify claim the build is clear. Findings go to the end-of-round decisions popup. Source: CLAUDE.md §7.
- **R10.** The training NEVER line is narrowed to "unless the owner named it for this round", matching
  the owner order. Source: owner 2026-11-18; memory `f:smoke-other-env-on-owner-order`.
- **R11.** A test must fail when the R1–R10 wording is missing from the workflow. Source: owner rule 18.

## Out of scope

- Changing the Playwright suite or the exclusion registry.
- Running the check on dev / pre-prod.
- Opening bugs for findings (owner decides per finding).

## Done when

- The workflow and command carry the check; the contents, checklist and MUST/NEVER lines agree.
- `node tools/smoke-guard/unreleased_flag_rule.test.js` passes, and fails when a rule line is removed.
- `bash scripts/run-test-suites.sh` is green.
