# WIP — Regression Lot2 non-PASSED retest (EXECUTING, 2026-07-25)

**Active plan + living results + full handoff:** `continue/ols-lot2-nonpassed-retest-24jul.md` in the
**private** `ols-qa-evidence` repo. It has a **🧭 SESSION HANDOFF** block at the top — read that whole
block first; it carries progress, the reusable tooling map, and 9 hard-won gotchas.

## 🔴 Rule #0 (user, 2026-07-25): finish ALL 14 tickets today
OLS-225 · OLS-18 ✅ · OLS-33 · OLS-37 · OLS-58 ✅ · OLS-84 · OLS-85 · OLS-205 · OLS-206 · OLS-207 ·
OLS-209 · OLS-221 · OLS-222 · OLS-226. Done = every non-PASSED case has a real verdict + evidence +
written to its sheet tab.

## Progress: 79 / 174 written
- **G1 OLS-21** (5) + **G2 OLS-18** (16) + **OLS-58** (14) + **G3 OLS-222/209/221** (36) + **G5 OLS-37
  TC_01–09** (9) done, all written, rollup rebuilt. OLS-37's remaining TC_10–27 (G7/G8) still pending —
  do not mark OLS-37 done in the Rule #0 list above until those land too.
- **Override grant is ACTIVE** (user 2026-07-25): retest + write any testable/human row regardless of
  owner; **preserve QA Remark/Linked-Bug cells** (omit `remark` from sheet_write row objects).
- Remaining: **G6 running** (OLS-226/84/85/225 badge forms, User-Admin lane), then G4/G7/G8/G9–G11.
  Full detail + next-action pointer in the private plan's SESSION HANDOFF block.

## Environment + write scope (unchanged, mandatory)
- **Dev only** (`<DEV_HOST>`, VPN up). Never pre-prod/staging/prod. Pre-prod evidence can't close a case.
- Write **Sheet + Drive only**. Jira read-only except `READY TO TEST → TESTING`. No Jira comment, no
  bug opened, no Discord.
- Always headless. No screen hijack.

## Must-not-miss (full list in the plan's handoff block)
- **TLS:** Bitdefender re-signs TLS → node/curl need `NODE_EXTRA_CA_CERTS=~/ols-qa-testing-bot/certs/ca-bundle.pem`
  (set by `capture/lot2_env.js`). Chromium is fine. Never `-k`.
- **Login is proven sound (16/16)**; "did not land" = transient blip; `rotate()` retries. Don't rewrite login.
- **`automatetanapoom.int0909_stg68` (User Admin)** is the only account that opens `/admin/achievement`
  + `/admin/user`. Content Admin = creator-only (403). `test.sys*` rotate last.
- **Detect the login drawer structurally** (role=dialog + iframe `/sign-in/embed`), never by Thai text —
  it's titled "เข้าสู่ระบบ", not "กรุณาเข้าสู่ระบบ" (real wording gap, OLS-21 TC_12/14).
- **sheet_write.py:** links go in `links` field, not `capture`; `--dry-run` first; then
  `progress_build.py --apply` to refresh the rollup. Secret guard flags `.go.th` — name gov hosts
  generically. `ols-qa-evidence` has no pre-commit hook (task spawned to add one).

## Confirmed findings (reuse, already written)
- **NEW defect:** `POST /api/activities/{media|course}/{id}/view` → HTTP 500 for legacy non-UUIDv7 owner
  ids (view count can't accumulate). From OLS-21 TC_03.
- **OLS-58 ThaID:** DOPA host blocked by network gateway → all ThaID cases BLOCKED (env, not defect).
- **OLS-18:** SSO carry works on dev; preprod-400 reasons were out-of-env → 3 flipped PASSED.
- **`/admin/user` has NO role filter** (status + sort only) → OLS-209 TC_02/TC_10 will be FAILED.
  Active=ปกติ, Inactive=ถูกตัดสิทธิ์.
- **Badge page** structure captured (8 cols, 4 summary cards, dropdowns, row actions); **5-tab strip is
  not a real element** — the runner investigates group-filtering live.

## Previous WIP (finished)
TC review/draft batch, 16 tickets: DONE (2026-07-23). Method in `references/ols-project-guide.md` +
memory `feedback_ols-tc-autodraft-method`.
