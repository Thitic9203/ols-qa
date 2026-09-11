# CatchAI Reference

Audit dimensions, evidence standard, severity and verdict definitions, coverage matrix, the pre-delivery adversarial pass, and the report template. Load when running an audit; the discipline rules live in SKILL.md.

## Review targets and their governing source

| Target | What to audit | Governing source |
|---|---|---|
| Your own prior work | Files written, commands run, numbers quoted, conclusions asserted | The file on disk, the real command output, the ticket, the original request |
| Document / deliverable | Facts, figures, structure, terminology, completeness, internal consistency | The system it describes, the data it cites, sibling documents, the house convention |
| System / feature under test | Behaviour, UI, API responses, data, error paths, non-functional bars | Spec, Figma, acceptance criteria, OpenAPI/Swagger, DB schema, design tokens |
| Test artifacts | Test cases, coverage, assertions, CI gates | The requirement each case traces to; the run's real output |

A source *governs* a claim only when it defines what that claim should be. A file timestamp does not govern a "generated on" line. A sibling page does not govern this page's numbers. Your own earlier message never governs anything.

## Evidence standard

Every reported item carries all six, or it is not reported:

- **Expected** — the required value or behaviour, quoted verbatim, **with its governing source** (`Figma: <frame>`, `AC-3`, `swagger:/v1/users`, `path:line`), confirmed current (not superseded — Iron Law).
- **Actual** — what was observed, quoted verbatim, with where (`path:line`, URL, endpoint, command).
- **Reproduce** — the exact steps, command, or request that shows it again. **When the target is reachable through more than one entry point** (direct route, in-app navigation, deep link, API vs UI), this becomes a repro matrix — one row per entry point actually exercised, untried paths marked `not tested`, never inferred from another row ([defect-report-completeness.md](../../references/defect-report-completeness.md) §2).
- **Environment** — branch/commit, environment, browser/viewport, data set — whenever the result can differ by any of them.
- **Impact** — who or what breaks, concretely.
- **Severity because** — the Severity-table row the finding matches, in the row's own words, so a second reviewer can re-derive the level from Impact and the table instead of taking the label on trust.

**When actual is a deliberate change and the written expected simply was not updated to match** — the two-option resolution table replaces a bare Defect: one row for "the implemented behaviour is what's intended" (spec owner decides, source gets updated, no code change), one row for "the written expected stands" (dev changes the named surface). Name the exact surface to change and the parts that must not change; never edit the expected side yourself ([defect-report-completeness.md](../../references/defect-report-completeness.md) §4).

## Audit dimensions

| Dimension | What to look for |
|---|---|
| Correctness of facts and numbers | Figures, dates, versions, paths, identifiers, calculations, quoted output that disagree with the governing source |
| Spec conformance | Labels, copy, field names, states, validation, flows — character-exact, including whitespace and punctuation |
| Completeness | Requested items not delivered; required caveats omitted; steps silently skipped; scope quietly narrowed |
| Coverage gaps | Requirements with no matching check; untested error paths, boundaries, permissions, empty and max states |
| Consistency | Statements conflicting with each other, with the code, with sibling documents, or with earlier established facts; terminology drift |
| Evidence and assumptions | Claims of "passing", "safe", "deployed", "verified" with nothing behind them |
| Data integrity | Rounding, totals, aggregation windows, timezone and locale, sorting and paging that change the answer |
| Non-functional bars | Accessibility, responsive behaviour, contrast, touch targets, performance budgets, security boundaries — whenever the work touches an interface |
| Regression risk | What else consumes the changed code, field, prop, route, or token — and whether that path was checked |
| Document quality | Structure matching sibling pages, heading hierarchy, unresolved placeholders, dead links, stale figures, mixed conventions |

## Coverage matrix

Build this before writing the report. Judging correctness is only half the audit.

| Requirement / area | Checked by | Level | Gap |
|---|---|---|---|
| `<requirement or path>` | `<test, command, manual check, or "none">` | unit / integration / E2E / manual / none | `<what nothing covers>` |

Weight depth by risk: business-critical paths, error handling, boundaries, security boundaries, and data integrity earn real coverage; trivial accessors, framework code, and one-off scripts do not. Every area at level **none** is a coverage gap — reported separately from defects, because a gap is missing information, not a failure.

## Coverage reconciliation (fail-closed, before the report is written)

Modelled on the AC/EC coverage gate other Helix workflows already run ([qa-evidence-gates.md](../../references/qa-evidence-gates.md) § *AC/EC & bug-detail coverage*): `enumerated items from Procedure step 2 == items carrying a classification (Defect / Question / checked-clean / coverage gap)`. Reconcile the count before writing anything:

- Every enumerated id maps to **exactly one** classification. An id with **no** classification is not "probably clean" — it is an incomplete audit.
- A compound claim ("the report is accurate, complete, and on-brand") splits into one checkable item per clause — never one classification covering three claims it only checked one of.
- If the count does not reconcile, the audit is **not done**: go back, classify the missing id, then re-check the count. Do not write the report around the gap.
- The only id allowed off the list is one explicitly declared out of scope at step 1 — visible in the report's Scope line, never silently dropped.

## Severity

| Severity | Meaning |
|---|---|
| Blocker | Blocks release or makes the deliverable unusable; data loss, security exposure, broken primary flow |
| Major | Core behaviour or a stated requirement is wrong; a correct-looking number is actually wrong |
| Minor | Real but contained — cosmetic drift, wording, non-blocking inconsistency |
| Question | Expected or actual side unconfirmed; needs the spec owner or missing access |

A level the reader cannot re-derive from this table and the Impact line is a contested finding waiting to happen — the `Severity because` line in the Evidence standard is what closes it; a bare `[Major]` is a claim about the finding with nothing behind it.

An **unsourced claim** is a defect in its own right when the deliverable declares where its content comes from — the finding is "this line is traceable to nothing", severity Major when the claim is load-bearing and Minor when it is incidental. Its correction is always "cite the source or remove the line". Never pair it with an asserted true value you could not observe; that value is a separate Question.

## Verdict

| Verdict | When |
|---|---|
| PASSED | Every checked item matched its governing source, and no coverage gap is Blocker or Major |
| FAILED | At least one Blocker or Major defect confirmed, or a result that changes between identical runs |
| BLOCKED | The expected side could not be confirmed for a material part of the scope |
| No issue found | Checks ran, nothing survived verification — not the same as "did not check" |

## Remediation and prevention

Every defect gets two answers: what fixes this instance, and what stops it from coming back. Both are sourced.

### Root cause before fix

Ask "why does this happen?" until the answer stops moving. Stop at the layer that owns the behaviour, not the layer where it surfaced. Follow the full sweep in [root-cause-investigation.md](../../references/root-cause-investigation.md) — invoke a real debugging skill first (`superpowers:systematic-debugging` when available), walk the boundary evidence, and land on exactly one confidence label:

| Label | Allowed only when | Written as |
|---|---|---|
| **Confirmed** | Reproduced, an artifact shows the mechanism, the falsifying check was run and did not falsify | The cause, plainly, + the artifact |
| **Suspected** | An artifact is consistent with the cause, but the isolating check was not run | The cause, labelled `Suspected`, + the exact check that would confirm it |
| **Unknown — not investigated** | The boundary was not reachable — no access, no VPN, no permission | Say so, name what is needed and from whom |

A cause with no label, or a hedge (`probably`, `น่าจะ`, `likely`, `seems to`, `cache issue`, `environment issue`) standing in for one, does not go in the report — it is not yet an investigation.

| Fix aimed at | Example | Verdict |
|---|---|---|
| The symptom | Deduplicate the list in the UI component | Rejected — the duplicate rows still exist |
| The place it surfaced | Round the number on the report line | Rejected — every other consumer stays wrong |
| The owning layer | Fix the JOIN that multiplies rows | Accepted |

When the cause cannot be reached — not reproducible, no access, external system — label it `Unknown — not investigated`, say what is needed, and recommend the instrumentation that would catch it next time. An unreached cause is a Question, never a guessed fix.

### Blast radius (required alongside every fix)

Name every other consumer of the changed code, field, prop, route, or token, and state whether each was actually checked — the Regression-risk audit dimension, made concrete per defect:

```
Blast radius:
- <consumer 1> — checked: <result, or "not checked — <why>">
- <consumer 2> — checked: <result, or "not checked — <why>">
```

An empty blast radius for a shared piece of code is not "no other consumers" — it is an unchecked claim. Say `none found — searched <how>` when the search was actually done.

### Prevention layers

Pick the cheapest layer that makes recurrence impossible, not merely unlikely. Higher in this table is stronger.

| Layer | Makes recurrence | Use when |
|---|---|---|
| Type or schema constraint | Impossible to express | The wrong state can be modelled away |
| Database constraint / migration | Impossible to store | Data integrity, uniqueness, referential rules |
| Lint or static rule | Impossible to merge | The mistake has a syntactic signature |
| Regression test | Caught before merge | Behaviour can be asserted — must fail without the fix |
| CI gate | Caught before deploy | Coverage, contract, budget, or conformance thresholds |
| Runtime validation at the boundary | Caught before damage | Input from users, external APIs, files, config |
| Monitoring or alert | Caught after the fact | Nothing earlier can observe it |
| Documentation or convention note | Relies on people remembering | Nothing above applies — state that this is the weakest layer |

A finding closed with only a documentation note must say so plainly: recurrence is not prevented, only signposted.

### Citation rules

1. **Open the source in this session.** A citation you did not read is fabrication.
2. **Quote the sentence that carries the rule**, not a paraphrase of the page's title.
3. **Record version and date** — "React 19.2 docs, accessed 2026-09-10". Behaviour changes between versions; an unversioned citation is not usable.
4. **Prefer the source that governs the claim** over the one that merely mentions it: the language spec over a blog, the framework's own docs over a Stack Overflow answer, the project's own convention file over a general standard.
5. **When nothing governs it, label it `Judgment`** and state the trade-off. Judgment is legitimate; judgment disguised as a standard is not.

### Standard source registry

Match the claim to the authority that actually defines it.

| Domain | Authority to cite |
|---|---|
| Web accessibility | W3C WCAG success criteria; WAI-ARIA Authoring Practices |
| Web platform behaviour | The relevant W3C/WHATWG spec; MDN for practical reference |
| HTTP, URI, JSON, auth protocols | The IETF RFC that defines it; OAuth/OIDC specifications |
| Application security | OWASP Top 10, OWASP ASVS, OWASP cheat sheets; CWE for weakness classification |
| A library or framework | That project's own official documentation, at the version in use, plus its changelog and migration guide |
| A language feature | The language specification or the official language reference |
| An API you consume | Its OpenAPI/Swagger document or official API reference |
| Data shape and constraints | The DB schema, migration files, or the contract in the repository |
| Testing terminology and levels | ISTQB glossary; the test framework's own documentation |
| Product behaviour | The spec, acceptance criteria, Figma frame, or ticket — the same governing sources used for findings |
| Repository convention | The project's own CLAUDE.md, AGENTS.md, ADRs, style guide, or lint configuration |

### Remediation entry template

```
Fix (Recommendation | Judgment)
- Root cause: <the owning layer and why it produces this> — [Confirmed | Suspected | Unknown — not investigated]
- Change: <the concrete edit — a before/after diff or exact snippet when the fix is code;
           the exact content/configuration change otherwise. A prose description alone is not this field.>
- Blast radius:
  - <other consumer of the changed code/field/route/token> — checked: <result, or "not checked — <why>">
- Sources:
  - <title>, <exact section or heading> — <URL> (version <x>, accessed <YYYY-MM-DD>)
    > "<quoted sentence that carries the rule>"
- Prevention: <layer from the table> — <the specific test, constraint, rule, or gate>
- Verification: <command actually run in this session, its actual output pasted verbatim, or the
                 re-read destination showing the fix — a plan for what verification *would* show is
                 not this field (qa-evidence-gates.md: IDENTIFY → RUN → READ → MATCH → CLAIM)>
- Trade-off: <what this costs; required when labelled Judgment>
```

## Pre-delivery adversarial pass (mandatory, before the report is shown)

Modelled on the Pre-delivery completeness gate in [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — the same bar: *"judge the deliverable as if a second QA — or another AI given the ticket, the deliverable and nothing else — has been told: find where this was cut short."* This is the step that lets the report survive a second opinion without a revision round.

Run this after the fixes are drafted and before the report is handed over (Procedure step 10). Fail-closed: any layer red means the report is not ready, no matter how complete it feels.

| # | Layer | Passes only when |
|---|---|---|
| 1 | Recount the scope | Re-open the enumerated list from step 2 **now, this pass** — not the list as it existed when the audit started. Every id is still there. |
| 2 | Reconciliation is real | The Coverage reconciliation count actually reconciles — not "close enough, the rest is minor". |
| 3 | Every claim points at something | Every sentence in the draft names the id, file, path, or line behind it. A claim you cannot point at is deleted or demoted to a Question — never smoothed into the narrative. |
| 4 | Every citation was opened this session | Not a remembered URL, not a title without the quoted sentence next to it. |
| 5 | Every root cause carries its label | `Confirmed` / `Suspected` / `Unknown — not investigated` on every cause statement — no bare cause sentences. |
| 6 | Every fix shows the real change and real verification | An actual diff/snippet and actual command output — not a description of what the fix or the check would show. |
| 7 | The four questions below are answered, by pointing at the report | One unanswerable question = this layer is red. |

### The four questions

Answer each by pointing at a line in the draft, not from memory of doing the work:

1. Pick the finding you are **least** sure about. Which source proves it — and did you actually open that source in this session?
2. Pick the fix with the **thinnest** verification. Is the actual command output there, or a description of what should happen?
3. If a reader — a developer, the user, or a different AI — had only this report and the cited sources, could they reproduce every verdict and apply every fix without asking you one question?
4. What did you **not** check, and does the report say so plainly in a Coverage gap or Question — or does that gap exist only in your head right now?

Fix the report and re-run the pass on any "no" — never plan to answer the gap in chat instead of in the report; that is the exact failure [defect-report-completeness.md](../../references/defect-report-completeness.md) exists to close.

## Report template

```
Verdict: PASSED | FAILED | BLOCKED | No issue found
Scope: <what was audited> · Out of scope: <what was not>
Coverage reconciliation: <n> items enumerated == <n> items classified

## Defects
### 1. [Blocker] <short title>
- Expected: "<verbatim>" (source: <Figma frame / AC-3 / path:line>, confirmed current)
- Actual:   "<verbatim>" (<path:line / URL / endpoint>)
- Reproduce: <steps or command — a matrix per entry point when more than one applies>
- Environment: <branch/commit, env, viewport>
- Impact: <who or what breaks>
- Severity because: <the Severity-table row this matches, in the row's words>
- Correction: <the fix, or the corrected statement>

## Questions (expected or actual side unconfirmed)
- <item> — need <source or access> to confirm <exact point>

## Coverage gaps
- <requirement> — no check at any level

## Remediation
### For defect 1
- Root cause: <owning layer> — [Confirmed | Suspected | Unknown — not investigated]
- Change: <the actual edit — diff/snippet, not a description>
- Blast radius: <other consumer> — checked: <result>
- Sources: <title, section — URL (version, accessed date)> + quoted rule
- Prevention: <layer> — <test, constraint, rule, or gate>
- Verification: <command actually run + its actual output>

## Checked, no issue found
- <item> — verified against <source>

## Second-opinion check
- Pre-delivery adversarial pass: PASSED — the four questions above are answered by pointing at this report, not from memory.
```

When nothing survives verification, the report still states it explicitly: `No issue found.` followed by what was checked and against which source. The `Coverage reconciliation` and `Second-opinion check` lines are never omitted, even then — they are what tells the next reader the audit was complete, not merely quiet.
