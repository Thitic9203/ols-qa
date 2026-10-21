# Spec — Story/Bug test skills: one login window at a time, email prefilled

> **Superseded in part (21/Oct/2026):** R1 (window part), R3 (window part), R4 and the window clause of R10 are replaced by [login-by-command](../login-by-command/spec.md). Claude never opens a login window. It gives ready-to-run relink/mint commands and then probes the session.

**Owner request:** 21/Oct/2026 — "แก้สกิลเทส story, bug ให้เด้ง login แค่หน้าเดียวและใส่อีเมลให้ รอผู้ใช้ใส่แค่รหัสผ่าน ไม่ใช่เด้งวนลูปมาหลายอัน". Scope chosen the same turn: fix both the skills (ols-qa) and the login tool (ols-qa-testing-bot).

## Why (measured 21/Oct/2026)

- Both skills require parallel lanes, one account per lane (`skills/procedures/testing-ticket-workflow/WORKFLOW.md:399`, `skills/procedures/retest-bug-workflow/WORKFLOW.md:435`). Their "Login reuse" text tells each lane to "log in fresh" by itself when its saved session fails (`testing-ticket-workflow/WORKFLOW.md:287-290`, `retest-bug-workflow/execute-and-evidence.md:59-67`). Nothing limits who may open a login window, so N lanes can open N windows.
- The only sanctioned window opener, `capture/login_from_sheet.py` (testing-bot repo), takes a sheet row range and passes `--force` unless `--skip-healthy` is given (`capture_argv`, lines 171-176). `session_capture.js` then opens one browser per account in turn (`for` loop at line 432), healthy accounts included. Email prefill already works (`session_capture.js:182,258`).

## Rules

- **R1** — When a Story (testing-ticket) or Bug (retest-bug) run needs a fresh login, only the **main thread** may open a login window. A lane must never open a login window, type credentials, or run the login tool.
- **R2** — A lane whose saved session fails the session check (401/403, redirect to login, other user) must stop that account's cases and return `SESSION-DEAD <account tag>` to the main thread.
- **R3** — Before any window, the main thread must try the no-password recovery first (relink, per the project guide). It opens a window only for an account that is still dead and that the run actually needs.
- **R4** — The main thread must open **one window at a time, for one account**: email already filled, cursor in the password field, the person types only the password. It waits for that sign-in to finish and be verified before opening any other window. It must not open windows for a row range or for accounts the run does not use.
- **R5** — Prefer accounts whose sessions are already live when choosing lane accounts, so the run opens as few windows as possible (zero when enough live accounts exist).
- **R6** — The login tool must skip accounts the server confirms healthy **by default**; re-capturing a healthy account is opt-in (`--force`).
- **R7** — The login tool must open at most one account per run unless the caller passes `--tag <tag>` for each wanted account or explicitly opts in with `--all-selected`. With more than one account selected and neither flag, it refuses and opens nothing, listing the tags.
- **R8** — Existing guards stay: accounts only from the live sheet, plan file gate, retired accounts never opened, never types a password, sign-in opened at the OLS app (`?signIn=1`).
- **R9** — Skill text stays generic (portable-content rules): no hosts, emails, or local paths.

- **R10** — (21/Oct/2026 catch-ai, owner popup "แก้ ทุกโปรเจกต์") No Story/Bug skill step may ask for, accept, store, or fill a password, for any project: intake collects the **account** (username/email) only; Playwright never fills a password field; a fresh login is the R4 window. A password the user volunteers in chat is not used and not echoed. Project config templates hold accounts and login method, never a password column.
- **R11** — The login-window lint must also fail on a password intake row, a "fill login/credentials" instruction, or a Password column in the skill files and templates of both skills.

## Edge cases

- All needed accounts live → zero windows.
- Two lanes report dead sessions → main thread recovers via relink; if both still dead, opens window A, waits for verified sign-in, then window B. Never both at once.
- `--tag X` where X is not in the selected sheet rows → refuse, nothing opened.
- `--skip-healthy` passed by an old caller → still accepted (now the default), no error.
- Unauthenticated ticket (guest) → no login at all.

## Done when

- Testing-bot: `tests/test_login_from_sheet.py` has failing-first tests for R6 (default run passes no `--force`), `--force` opt-in, R7 refusal with 2+ tags, `--tag` narrowing, `--tag` not in selection refused; offline test suite green.
- ols-qa: both skills state R1–R5 in their login step, lane prompt and MUST/NEVER table; a guard test fails if a skill tells a lane to log in itself; `bash scripts/run-test-suites.sh` green; PR merged; helix synced.
- (R10) `git grep` over both skills finds no password intake field, no "Fill login", no Password column; the testing-ticket intake lists six items.
- (R11) `node tools/login-window-rule/check.test.js` has known-answer cases for each new shape and passes on the repo.
