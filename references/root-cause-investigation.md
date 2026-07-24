# Root-cause investigation — mandatory, evidence-only

Applies to **every** QA result that is not a clean PASSED, and to **every sentence anywhere that
states or implies a cause** — chat, Jira comment, sheet cell, notify message, session record.

A verdict says *what* happened. This document governs *why*, and it is not optional: the reader of a
QA report acts on the cause, so an unverified cause is more expensive than no cause at all.

```
NO CAUSE STATEMENT WITHOUT A CAPTURED ARTIFACT THAT SHOWS IT
NO VERDICT PUBLISHED BEFORE THE INVESTIGATION BLOCK IS WRITTEN
```

Related: [qa-debug-discipline.md](qa-debug-discipline.md) (flaky/environment triage),
[defect-report-completeness.md](defect-report-completeness.md) (what the report must contain),
[agent-rationalizations.md](agent-rationalizations.md).

---

## 0. Invoke the best available debugging skill FIRST — do not improvise

Before the first hypothesis, load a real debugging skill and follow it. Announce which one:

> `Using **{skill}** to find the root cause of {symptom}.`

Priority order — take the first one available in the session:

| # | Skill | Why |
|---|-------|-----|
| 1 | **`superpowers:systematic-debugging`** | Iron law "no fixes without root-cause investigation first"; four phases, boundary-evidence pattern, rationalization table |
| 2 | `debugging-tools:debugging` · `fullstack-dev-skills:debugging-wizard` | Equivalent systematic process when 1 is unavailable |
| 3 | [qa-debug-discipline.md](qa-debug-discipline.md) | In-repo fallback — reproduce → bound → falsifiable hypothesis → minimal check |

**QA scope override:** follow that skill's Phases 1–3 (investigate, compare, hypothesise, test).
Do **not** run its Phase 4 — QA diagnoses and hands off; QA does not patch product code unless the
user explicitly asks. Test/fixture/selector/environment repairs on our own side are in scope.

Record the skill used in the investigation block (§5) — "which process did you run" is a question
readers ask, and "I reasoned about it" is not an answer.

---

## 1. Phase 1 — Evidence sweep across every boundary (complete it; do not stop at the first hit)

A QA failure travels through layers. Record the **observed value at each boundary**, in order, even
after one looks wrong — the first anomaly is often downstream of the real one.

| # | Boundary | What to capture (verbatim, not summarised) |
|---|----------|--------------------------------------------|
| 1 | **Symptom surface** | screenshot + the exact on-screen text/state, URL, timestamp |
| 2 | **Browser console** | full error text and stack, or `none` |
| 3 | **Network** | the request that backs the surface: method, URL, status, request body, response body (trimmed to the relevant keys, never paraphrased) |
| 4 | **Auth / session / role** | who is logged in, which role/permission the API believes it is serving (session or `me` endpoint), token/cookie present |
| 5 | **Server-side truth** | call the API directly for the same record — does the backend already hold the expected value? Separates render bug from data bug |
| 6 | **Deployed build** | is the behaviour even shipped? Grep the deployed bundle for the feature's own UI strings / route / param; probe whether the endpoint accepts the parameter in question. "Not built" and "built but not deployed" are answerable, not hedgeable |
| 7 | **Fixture / data state** | the record's real state at observation time (status, owner, flags) read back from the API — not from the screen you were looking at |
| 8 | **Environment** | env name + URL, VPN/network reachability, feature flag / config value, deploy version or build id, recent changes |

**Rules**

- Every row is either an artifact or the word `not checked` — never a guess and never blank.
- Capture the artifact **at the moment of failure**, not reconstructed afterwards.
- Timing first: after any state-changing step, hard-reload before you record a boundary
  ([defect-report-completeness.md](defect-report-completeness.md) §3a). A stale client makes rows 1–3
  lie.
- One boundary changed at a time. Never change two things and read one result.

---

## 2. Phase 2 — Compare against something that works

An isolated failure has no signal. Find the nearest working comparison and list **every** difference:

- the same action on **another record** (different status / owner / age / type),
- the same action as **another role**,
- the same action via **another entry point** (direct route vs in-app path),
- the same action in **another environment** or on an earlier build,
- a **sibling feature** that shares the endpoint or component.

Write the differences out. "That can't matter" is not an allowed filter — it is what hides the cause.
If nothing comparable works, say so; that itself narrows the cause.

---

## 3. Phase 3 — One falsifiable hypothesis at a time

```text
H1: {specific mechanism, naming the boundary} — falsify by: {one check} — result: {artifact}
```

- **Specific, not a category.** "Cache issue" / "environment issue" / "timing" are not hypotheses.
  "The list endpoint returns `status=DRAFT` for this record, so the badge never renders" is.
- **One check per hypothesis**, the smallest one that can kill it. Run it. Paste the output.
- A falsified hypothesis is **kept in the record** with its artifact — the reader needs to know what
  was already ruled out.
- Never bundle two changes into one check; the result becomes unattributable.
- Stop after the check that confirms, or after the checks that leave you with `Unknown` (§4).

---

## 4. Confidence labels — the anti-fabrication rule

Every cause statement carries exactly one label. This is the whole point of the document.

| Label | Allowed only when | How it must be written |
|-------|-------------------|------------------------|
| **Confirmed** | reproduced, **and** an artifact shows the mechanism, **and** the falsifying check was run and did not falsify | state the cause plainly + cite the artifact |
| **Suspected** | an artifact is consistent with the cause, but the isolating check was **not** run | state the cause, label it `Suspected`, name **the exact check that would confirm it** and why it was not run |
| **Unknown — not investigated** | the boundary was not reachable (no access, no VPN, no permission, no log) | say so; name what is needed and from whom |

**Never** publish a `Suspected` cause with `Confirmed` wording. Never drop the label when the text is
copied into a Jira comment, sheet cell, or notify message — the label travels with the sentence.

### Banned unless a label + artifact is attached

`น่าจะ` · `คาดว่า` · `เข้าใจว่า` · `probably` · `likely` · `seems to` · `appears to be caused by` ·
`must be` · `just a cache issue` · `environment issue` · `flaky` · `intermittent` · `race condition`
· `it works on my side`.

Each of these is a cause claim wearing a hedge. Either it has an artifact and a label, or it is not
written down at all.

### Also banned

- Restating the symptom as the cause ("it fails because the button does not work").
- Naming a cause you inferred from a **different** record, role, run, or entry point.
- Reporting an observation taken from a view that was open **before** a state change.
- Blaming the environment, the network, or the browser without a row 8 artifact.
- Answering a "why" question from memory of an earlier run — re-run the surface first.

---

## 5. Output — the investigation block (goes **in the report**, not only in chat)

```text
Root cause: {one sentence} — [Confirmed | Suspected | Unknown — not investigated]
Investigated with: {skill invoked}
Boundary evidence:
  1 surface    — {observed}                        {evidence file}
  2 console    — {error text | none}               {evidence file}
  3 network    — {METHOD path → status}, {key fields from body}
  4 auth/role  — {who / what the API served}
  5 server API — {direct call result}
  6 build      — {shipped? bundle/route/param probe result}
  7 fixture    — {record state read back}
  8 env        — {env, version/build id, flag, VPN}
Ruled out: H{n} {hypothesis} — {check} → {result}
Confirms it: {the single check that would move Suspected → Confirmed}   (Suspected only)
Needed to continue: {access / log / person}                              (Unknown only)
```

Keep it to the lines that carry a value; a boundary that was `not checked` is written as
`not checked`, never deleted.

---

## 6. When to stop

Stop when **one** of these is true, and say which:

1. **Confirmed** — mechanism shown by an artifact, falsifying check run.
2. **Suspected, blocked** — the isolating check needs access/permission/data QA does not have. Name
   the check and the owner.
3. **Unknown, bounded** — the sweep is complete, every boundary is recorded, and no artifact points
   anywhere. Report the sweep; an empty sweep is a real result, an unwritten one is not.

Running out of patience is not an exit condition. Neither is "the verdict is already FAILED, so the
cause does not change anything" — the cause is what the reader acts on.

---

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST invoke a real debugging skill (`superpowers:systematic-debugging` first) before the first hypothesis, and name it in the report | Improvised debugging is where guessing enters; the process exists and is faster |
| MUST complete the §1 boundary sweep for every non-PASSED item, marking unchecked boundaries `not checked` | The first anomaly is often downstream of the real one; a blank row reads as "fine" |
| MUST attach a captured artifact to every cause statement | A cause without an artifact is fabrication, however plausible it sounds |
| MUST label every cause `Confirmed` / `Suspected` / `Unknown — not investigated`, and carry the label into every place the sentence is copied | `Suspected` read as `Confirmed` sends a developer to the wrong layer |
| MUST name the exact check that would confirm a `Suspected` cause, and why it was not run | Otherwise the reader cannot finish the investigation either |
| MUST keep falsified hypotheses in the record with their artifacts | The next reader needs what was already ruled out |
| MUST NOT use a hedge word (`probably`, `น่าจะ`, `flaky`, `cache issue`, …) as a cause | Hedged guessing is still guessing, and it is published as QA's finding |
| MUST NOT infer a cause from a different record, role, run, entry point, or from a pre-state-change view | Learned repeatedly: the transferred observation is the artifact, not the product's behaviour |
| MUST NOT restate the symptom as the cause | It reads as an answer and stops anyone else from investigating |
| MUST NOT patch product code — QA diagnoses and hands off the isolated boundary + evidence | Fixing the product is dev's decision, not QA's |
| MUST re-run the surface before answering any "why" question that arrives after publishing | Answering from memory is how a wrong cause reached a developer |
