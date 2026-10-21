# Spec — Story/Bug test skills: login by command, never a login window

**Owner order:** 21/Oct/2026. Apply the e2e suite's login rule to the Story skill (`testing-ticket`) and the fix-verification skill (`retest-bug`), with the user's own accounts in place of the e2e ones. Claude never opens a browser or login window to log a test account in. It gives the user ready-to-run commands, the user presses Run, and Claude probes the session.

**Supersedes:** [single-login-window](../single-login-window/spec.md) **R1** (window part), **R3** (window part), **R4**, and the "fresh login is the R4 window" clause of **R10**. Its R2 (lane hands back `SESSION-DEAD`) and R5 (prefer live accounts) carry over as R7 and R8 below. Its R6–R7 cover the testing-bot login tool. That tool stays, but these skills no longer tell Claude to run it.

## Why

- The previous rule (`single-login-window`, same day) still had Claude open a login window: one at a time, email prefilled (`references/parallel-test-lanes.md` §3 *Dead session*, step 2; `testing-ticket-workflow/WORKFLOW.md` *Fresh login*; `retest-bug-workflow/execute-and-evidence.md` §4b). Today the owner ordered that no window is opened at all, which matches how the e2e suite already logs in.

## Rules

- **R1** — When a test account needs to log in, or its saved session has expired, the skill must **never** open a browser window, a login window or a sign-in page for it. This applies to the main thread and to every lane. It must not drive a login form either.
- **R2** — In place of a window, the skill must give the user **ready-to-run commands in chat**, with **one `bash` block per command**, so the user can press Run on each block. Claude does not run these commands itself.
- **R3** — **Step 1, relink.** The first commands relink **every account the run needs**, without a password. Accounts that are already live are skipped. There is one command per account, built from the template the user gave at intake.
- **R4** — **Step 2, setup/mint.** For **each account whose relink comes back FAILED**, and only for those accounts, the skill must give one setup/mint command for that account alone. The user runs it and types any secret in their own terminal. The skill never gives a mint command for an account that relinked OK, and never one command for a whole row range.
- **R5** — **Step 3, probe.** After the user reports that the commands have run, Claude probes each account's session itself: it calls the session endpoint and expects that account's user id. It then reports a table of account → OK / FAILED with the reason. An account still FAILED after step 2 blocks only the cases that need it. That is reported as BLOCKED, never as PASSED.
- **R6** — The commands must be **generic templates** filled from the user's intake answers: `<project-dir>`, `<env>`, `<account>`, plus the relink/mint/probe command names and URLs. They come from the project guide, or from the user at intake when the guide names none. Intake records **account names, env, URLs and command templates — never a password**.
- **R7** — A lane whose session check fails must stop that account's cases and return `SESSION-DEAD <account tag>` to the main thread. Lanes never give login commands or log in themselves. The main thread runs R2–R5 for all dead accounts together, then re-dispatches.
- **R8** — When choosing lane accounts, the skill must prefer accounts whose sessions are already live, so the run needs as few commands as possible (zero when enough accounts are live).
- **R9** — The password rule stays: no Story/Bug skill step may ask for, accept, store or fill a password. A password the user pastes in chat is not used and not echoed. The only place a password is typed is the user's own terminal, in the step 2 command.
- **R10** — Skill text stays generic (portable-content rules): no hosts, emails, ids or local paths. Placeholders only.
- **R11** — The `tools/login-window-rule` lint must **fail** when a scanned skill file tells Claude to open a login window or sign-in page, keeps the old "one login window at a time" rule or a prefilled-email window, or tells the run to drive the real login. It must also **fail** when a required file does not state the login-by-command rule. The R10/R11 password checks of `single-login-window` stay.

## Edge cases

- All needed accounts are live → no commands. The skill probes and reports, then runs.
- Relink is OK for some accounts and FAILED for others → mint commands only for the FAILED ones (R4).
- The user never runs the commands, or reports no result → nothing is assumed. The cases for those accounts stay BLOCKED with the reason "session not restored".
- The project guide names no relink/mint command, and the user gave none at intake → ask for the command template (never a password). Until then, the cases that need the account are BLOCKED.
- Unauthenticated ticket (guest) → no login and no commands.
- An OTP/SSO account → the mint command is still run by the user in their own terminal. Claude never reads or types the code.

## Done when

- Both skills (WORKFLOW, the retest step file, the stubs) and `references/parallel-test-lanes.md` state R1–R8 and no longer tell Claude to open a window.
- `node tools/login-window-rule/check.test.js` has must-find / must-not-find cases for each new forbidden shape and for the new required marker, and passes on the repo.
- `bash scripts/run-test-suites.sh` is green.
- The PR is open, not merged. The helix sync is done by main after merge.
