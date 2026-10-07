# Parallel test lanes (default execution mode)

Single source of truth for **how a ticket's confirmed test plan is executed**: split across
subagents ("lanes") that run at the same time, each holding **its own account**. Used by
`testing-ticket-workflow` (story / task) and `retest-bug-workflow` (bug / task).

**Goal:** the shortest wall-clock time per ticket **without** losing coverage, evidence, or
correctness. Speed never buys a weaker verdict — every gate in the calling workflow still applies to
every lane.

---

## 1. Default = parallel lanes

Execution is **parallel by default**. Serial (one agent runs everything) is allowed only when one of
the predicates in §4 holds, and the plan states which one.

A **lane** = one subagent that owns:

| Owns | Rule |
|------|------|
| **Scenarios** | A disjoint subset of the confirmed plan — every scenario is in exactly one lane |
| **Account(s)** | An exclusive lease on the account(s) its scenarios need — no other lane uses them during the run |
| **Browser context** | Its own browser context / `storageState` file, named by lane id — never a shared profile |
| **Test data** | Records it creates carry the lane id in their name (`QA-L2-…`) and are recorded in its report |
| **Evidence dir** | Its own output folder (`…/lane-L2/`) — no two lanes write the same path |

The **parent** (main thread) keeps everything that is not scenario execution: intake, plan, confirm
gate, design-node collection, lane plan, merge, the root-cause challenge of every non-PASS, the
summary, and every external write (Jira comment, transition, notify, results sheet). **A lane never
posts, transitions, assigns, or notifies.**

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
| Accounts share one OTP inbox / phone | **Parent pre-login:** before dispatch, the parent logs each of those leased accounts in one at a time (reading only the code issued after that request), saves `storageState-{Lx}.json` per lane, then dispatches all lanes at once — each lane starts from its saved state |
| App is single-session per account | Already covered by the lease — never re-use a leased account in a second context |
| Scenario needs a fresh / pre-first-use account | That account is leased to that lane only and is consumed — record it in the lease table |
| Pool too small for the plan | Fewer lanes, never shared accounts. Ask the user for more accounts only if it changes the lane count |

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
Browser context: own context, storageState file {path}-{Lx}.json (pre-logged-in by the parent when
the account shares an OTP inbox — start from it, do not request a new code)
Scenarios (run in this order): {ids, steps, expected, design node per screen, widths, fixture}
Test data: prefix every record you create with QA-{Lx}-; list every id you create.
Evidence dir: {path}/lane-{Lx}/
Follow: {calling WORKFLOW.md path} — Phase D preflight + Phase E (E0–E2), or Step 4 (4a–4h).
Return: (1) session preflight — env, build id, authenticated user id (2) one row per scenario:
status · actual · evidence paths (3) every non-PASS with the root-cause investigation and its
artifacts (4) records created (5) anything that blocked you. Never report a status without evidence.
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

Then continue with the calling workflow's summary / comment step as a single merged result.

---

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST default to parallel lanes and name a §4 predicate to run serial | Serial-by-habit is the main cost of long ticket runs |
| MUST lease each account to exactly one lane | A shared login ends sessions and shares state — false defects |
| MUST keep shared-record and multi-role scenarios in one lane, in order | Concurrent edits of one record race |
| MUST check each lane's authenticated user id against the lease | Proves no collision happened |
| MUST re-verify every lane's non-PASS in the parent | Subagent output is a claim, not a result |
| NEVER let a lane post, transition, assign, or notify | External writes stay with the parent after approval |
| NEVER trade a gate for speed (design compare, widths, evidence, root cause) | Parallel shortens wall-clock; it never shortens the checklist |
| NEVER retry a parallel-only failure until it passes | It is an isolation fault or a real defect |
