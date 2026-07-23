# Defect report completeness — the no-follow-up-question contract

A defect report is finished when **a developer who has never seen the ticket can act on it without
asking you anything**. Every question a reader asks after you post is a section you failed to write,
and every answer you give in chat instead of in the report is knowledge the next reader will not have.

Applies to every verdict that is not a clean PASSED: the retest comment (retest-bug-workflow Step 6)
and the defect list / external result write (testing-ticket-workflow Phase F3, Phase G).

---

## 1. The report answers five questions before they are asked

Write these five, in this order. A FAILED or BLOCKED report missing any one of them is **not ready to
post** — fix the report, do not plan to answer it in chat later.

| # | The question the reader will ask | Section that must already answer it |
|---|----------------------------------|-------------------------------------|
| 1 | What is wrong? | Verdict line + **one table row per expected-result item**, each ✅/❌ |
| 2 | Where does it happen — every entry point, or only one? | **Repro matrix** (§2) — one row per entry point actually exercised |
| 3 | What should it look like instead? | **Expected vs Actual**, both written as observable UI/API facts a dev can implement against |
| 4 | Why is that a FAIL and not a nitpick? | **Why-failed** line: quote the expected-result text verbatim, name the exact deviation |
| 5 | What must change, and who decides? | **Resolution options** (§4) — each option with a named owner |

Questions 2, 4 and 5 are the ones that get skipped. They are also the first three a dev asks.

---

## 2. Repro matrix — REQUIRED for every non-PASSED item

Every way a user can reach the broken surface gets its own row. No row = no claim about that path.

```text
|| No. || Entry point || Steps || Observed || Reproduces? || Evidence ||
| 1 | direct URL `{route}` | … | … | yes | tc4-….png |
| 2 | in-app navigation from `{screen}` | … | … | no — link removed, badge shown | tc3-….png |
| 3 | deep link / notification | — | — | not tested | — |
```

**Rules**

- **One row per entry point you actually exercised.** An entry point you did not exercise is written
  as `not tested` — never inferred from another row, never omitted.
- **"Happens everywhere" / "happens both ways" is a claim about N paths and needs N rows**, each with
  its own evidence file. If you have one screenshot, you may state one path.
- A scope word in the verdict (`always`, `any entry point`, `only when …`) must be traceable to the
  matrix. If the matrix does not support the word, the word comes out.
- The matrix goes **in the report**, not only in the local result file.

---

## 3. Two gates that must pass before you draft

### 3a. State-change settle — a stale client is your artifact, not their bug

When a fixture step changes server state (publish / unpublish / approve / reject / delete / role
change) while a client view is already open, that view still holds **pre-change data**. Anything you
observe in it is a property of your test timing, not of the product.

**After every state-changing fixture step, before observing any surface:**

1. Hard-reload or re-navigate to the surface (fresh document, not a client-side route change).
2. Observe and capture evidence **only** from the reloaded view.
3. If you want to report the stale window itself, report it as a **separate timing note** with the
   measured delay and an explicit "no data leak / leak" statement — never as the product's
   steady-state behavior, and never as a row of the repro matrix.

### 3b. Contradiction gate — your own observations must agree before you write

If two observations of the same surface disagree — two runs, screenshot vs. note, log vs. screenshot,
this run vs. an earlier run — you **MUST NOT draft the report yet**.

1. Name the contradiction explicitly ("run 1 shows the card clickable, run 2 shows it disabled").
2. Re-run **that surface only**, cleanly, after §3a.
3. The clean re-run decides. Record which earlier observation was the artifact **and why**.
4. **Never resolve a contradiction by picking the observation that supports the verdict you already
   reached.** That is how a wrong repro path gets published.
5. If a clean re-run cannot settle it, that item is **BLOCKED**, not FAILED, and the report says so.

---

## 4. Resolution options — REQUIRED when actual ≠ expected but the reported symptom is gone

This is its own failure class: **the fix works but deviates from the written expected result** (blocks
harder, blocks differently, renders a different screen). It is still FAILED — but the report must
hand the reader a decision, not a complaint. There are exactly two resolutions and QA picks neither.

```text
|| Case || Decided by || What happens ||
| The implemented behavior is what the design intends | spec owner (PO / reporter) | update the expected-result text to match the real behavior; ticket closes, **no code change** |
| The written expected result stands | dev | change `{exact surface / route}` to `{concrete target behavior}`; leave `{the parts that already pass}` untouched |
```

**Rules**

- Name the **exact** surface to change and the parts that must **not** change. "Fix the page" is not
  actionable; "`{route}` must still render title + lesson list and disable `{button label}`, while
  `{other route}` keeps its current block" is.
- **Never edit the expected-result field yourself**, and never soften the verdict to avoid the
  decision. Escalate the decision, do not make it.
- If a design source (Figma frame, spec page) could settle which case applies, either check it and
  cite it, or state plainly that it was not checked.

---

## 5. Pre-post dev-question gate (mandatory, before the FIRST post)

Read your own draft as the developer. Six questions — any "no" means the draft is incomplete.

- [ ] "Does this only happen if I open the URL directly?" → is there a **repro matrix row per entry point**?
- [ ] "What should the screen look like instead?" → is the target behavior **concrete enough to implement** (which elements render, which are disabled)?
- [ ] "Which line of the expected result did I break?" → is that line **quoted verbatim** next to the failing item?
- [ ] "Do I change code, or do you change the ticket?" → is the **resolution table with owners** present?
- [ ] "Is the thing I actually fixed still broken?" → does the report state plainly whether the **originally reported symptom is gone**?
- [ ] "What did you run?" → env, role(s), fixture identity, date, and **one evidence file per claim**.

Also: every scope word in the draft is backed by a matrix row (§2), and no observation used in the
draft is under an unresolved contradiction (§3b).

Any "no" → **fix the report**. Do not post and plan to explain in chat.

---

## 6. If a question still arrives after you posted

- **Answer from re-verified evidence, not from the report you already wrote.** If the answer is not
  already backed by a labelled evidence file, re-run the surface before answering. An answer
  reconstructed from memory of an earlier run is how a wrong claim reaches a dev.
- **Fold the answer back into the original report** (edit in place) so the next reader never needs the
  chat thread.
- If an earlier statement was **wrong**, correct it **visibly, in both places**: an in-place edit of
  the report that says which claim is being corrected, **and** a follow-up message in the thread where
  the wrong answer was given. Never a silent edit — people have already replied to the wrong version.
- A correction round is a defect in the report, not a normal step. Log what section §1 would have
  prevented it.

---

## 7. Answer shape in chat during the workflow

- Answer in the **shape the user asked for**. "Two lines" means two lines; "yes or no" starts with
  yes or no.
- **Lead with the direct answer**, then at most one line of why. Do not restate the ticket, the
  verdict history, or what you already said.
- If the user says it is too long or asks again, **shorten the same answer** — never re-emit it at the
  same length, and never re-derive it from scratch.
- Do not append next-step offers, caveats, or alternatives unless asked.

---

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST include a repro matrix row for **every** entry point exercised, and mark untried paths `not tested` | A scope claim with no row behind it is a guess published as a finding |
| MUST NOT state that a defect occurs via a path that has no evidence row | Learned OLS-108: "happens via both entry points" was published from one run, then had to be retracted to the dev in-ticket |
| MUST hard-reload every surface after a state-changing fixture step before observing it | A stale client view is a test artifact; reporting it as product behavior misleads the dev |
| MUST resolve any contradiction between your own observations with a clean re-run before drafting | Picking the observation that fits the verdict is how a wrong repro path ships |
| MUST include Expected vs Actual as implementable facts + a verbatim quote of the failing expected-result line | "Doesn't match the spec" is not actionable; the dev asks which line |
| MUST include a resolution-options table with a named owner per option whenever actual ≠ expected but the reported symptom is fixed | Otherwise the reader must ask "so what do I change, and who decides?" |
| MUST NOT edit the ticket's expected-result field to match observed behavior | The spec owner decides; QA reports the conflict |
| MUST pass the §5 dev-question gate before the FIRST post | The gate exists so the answers land in the report instead of in a chat round-trip |
| MUST re-verify before answering a question that arrives after posting, then fold the answer into the report | Answering from memory published a wrong claim once already |
| MUST correct a wrong published statement in-place **and** in the thread where it was given | People reply to the wrong version; a silent edit makes the thread unreadable |
