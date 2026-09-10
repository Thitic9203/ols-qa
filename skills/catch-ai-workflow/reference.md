# CatchAI Reference

Audit dimensions, evidence standard, severity and verdict definitions, coverage matrix, and the report template. Load when running an audit; the discipline rules live in SKILL.md.

## Review targets and their governing source

| Target | What to audit | Governing source |
|---|---|---|
| Your own prior work | Files written, commands run, numbers quoted, conclusions asserted | The file on disk, the real command output, the ticket, the original request |
| Document / deliverable | Facts, figures, structure, terminology, completeness, internal consistency | The system it describes, the data it cites, sibling documents, the house convention |
| System / feature under test | Behaviour, UI, API responses, data, error paths, non-functional bars | Spec, Figma, acceptance criteria, OpenAPI/Swagger, DB schema, design tokens |
| Test artifacts | Test cases, coverage, assertions, CI gates | The requirement each case traces to; the run's real output |

A source *governs* a claim only when it defines what that claim should be. A file timestamp does not govern a "generated on" line. A sibling page does not govern this page's numbers. Your own earlier message never governs anything.

## Evidence standard

Every reported item carries all five, or it is not reported:

- **Expected** — the required value or behaviour, quoted verbatim, **with its governing source** (`Figma: <frame>`, `AC-3`, `swagger:/v1/users`, `path:line`).
- **Actual** — what was observed, quoted verbatim, with where (`path:line`, URL, endpoint, command).
- **Reproduce** — the exact steps, command, or request that shows it again.
- **Environment** — branch/commit, environment, browser/viewport, data set — whenever the result can differ by any of them.
- **Impact** — who or what breaks, concretely.

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

## Severity

| Severity | Meaning |
|---|---|
| Blocker | Blocks release or makes the deliverable unusable; data loss, security exposure, broken primary flow |
| Major | Core behaviour or a stated requirement is wrong; a correct-looking number is actually wrong |
| Minor | Real but contained — cosmetic drift, wording, non-blocking inconsistency |
| Question | Expected or actual side unconfirmed; needs the spec owner or missing access |

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

Ask "why does this happen?" until the answer stops moving. Stop at the layer that owns the behaviour, not the layer where it surfaced.

| Fix aimed at | Example | Verdict |
|---|---|---|
| The symptom | Deduplicate the list in the UI component | Rejected — the duplicate rows still exist |
| The place it surfaced | Round the number on the report line | Rejected — every other consumer stays wrong |
| The owning layer | Fix the JOIN that multiplies rows | Accepted |

When the cause cannot be reached — not reproducible, no access, external system — say so and recommend the instrumentation that would catch it next time. An unreached cause is a Question, never a guessed fix.

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
- Root cause: <the owning layer and why it produces this>
- Change: <the concrete edit, file, or configuration>
- Sources:
  - <title>, <exact section or heading> — <URL> (version <x>, accessed <YYYY-MM-DD>)
    > "<quoted sentence that carries the rule>"
- Prevention: <layer from the table> — <the specific test, constraint, rule, or gate>
- Verification: <command or check that proves the fix, and its expected output>
- Trade-off: <what this costs; required when labelled Judgment>
```

## Report template

```
Verdict: PASSED | FAILED | BLOCKED | No issue found
Scope: <what was audited> · Out of scope: <what was not>

## Defects
### 1. [Blocker] <short title>
- Expected: "<verbatim>" (source: <Figma frame / AC-3 / path:line>)
- Actual:   "<verbatim>" (<path:line / URL / endpoint>)
- Reproduce: <steps or command>
- Environment: <branch/commit, env, viewport>
- Impact: <who or what breaks>
- Correction: <the fix, or the corrected statement>

## Questions (expected or actual side unconfirmed)
- <item> — need <source or access> to confirm <exact point>

## Coverage gaps
- <requirement> — no check at any level

## Remediation
### For defect 1
- Root cause: <owning layer>
- Change: <concrete edit>
- Sources: <title, section — URL (version, accessed date)> + quoted rule
- Prevention: <layer> — <test, constraint, rule, or gate>
- Verification: <command and expected output>

## Checked, no issue found
- <item> — verified against <source>
```

When nothing survives verification, the report still states it explicitly: `No issue found.` followed by what was checked and against which source.
