# Round-time contract (retest, testing ticket, smoke)

This contract is shared by `retest-bug-workflow`, `testing-ticket-workflow`, and smoke-test workflows. Each rule below is a decision recorded in the round-time plan (`docs/plan/wayfinder-round-time/SPEC.md` in the Helix repo). Workflows link here instead of restating the rules.

**What this contract does not change:** the evidence standard. Fresh verification in this session (`qa-evidence-gates.md`), the 7-layer pre-delivery gate, the MP4 7-layer check, and the post-publish re-read all stay as they are. The contract only removes waiting and repeated work.

## 1. Time budget and the round report

- **Cap:** 15 minutes of **AGENT + EXEC** time per round. AGENT is reading, comparing and drafting. EXEC is login, browser and API steps, recording, upload, and posting.
- **Human wait is not counted.** Report it on its own line.
- **Soft cap:**
  - At about 12 minutes, print one line: `Round time: ~12 min of 15 used — finishing.`
  - Finish the round. Never cut cases to stay under the cap.
- **Every round report ends with this line:**

  `Round time: AGENT+EXEC {n} min · human wait {h} min · overrun {max(0, n-15)} min`

  Measure the numbers from the session's own timestamps. Never estimate them.
- **A re-test is a new round.** When the user picks **B re-test** in the end decisions popup, a new round starts with its own 15 minutes.

## 2. No mid-run waits

| Point | Rule |
|---|---|
| Scope gate (retest Step 2b/2c, testing Phase C) | **Show the plan, then run.** Print the case list and lane plan, then start execution without waiting. The plan appears again in the end decisions popup, where the user can correct it. A correction there starts a new round. |
| Non-PASS challenge (A/B/C), missing design, cross-ticket conflict | Apply the documented unattended default: `non-pass-challenge-gate.md` (BLOCKED + remark, continue); the retest "missing design" bot-mode rule; `qa-closing-shared.md` cross-ticket step 5. Then **queue the question** for the end decisions popup. |
| Per-project values: env, account pool, Jira post format (v2/v3), transition names, notify recipient field, results destination | Read them from the workspace guide. If a value is missing, ask once and **save it to the guide immediately**, without a second "save this?" question (`workspace-guide-discovery.md`). Never store production passwords in a committed guide. |

## 3. End of round (fixed order)

1. **Reviewer and bundle in parallel.** Start the independent reviewer subagent in the background. Meanwhile, build the bundle: run the render and media check (§6) and prepare the popups. The reviewer must return CLEAN before step 4. Its loop has no round cap, as today.
2. **Decisions popup.** Shown only when questions are queued. Use one `AskUserQuestion`, batched 4 questions at a time. It holds: the scope plan, each queued non-PASS (A/B/C), missing design, and conflicts (Investigate / Close).
3. **Apply the answers.** Re-render the draft and re-run the guard.
4. **Approval popup.** One approval for the whole bundle, listing every concrete action by name:
   - the comment (target ticket and endpoint);
   - each transition (ticket, from → to);
   - each assign (ticket and person);
   - each linked story to unblock;
   - each notify (channel and resolved recipient);
   - each external result update (destination and rows).
5. **Execute.** Post, then do the post-publish re-read. Then transition, assign, unblock, notify, and update results. No second approval.

If no decisions are queued, step 2 is skipped, and the round has a single human touch.

## 4. Fan-out (lanes own their unit)

- **Fan out whenever a round has 2 or more units.** Group units as in `parallel-test-lanes.md` §2. A barrier unit still runs alone.
- **Lane count** = min(units, accounts leasable without collision). There is **no fixed cap** for these flows.
- **Each lane owns its unit end to end:** execution, the Figma compare (§7), recording during execution (§8), the non-PASS root-cause investigation, and the repro shape.
- **The main thread only merges.** It builds one report and one bundle from the lanes.
- **Execution stays agent-driven.** The agent drives the browser step by step. It is not replaced by a scripted run.

## 5. Login reuse (per operator, across runs)

- **Saved login file:** `{auth dir from guide}/{env}-{role}-{alias}.json`. It is named by account, not by lane, and is gitignored. The auth directory comes from the project guide.
- **Before any result counts,** load the file and call the session endpoint. Expect the expected user id. On 401/403, a redirect to login, or a different user, log in fresh and overwrite the file.
- **One account belongs to one lane,** and accounts are never shared across concurrent sessions.

## 6. Comment render and media check (before the approval popup)

Run both checks on the **final** body:

- **Render the body locally** (ADF or wiki, whichever the format the guide sets). Confirm the tables, line breaks, and formatting.
- **Resolve every referenced image or clip:** the attachment exists, and the id or filename matches the reference.

A failure blocks the approval popup until it is fixed. The post-publish re-read remains the proof of what was posted.

## 7. Figma compare: keep it full, dedupe

- **One compare per screen × width per round.** Cases that land on the same screen share one fresh app capture and one design read.
- **Cache the design-side export** (node screenshot and metadata), keyed by the Figma file's `lastModified`. Re-fetch only when it changes. The app-side capture is always fresh.

## 8. MP4: record during execution

The run that executes the case is the recording, so there is no separate capture pass. Every clip still passes all 7 layers. A red layer still means re-capture and re-run all 7 layers.

## 9. Guard on the posted body

Skip the posted-body guard **only** when the posted body is byte-identical to the draft that passed the guard. Check the identity fresh, by comparing hashes of both bodies. If they differ, run the guard as before.

## 10. Per-ticket state and fingerprints

- **Write `references/helix-handoff-{KEY}.md` at the close of every round** (`handoff-file-template.md`). It holds the case list, the AC/EC list, Figma node refs, the Swagger version, last-round results, and one fingerprint per source.
- **At the start of round N, fetch each fingerprint fresh:**
  - ticket `updated` plus comment count;
  - Figma `lastModified`;
  - Swagger spec hash;
  - build version, where exposed.

  A source whose fingerprint matches is not re-read in full. A changed or missing fingerprint re-reads that source only.

## 11. Retest round N: scoped round

- **Re-run** the cases the fix touches plus every case that failed before. List every other case under `Out of scope this round`.
- **The agent proposes the scope** from the fix description, and the user confirms it in the end decisions popup.
- **The case list is still re-counted against the bug fresh,** and PASSED evidence is never carried forward from an earlier round.
