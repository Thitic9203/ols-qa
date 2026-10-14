# No-wait decision gate (20 layers)

**Applies to:** every case in `testing-ticket-workflow` and `retest-bug-workflow` that is about to be
recorded as anything other than a clean PASSED **because of an open question** — "spec unclear",
"sources disagree", "needs PO/design decision", "no data", "cannot reach the screen", "waiting for
someone", or "post later". It runs **before** BLOCKED / EVIDENCE_PENDING / "Needs decision" is written
anywhere (lane file, draft, chat, report).

**Why it exists:** a retest round parked four rows as "Needs PO decision" / "data ≤ threshold" and held
the finished comments for approval, although the owner's standing rule is *never wait for anyone —
investigate, decide from evidence, create the data, act*. Every one of those rows was decidable from
code history, ticket comments, a precedent on a sibling ticket, or data the tester could create. A
question handed back to the owner is unfinished work, not a result.

**The rule in one line:** a case leaves this gate with a decision (PASSED · PWMI · FAILED · or a
BLOCKED that survives all 20 layers), written with its sources — never with "waiting for X".

Fail-closed: if any layer is skipped, the case may not be written as BLOCKED, EVIDENCE_PENDING or
"needs decision". Record each layer's result (checked · source · finding) in the run's decision log.

## A. Read every source before calling it unclear (layers 1–7)

1. **Ticket, fresh.** Re-fetch the ticket description, every AC/EC row and **every** comment right
   before deciding — not the copy from intake. Quote the relevant lines char-exact.
2. **Struck / revised text.** Note struck-through bullets, "may we change this"-style revisions and answers
   in comments; a later PO/owner comment supersedes the earlier text.
3. **Parent and siblings.** Read the parent story/epic and every linked or sibling ticket on the same
   screen in full (description + all comments). Copied AC text between sibling tickets is a known
   source of false conflicts — check which ticket the wording was written for.
4. **Precedent.** Search the same ticket family for a decision already made on the same kind of
   conflict (e.g. "card vs design → follow design", "spec conflict → follow AC"). A recorded precedent
   or a standing owner decision **is** the answer; apply it and cite it.
5. **Code at the deployed commit.** Open the lines that produce the behaviour (path:line on the
   default branch / deployed tag) including inline comments.
6. **Code history.** `git log -L` / blame of those lines: which commit set them, its message, the
   ticket it names, and the PR body/review comments. A deliberate, reviewed choice tied to a ticket is
   evidence of intent.
7. **Design source.** Open the design node by every available route (design-tool API with the
   configured token, browser view, exported image) before declaring "no design". Read text/fill
   values from node data, not from a squint at a screenshot.

## B. Resolve, don't relay (layers 8–12)

8. **Rank the sources.** Later explicit decision (comment/precedent) > AC/EC > ticket detail text >
   design > code. Owner standing decisions (e.g. "spec conflict → follow AC") override this order
   where they apply.
9. **One-source check.** If one ranked source covers the point and nothing above it contradicts,
   that source is the expected — decide against it now.
10. **Same-ticket conflict.** If the app matches one owner-written target in the ticket and not
    another, it is not a defect; apply layer 4/8 to pick the canonical one and say why.
11. **Severity by matrix only.** A confirmed difference gets its priority/verdict from the project's
    bug-priority matrix (Low/Medium → PWMI, High/Highest → FAILED). Never park it to avoid choosing.
12. **Decision log.** Write `case · question · sources read (with quotes / path:line) · decision ·
    rule or precedent applied` to the run's decision file **before** writing the verdict.

## C. Create, don't wait (layers 13–16)

13. **Missing data is created.** If the case needs a state that does not exist (more items, an older
    or newer record, a role, a report, a submission), create it with the accounts and flows the
    project allows, on QA-owned content only, ledgered by id. "No data" is never a verdict.
14. **Time-bound states.** If a state needs time to pass (an age of N days), seed it now and schedule
    the capture for the earliest moment it exists; record that row as in-progress with the exact
    timestamp it becomes testable — not as BLOCKED.
15. **Accounts.** Exhaust the project's account roster and session-renewal tools before declaring an
    account missing. Only typing a password is reserved for a person.
16. **Tooling limits are not product verdicts.** A recorder, viewport or harness limit gets a working
    alternative (stills + measurements, another capture path) and a note — never a BLOCKED row.

## D. The only BLOCKED that survives (layers 17–18)

17. **Allowed BLOCKED causes** — and only these: the feature is not deployed to the target env
    (checked by commit/tag, not ticket status); creating the state is forbidden by a hard rule
    (production write, someone else's content, spend, an irreversible shared-env change); or the
    sources still contradict after layers 1–12 with no precedent and no standing decision.
18. **A surviving BLOCKED** carries: every layer checked with its source, the single concrete thing
    still missing, and the role that decides — and the run **continues** with every other case.

## E. Act, don't hold (layers 19–20)

19. **No holding finished work.** When the owner has delegated the round ("don't ask", "don't wait",
    "handle it"), finished drafts are posted and transitions done per the workflow's own gates
    (format, syntax, readback) without an approval wait. Opening new bugs/issues still needs a live
    yes — that hard limit never relaxes.
20. **Self-check before reporting.** Before the round report, scan every row for the words
    "pending decision", "needs PO", "waiting", "ask", "later", "no data". Each hit must point to its
    layer-17 cause and layer-18 record; otherwise reopen the case at layer 1.
