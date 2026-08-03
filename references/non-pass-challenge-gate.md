# Challenge a non-PASS before you record it — the "wait, really?" gate

Applies to **every** QA result that is not a clean PASSED — any test case, any ticket, in
[testing-ticket-workflow](../skills/deprecated/testing-ticket-workflow/WORKFLOW.md),
[retest-bug-workflow](../skills/deprecated/retest-bug-workflow/WORKFLOW.md), and any per-case verdict
written to a sheet, comment, or notify.

A non-PASS is a **hypothesis about the product, not yet a verdict.** Before it becomes
FAILED / PASSED-WITH-MINOR-ISSUE / BLOCKED — or a filed bug — it must survive a deliberate challenge.
The reflex "the app is wrong" is right far less often than it feels. A first-impression non-PASS is
usually one of four things, and you cannot tell which until you challenge it:

| It looks like a defect, but it is actually… | Where the challenge catches it |
|---|---|
| the **expected** you tested against is wrong, misread, or **superseded by a related ticket** | §2 |
| a **test-side** cause — selector drift, stale auth, missing fixture, un-settled state, wrong entry point | §3 |
| a **genuinely unclear / conflicting spec** | §2 → BLOCKED + question, never a bug |
| a **real defect** against a verified expected | §2–§3 pass, then §4 → file / verdict |

```
A NON-PASS IS NOT RECORDED, NOT FILED, AND NOT NOTIFIED
UNTIL THE EXPECTED SIDE HAS BEEN RE-VERIFIED AGAINST AN AUTHORITATIVE SOURCE
```

Related: [root-cause-investigation.md](root-cause-investigation.md) (the *why* / cause), [defect-report-completeness.md](defect-report-completeness.md) (what the report must contain), [bug-priority-matrix.md](bug-priority-matrix.md) (severity → verdict), [qa-debug-discipline.md](qa-debug-discipline.md) (flaky/environment triage).

---

## 1. Pause and name the discrepancy — do not write "FAILED" yet

State it in one line, both sides, before any verdict word:

```text
Expected: {X}  (source: {where this expected value comes from})
Observed: {Y}  (evidence file)
```

If you cannot name the **source** of the expected value, you have already found the problem: you are
about to file the app against your own assumption. Go to §2.

---

## 2. Re-verify the EXPECTED side against an authoritative source — including related tickets' AC/EC

The observed side has evidence (a screenshot, a response body). The **expected** side is the one that
routinely turns out to be wrong — and it is the side that turns a real defect into a phantom one.
Read it **character-exact**, from the source, on **both** what it says and what it does **not** say.

Check the sources in this order, and stop challenging only when the expected value traces to one of
them verbatim:

1. **This ticket's own criteria** — Expected Result, Acceptance Criteria (**AC**), and edge-/exception-case
   criteria (**EC**). Read the actual text, not the test-case paraphrase of it.
2. **Related / linked tickets' AC/EC** — this is the step most often skipped, and the one this gate
   exists for:
   - the **parent story's** AC/EC,
   - every **linked issue** (`relates to`, `blocks`, `is blocked by`, `duplicates`, `clones`),
   - **sibling tickets that touch the same surface / component / endpoint**,
   - the ticket the **test case was derived from**.
   A related ticket can (a) **supersede** the expected value you are holding — a later ticket changed the
   intended behavior and the app now follows the newer one, or (b) **clarify** an AC/EC that reads
   ambiguously on this ticket alone. Either way, the app may be correct and the test-case expected stale.
3. **The design / spec the ticket points to** — Figma / PRD / AC document. Read the real frame, not a
   transliteration of it.

**Never treat as "the spec":** a transliteration, an English feature/button name, prose or verb usage
in a description, a test-case author's paraphrase, or your own recollection. (A button named `Bookmark`
does not make the required label "บุ๊กมาร์ก" — the design said "บันทึก" all along. That phantom bug cost a
full retest+close-out round; see the project post-mortem PM-006.)

**A hedge in the expected value = it was never verified.** If the expected result carries "confirm with
Figma/PO", "น่าจะ", "TBD", or any unconfirmed-spec marker, the spec is **unconfirmed** — that is a
**question, not a defect.** Resolve the question before recording anything.

### Outcome of §2

| Finding | This is… | Next |
|---|---|---|
| Expected was **wrong / misread / stale**; the app matches the authoritative source | **not a defect** | §4 — recommend adjusting the test case / expected |
| Expected is **superseded** by a related ticket; the app follows the newer behavior | **not a defect** | §4 — recommend adjusting the TC, cite the superseding ticket |
| Expected is **genuinely unclear / conflicting** across related tickets, or carries a hedge | a **question**, not a bug | **BLOCKED** for that case + an actionable remark naming the discrepancy, the related ticket, and **who to ask** (spec owner / PO) — never a bug ticket |
| Expected is **confirmed authoritative** and the app still differs | possibly a real defect | §3 |

---

## 3. Rule out a test-side cause

The expected is verified and the app still differs — before calling it a product defect, run the
[root-cause-investigation.md](root-cause-investigation.md) sweep. A **test-side** cause — selector
drift, stale auth/session, a missing or wrong fixture, an un-settled state read before a hard-reload,
the wrong entry point — is a **test defect**: fix it on our side, re-run, and record it as such. It is
never published as a product FAILED, and a real product bug is never filed away as "flaky"
([qa-debug-discipline.md](qa-debug-discipline.md)).

If a clean re-run still differs and the cause is on the product side, carry the labelled cause block
into §4.

---

## 4. Surface it to the user and let them steer — before the verdict is committed or a bug is filed

In an **interactive / supervised** session, post a short, plain-language flag in the chat **before**
recording the non-PASS verdict or opening a bug. Keep it readable for a non-developer:

```text
⚠️ เอ๊ะ — {case / ticket}: ผลไม่ผ่านตรง ๆ ขอเช็คก่อนบันทึก
• Expected: {X}  (source: {ticket AC / related ticket KEY / Figma frame})
• Observed: {Y}  (evidence)
• AC/EC check: {confirmed authoritative | expected looks wrong | superseded by {KEY} | unclear — needs {PO/role}}
• Recommendation: {A | B | C}
```

The recommendation is exactly one of:

- **(A) Adjust the test case / expected** — the authoritative spec differs from the TC; the app is
  right. The spec/TC owner updates the expected value (no code change). *Ask the user before changing
  any expected text — QA reports the conflict and names the owner; QA never rewrites the ticket's
  expected to match the app on its own* (maps to the "resolution options" in
  [defect-report-completeness.md](defect-report-completeness.md)).
- **(B) Re-test** — a test-side cause was fixed, or the fixture/steps/entry-point need correcting;
  re-run and re-observe before any verdict.
- **(C) Confirm the defect** — the expected is authoritative, the app genuinely differs, cause is on
  the product side. You may proceed to the verdict / bug, but still state the finding so the user sees
  the reasoning, and file it with its full write-up (repro matrix + expected-verbatim + labelled root
  cause + resolution options).

For A and B, **wait for the user's decision** — the whole point is that adjusting a spec or re-testing
is the user's call, not QA's. For a clearly-confirmed C you may continue, but never silently: the flag
still goes to chat.

### Unattended / bot mode — resolve the gate, never halt, never phantom-file

A headless bot has no user to ask and must not stall the run. It resolves §4 deterministically:

| §2/§3 finding | Bot action |
|---|---|
| Expected wrong / superseded / unclear / hedged | mark the case **BLOCKED** with an actionable remark (discrepancy + related-ticket KEY + who to ask). **Do not file a bug. Do not halt.** |
| Test-side cause | fix within the run's tooling and re-run; record as a test defect |
| Confirmed authoritative + product differs | record the non-PASS verdict with its full write-up, as normal |

This is the same rule the bots already follow for a failed login preflight or an unclear spec: record
and continue, never a phantom bug and never a stalled queue.

---

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST treat every non-PASS as a hypothesis and re-verify the **expected** side against an authoritative source before recording a verdict, filing a bug, or sending a notify | The expected side is the one that turns a real defect into a phantom one (PM-006) |
| MUST read the AC/EC of **related / linked tickets** (parent story, linked issues, sibling tickets on the same surface, the TC's source), not only the ticket under test | A later ticket can supersede or clarify the expected value; the app may be following the newer behavior |
| MUST read the expected value **character-exact from the source**, on both what it says and what it does not | A paraphrase or recollection is how the wrong expected gets tested against |
| MUST NOT treat a transliteration, an English feature/button name, prose/verb usage, or your own assumption as "the spec" | `Bookmark` ≠ label "บุ๊กมาร์ก"; the design said "บันทึก" (PM-006, phantom bug) |
| MUST treat a hedge in the expected value ("confirm with PO/Figma", "น่าจะ", "TBD") as an **unverified spec** → a question, not a defect | An unconfirmed expected is not a contract to fail the app against |
| MUST set the case **BLOCKED with an actionable remark naming who to ask** when the spec is genuinely unclear or conflicting — never a bug ticket | Unclear spec is a question for the spec owner, not a product defect |
| MUST surface a non-PASS to the user in chat (expected vs observed + AC/EC finding + a recommendation) **before** committing the verdict or filing, in interactive sessions | Adjusting a spec or re-testing is the user's decision; QA flags, the user steers |
| MUST NOT rewrite the ticket's expected/AC text to match the app on QA's own initiative | The spec owner decides; QA reports the conflict and names them |
| MUST, in unattended/bot mode, resolve the gate (BLOCKED+remark / re-run / record) and continue — never halt the run and never file a phantom bug | Bots cannot ask; stalling or phantom-filing are both failures |
