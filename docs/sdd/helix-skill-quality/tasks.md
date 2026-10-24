# Tasks — Helix skill quality round 1

| # | Task | Rule | Test that fails first | Done when |
|---|---|---|---|---|
| T1 | helix CI accepts `proactive_triggers` top-level OR under `metadata:`; fails when absent | R2 | run CI script on a fixture SKILL.md with the key under metadata → currently fails | CI green on both forms, red on missing |
| T2 | Move key under `metadata:` in all 11 ols-qa SKILL.md | R1 | `quick_validate.py` on each helix skill → exit 1 today | quick_validate exit 0 for all 8 helix skills; ols-qa suites green |
| T3 | Update 3 authoring docs in ols-qa and helix | R3 | grep shows top-level form in docs | docs show metadata form |
| T4 | New `tools/skill-text-guard` test: no credential solicitation, no `OLS-\d+` in shipped files | R5, R11 | known-answer: flags `intake-one-pager.md:26` and `execute-and-evidence.md:75`; does not flag "Never ask for a password" | test red before T5/T6, green after |
| T5 | Remove credential asks (retest-bug#0, testing-ticket#0) | R4 | T4 | T4 green for credentials |
| T6 | Replace real ticket keys in shipped files with `{ISSUE_KEY}` | R11 | T4 | T4 green for keys |
| T7 | testing-ticket confirm-before-run in all entry files + contract §2 exception | R6 | grep "without waiting" in testing-ticket WORKFLOW Phase C | one rule everywhere; retest unchanged |
| T8 | dependencies.md tc-review row = every run | R7 | grep line 63 | wording matches SKILL Step 5 |
| T9 | helix router: single routing source, user-language menu, announce route | R8, R10 | grep `8\`, other` in commands/helix.md | menu item 8 identical in all files |
| T10 | retest evidence rule unified | R8 | grep the 3 conflicting lines | one rule |
| T11 | tc-fe-prep examples + prerequisites aligned; subagent fallback; BLOCKED location | R8, R9 | grep `TC_` in jira-formatting.md | reviewer confirms |
| T12 | create-bug matrix vocabulary, template blocks, Phase E before C | R8, R9 | grep "Critical" in intake A3 | checklist order = section order |
| T13 | tc-api-prep REST fallback, delivery-specific checklist, round-2 failure | R9 | grep G-verify items | reviewer confirms |
| T14 | testing-ticket no-AC/fetch-fail branch | R9 | — | reviewer confirms |
| T15 | Investigate tc-fe-prep effectiveness (systematic-debugging) | R10 | — | root cause + proposal reported to owner |
| T16 | Sync to helix, parity, tighten CI to metadata-only | R2, R12 | parity script | parity OK, helix CI green |
| T17 | Re-evaluate round after-1, paired comparison, republish scorecard | R12 | — | Done-when list in spec.md all true |
