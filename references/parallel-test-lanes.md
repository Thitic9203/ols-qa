# Parallel test lanes (default execution mode)

Single source of truth for **how a ticket's confirmed test plan is executed**: split across
subagents ("lanes") that run at the same time, each holding **its own account**. Used by
`testing-ticket-workflow` (story / task) and `retest-bug-workflow` (bug / task).

**Goal:** the shortest wall-clock time per ticket **without** losing coverage, evidence, or
correctness. Speed never buys a weaker verdict — every gate in the calling workflow still applies to
every lane.

---

## Contents

- [1. Default = parallel lanes](#1-default--parallel-lanes)
- [2. Build the lane plan (before the confirm gate)](#2-build-the-lane-plan-before-the-confirm-gate)
- [3. Account isolation — no collision](#3-account-isolation--no-collision)
- [4. When serial is the right call](#4-when-serial-is-the-right-call)
- [5. Lane prompt (what the parent sends)](#5-lane-prompt-what-the-parent-sends)
- [6. Merge (parent, after all lanes return)](#6-merge-parent-after-all-lanes-return)
- [MUST / NEVER](#must--never)

## 1. Default = parallel lanes

Execution is **parallel by default**. Serial (one agent runs everything) is allowed only when one of
the predicates in §4 holds, and the plan states which one.

A **lane** = one subagent that owns:

| Owns | Rule |
|------|------|
| **Scenarios** | A disjoint subset of the confirmed plan — every scenario is in exactly one lane |
| **Unit work, end to end** | Execution, the Figma compare, recording during execution, the non-PASS root-cause investigation, and the repro shape ([round-time-contract.md §4](round-time-contract.md#4-fan-out-lanes-own-their-unit)) |
| **Account(s)** | An exclusive lease on the account(s) its scenarios need — no other lane uses them during the run |
| **Browser context** | Its own browser context, started from its leased account's saved login file `{auth dir from guide}/{env}-{role}-{alias}.json` — named by account, not by lane, gitignored; never a shared profile. Session check before any result counts; fresh login on failure ([round-time-contract.md §5](round-time-contract.md#5-login-reuse-per-operator-across-runs)) |
| **Session lease** | If the workspace provides a session-lease tool (see project guide): the lane acquires a lease on its account's login before loading the login file (holder = lane id + round id), renews it on long runs, and releases it in `finally`. Never load a login file without a lease |
| **Test data** | Records it creates carry the lane id in their name (`QA-L2-…`) and are recorded in its report |
| **Evidence dir** | Its own output folder (`…/lane-L2/`) — no two lanes write the same path |

The **parent** (main thread) keeps everything that is not unit work: intake, plan (shown, then run —
no mid-run confirm gate in these rounds), design-node collection, lane plan, merge (one report and one bundle from the lanes, including
the evidence re-check of every non-PASS in §6), queuing each non-PASS challenge for the end decisions
popup, the summary, and every external write (Jira comment, transition, notify, results sheet).
**A lane never posts, transitions, assigns, or notifies.**

---

## 2. Build the lane plan (before the confirm gate)

1. **Read the account pool** from the project's guide (`references/*-guide.md` / login runbook):
   every account, its role, and any shared constraint (same OTP inbox / phone, single-session app,
   rate limit). Never invent an account. Never create accounts unless the user asks. If the guide has
   only one account per role, say so — that caps the lanes for that role (§3).
2. **Group the scenarios** into *units* that must stay together:
   - scenarios that mutate the **same shared record or global setting** (site banner, a feature flag,
     one course that two scenarios edit) → same unit, in plan order;
   - a **multi-role** scenario (admin approves a learner's request) → one unit holding **both** accounts;
   - the **widths / states** of one screen → same unit as that screen (one account, viewport changes);
   - a scenario whose precondition is another scenario's output → same unit, in order;
   - a scenario that changes something **another lane's scenarios look at** (global banner,
     site-wide setting, feature flag, a record other lanes display) → a **barrier unit**: it runs alone, after the parallel phase
     ends (or before it starts), and restores the setting before any lane runs again. One barrier
     unit never turns the whole run serial. A change that only the same lane's own scenarios observe
     (publishing a course that no other lane opens) stays in that lane.
3. **Assign units to lanes.** Lane count =
   `min(units, accounts that can be leased without collision, lane cap)`.
   Default lane cap is **4** (each lane holds a live browser); the user may raise or lower it.
   **Exception — retest, testing-ticket, and smoke rounds have no fixed cap:** lane count =
   `min(units, accounts leasable without collision)`, and any round with 2 or more units fans out
   ([round-time-contract.md §4](round-time-contract.md#4-fan-out-lanes-own-their-unit)).
   Balance lanes by expected duration, not by scenario count.
4. **Lease accounts** — write the lease table. One account appears in **one lane only**.
5. Put the lane plan in the confirm block of the calling workflow:

```text
Execution:   parallel — {N} lanes   (or: serial — reason: §4 predicate {x})
Lanes:
  L1 · learner01 (learner)            · scenarios 1, 2, 5     · data prefix QA-L1
  L2 · learner02 (learner)            · scenarios 3, 4        · data prefix QA-L2
  L3 · admin01 (admin) + learner03    · scenarios 8, 9, 10–12 · data prefix QA-L3
  L4 · —  (no free admin account → admin scenarios 6, 7 stay in L3, in order)
Shared-state units kept serial: {scenario ids + the shared record}
Barrier (runs alone after lanes): {scenario ids + the global setting + how it is restored}
```

Worked shape — 12 scenarios, pool `learner01–03`, one `admin01`, single-session app, learners share
one OTP inbox: L1 learner01 (enroll, progress, profile) · L2 learner02 (cart ×2) · L3 admin01 +
learner03 (create → edit → publish course, then the 3 refund cases in order) · logins staggered for
the shared inbox · barrier after lanes: global banner change + revert. One admin account limits the
admin work to one lane; it does not make the learner work serial.

---

## 3. Account isolation — no collision

**One account, one lane, for the whole run.** Two lanes on one login break each other in ways that
look like product defects: the app ends the older session, a cart / draft / progress record is
shared, a rate limit trips, a one-time code is consumed by the other lane.

| Situation | Do |
|-----------|----|
| Two units need the same role, pool has two accounts of that role | Two lanes, one account each |
| Two units need the same role, pool has **one** account | Both units go in **one** lane, run in order |
| Accounts share one OTP inbox / phone | **Parent pre-login:** before dispatch, the parent logs each of those leased accounts in one at a time (reading only the code issued after that request), saves each account's login file `{env}-{role}-{alias}.json` in the guide's auth dir (named by account, not by lane), then dispatches all lanes at once — each lane points at its leased account's file |
| Saved login file exists from an earlier run | Load it, call the session endpoint, expect the leased user id. On 401/403, a redirect to login, or a different user → the lane hands back `SESSION-DEAD {account tag}` and the parent recovers it (*Dead session* below; [round-time-contract.md §5](round-time-contract.md#5-login-reuse-per-operator-across-runs)) |
| App is single-session per account | Already covered by the lease — never re-use a leased account in a second context |
| Scenario needs a fresh / pre-first-use account | That account is leased to that lane only and is consumed — record it in the lease table |
| Pool too small for the plan | Fewer lanes, never shared accounts. Ask the user for more accounts only if it changes the lane count |

**Dead session → login by command, main thread only.** A lane never logs in, types credentials, gives login commands, or runs the login tool. On 401/403, a redirect to login, or a different user, the lane stops that account's cases and returns `SESSION-DEAD {account tag}`. The parent collects every dead account and then follows these steps.

The parent, like the whole skill, never opens a browser, login window or sign-in page, and never drives a login form, for any test account, whether on the main thread or in a lane (spec: login-by-command). Instead the main thread gives the user **ready-to-run commands** in chat, **one `bash` block per command**, built from the intake answers (`<project-dir>`, `<env>`, `<account>` and the relink/mint command names from the project guide or intake). The user presses Run, and Claude never runs them itself:

1. **Relink.** One block per needed account whose session is not live. This step uses no password:
   ```bash
   cd <project-dir> && <relink-command> --env <env> --account <account>
   ```
2. **Setup/mint.** Only for each account whose relink came back **FAILED**, one block for that account alone. The user types any secret in their own terminal:
   ```bash
   cd <project-dir> && <mint-command> --env <env> --account <account>
   ```
3. **Probe.** When the user says the commands have run, Claude calls the session endpoint for each account, expects that account's user id, and reports account → OK / FAILED with the reason. An account still FAILED blocks only its cases, which are reported BLOCKED ("session not restored") and never PASSED.

Once the probe is OK, the parent re-dispatches that lane's remaining cases. Prefer accounts whose sessions are already live when leasing, so the run needs as few commands as possible (zero when enough are live).

When choosing lane accounts, prefer accounts whose sessions are live now, so the run needs as few
windows as possible — none when enough live accounts exist.

**Proof of isolation (mandatory per lane).** Each lane's session preflight records the authenticated
user id from the app's own session endpoint — **one id per leased account** when the lane holds more
than one (a multi-role lane records each account at its first login). The parent compares it to the lease table before
accepting any of that lane's results. A mismatch, or a lane that logged in with an account it did
not lease, voids that lane's results — rerun that lane after fixing the cause.

---

## 4. When serial is the right call

Serial (one lane) is chosen only when the plan can name one of these:

| Predicate | Example |
|-----------|---------|
| **a. One account in total** | Guest-less app with a single test login |
| **b. Every scenario shares one mutable record** | All cases edit the same order |
| **c. Environment forbids concurrency** | Documented rate limit, one OTP device, VPN seat limit |
| **d. Plan has ≤ 2 scenarios** | Dispatch overhead exceeds the run |
| **e. User asked for serial** | Explicit in chat ("one browser", "run it yourself") — state the lane plan and its time saving once in the confirm block, then follow the user's choice |

A constraint on **part** of the plan limits **that part**, never the whole run:

| Rationalization | Reality |
|-----------------|---------|
| "Only one admin account, so run everything serial" | The admin units share one lane; learner units still get their own lanes (§3) |
| "Learner OTPs share one inbox, parallel logins could cross codes" | Stagger the logins (§3); after login the lanes run in parallel |
| "One scenario changes a global setting every lane sees" | That scenario is a barrier unit (§2); the rest run in parallel |
| "User is in a hurry, so one agent is simpler" | Parallel lanes are the fast path; serial is the slow one |
| "Faster to do it myself" / "subagents are more work" / "the guide does not mention parallel" | Not a §4 predicate |

---

## 5. Lane prompt (what the parent sends)

Each lane gets a self-contained prompt — a subagent does not see the conversation:

```text
You are lane {Lx} of a {N}-lane test run for {TICKET}. Read-only on Jira/chat: never post,
transition, assign, or notify.
Environment: {env} · base URL {url} · build {build id}
Account lease: {account(s) + role} — credentials from {guide path / env var name}. Use ONLY
these accounts. Do not log in with any other.
Browser context: own context, started from the leased account's login file
{auth dir}/{env}-{role}-{alias}.json (pre-logged-in by the parent when the account shares an OTP
inbox — start from it, do not request a new code). Before any result counts, call the session
endpoint and expect {user id}; on 401/403, a login redirect, or another user, STOP that account's
cases and return SESSION-DEAD {account tag}. Never log in, type credentials, give login commands, or run the
login tool yourself — the parent restores sessions by ready-to-run command.
Session lease: if the workspace provides a session-lease tool ({lease tool from guide}), acquire the
lease on {account tag} BEFORE loading the login file — holder "{Lx} {round id}", TTL longer than the
run — renew the lease before it expires, and release the lease with the same holder in finally (on
error too). Never load a login file without a lease. If acquire is refused because another holder has
the account, use a different account or wait — never force or delete another lane's lease. (When the
parent already holds it: LEASE-HELD-BY-PARENT — do not acquire or release it yourself.)
NO-ADVISOR: do not call the advisor tool — the parent reviews your work. A cut-off advisor call can
stall a lane for minutes with nothing written.
Time limit: run every driver or browser script under a hard time limit — `timeout {seconds} node …`,
or the script's own overall deadline that closes the browser and exits. Never leave a script without
one. Before you return, make sure no process you started is still running (driver, browser, shell);
stop any that is, by its PID, and report each one you had to stop.
You own your units end to end: execution, Figma compare (one per screen × width), recording during
execution, non-PASS root-cause investigation, and the repro shape.
Scenarios (run in this order): {ids, steps, expected, design node per screen, widths, fixture}
Test data: prefix every record you create with QA-{Lx}-; list every id you create.
Evidence dir: {path}/lane-{Lx}/
Follow: {calling WORKFLOW.md path} — Phase D preflight + Phase E (E0–E2), or Step 4 (4a–4h).
Return: (1) session preflight — env, build id, authenticated user id (2) one row per scenario:
status · actual · evidence paths (3) every non-PASS with the root-cause investigation and its
artifacts (4) records created (5) anything that blocked you (6) every lease you acquired and that you
released it (7) every process you had to stop before returning (none = say none). Never report a
status without evidence.
```

Never paste a password into the prompt or let a lane echo one in its report — point to where the
credential lives.

---

## 6. Merge (parent, after all lanes return)

1. **Isolation check** (§3) per lane — authenticated user id = leased account.
2. **Coverage check** — the union of lane rows equals the confirmed plan; every AC/EC id has its own
   row. A missing scenario is NOT TESTED until run, never assumed.
3. **Evidence check** — open the evidence paths each lane cites; a row without evidence is not a
   result.
4. **Verify every non-PASS yourself** — a lane's verdict and root cause are claims until the parent
   re-checks them (calling workflow's challenge step: testing-ticket E3 / retest 4i).
5. **Login smoke vs lanes** — the workflow's pre-flight login smoke runs before the lanes; on a
   single-session app a lane's own login ends that smoke session. That is expected, not a finding.
6. **Parallel-only failure** — a case that fails in a lane but passes when re-run alone is **not**
   "flaky". It is either a test-isolation fault (shared account, shared record, shared data name —
   fix the lane plan) or a real concurrency defect in the product. Root-cause it; never re-run until
   green.
7. Clean up or list the records each lane created, per the calling workflow's data rule.
8. **Lease check** — every lease this round acquired is released: the lease tool's list shows none
   whose holder carries this round's id. When the workspace carries `tools/lane-lease-check/`, run
   `node tools/lane-lease-check/check.js --round {round id} --dir {lease dir from guide}` — exit 0
   required; exit 1 lists the leases still held (release each, run again); exit 2 is "cannot check",
   never a pass. A lease left behind blocks that account's background session refresh after the round.
9. **Leftover-process check** — no driver, browser, or shell a lane started is still running. When the
   workspace carries `tools/lane-lease-check/`, run
   `node tools/lane-lease-check/check.js --procs-tags {account tag 1},{account tag 2},…` with every
   account tag this round leased — exit 0 required. Exit 1 prints `LEFTOVER pid <n>: <command>` per
   process: stop a process by its PID only when it belongs to this round (its command names this
   round's script or evidence dir), never by name or pattern, then run the check again. A leftover that
   is not this round's is reported, not stopped. Exit 2 (ps could not run) is "cannot check", never a
   pass. A process left running keeps its account looking in use to any job that reads command lines,
   so that account is never refreshed.

Then continue with the calling workflow's summary / comment step as a single merged result.

---

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST default to parallel lanes and name a §4 predicate to run serial | Serial-by-habit is the main cost of long ticket runs |
| NEVER open a browser or login window for a test account (parent or lane) — a lane returns `SESSION-DEAD`; the parent gives ready-to-run commands (relink all needed → mint only the FAILED ones), then probes | Lanes that logged in by themselves popped a chain of login windows at the person; owner order 2026-10-21: login by command, as in the e2e suite |
| MUST lease each account to exactly one lane | A shared login ends sessions and shares state — false defects |
| MUST keep shared-record and multi-role scenarios in one lane, in order | Concurrent edits of one record race |
| MUST check each lane's authenticated user id against the lease | Proves no collision happened |
| MUST re-verify every lane's non-PASS in the parent | Subagent output is a claim, not a result |
| MUST acquire a session lease before a lane loads a login file and release it in `finally` (when the workspace provides a lease tool), and show none held by the round at merge | A refresh of a login in use ends the lane's session mid-run; a lease never released blocks the refresh after the round |
| MUST run every lane driver/browser script under a hard time limit, and show no process of the round left running at merge | A lane that dies leaves its driver running for as long as nothing stops it; that process keeps its account marked in use |
| NEVER let a lane post, transition, assign, or notify | External writes stay with the parent after approval |
| NEVER trade a gate for speed (design compare, widths, evidence, root cause) | Parallel shortens wall-clock; it never shortens the checklist |
| NEVER retry a parallel-only failure until it passes | It is an isolation fault or a real defect |
