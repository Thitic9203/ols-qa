# postmortem-guard

The executable half of the post-mortem rule: **every mistake ends in a report, and no mistake
happens twice.** The rule itself is in [`CLAUDE.md`](../../CLAUDE.md); the workflow and the
ten-layer table are in [`docs/post-mortem/README.md`](../../docs/post-mortem/README.md). This
directory is what makes those two enforceable instead of remembered.

```bash
node tools/postmortem-guard/check.js              # validate reports, ledger, index, numbering
node tools/postmortem-guard/check.js --debt       # print open debt only
node tools/postmortem-guard/postmortem_rules.test.js
```

| file | what it is |
|------|------------|
| `postmortem_rules.js` | **the rules — single source of truth.** Pure functions, no filesystem. The markdown links here rather than restating, so the two cannot drift |
| `check.js` | the gate. Exit `0` clean · `1` findings · `2` could not run — and **could not run is never a pass** |
| `postmortem_rules.test.js` | pins every rule, and pins that the other nine layers are still wired |

## What the gate refuses

- a filename that is not `YYYYMMDD-post-mortem-report-N.md`, or a title whose `#N` disagrees with it
- a report missing any of the 8 metadata lines, the 11 sections, the **5 Whys**, or the
  **กฎที่เพิ่มจากเหตุนี้** line — a report that changes no rule cannot stop a repeat
- a report still carrying template text, filed as if it were finished
- a ledger status outside `OPEN` / `DONE` / `WONTFIX`; a `DONE` row naming no report; an `OPEN` row
  naming one; a `WONTFIX` with no owner reason and date
- a `DONE` row pointing at a report that does not exist, two rows claiming one report, a report with
  no row pointing at it, a report missing from the index, an index entry with no file
- numbering that is not `1..N` — a gap means a report was deleted
- `**ผิดซ้ำจาก:** #N` pointing at a report that does not exist

## Two deliberate design choices

**Open debt is a notice here, not a finding.** The right first action after noticing a mistake is to
commit the `OPEN` ledger row; a checker that failed on it would block that exact commit, punishing
the behaviour the system exists to encourage. It would also hold `main` red for as long as a report
is legitimately being written, which is how a red build gets trained into background noise. Blocking
on debt is the pre-commit gate's job (`scripts/hooks/pre-commit`), where it stops new work without
touching CI.

**The reminder is bash and the gate is Node, on purpose.** Layers 3–6 all shell out to
`.claude/hooks/postmortem-debt.sh`; this gate is JavaScript. Two layers sharing a runtime fail
together, and the whole point of ten layers is that they do not.

## No override exists

There is no flag, no environment variable, no `--force`. A test asserts that none appears — an
override that exists is an override that eventually gets used, and this repo has already learned
that once (`tools/name-guard/`). The two ways past an open row both leave a record in the history:
write the report, or have the owner mark it `WONTFIX` with a reason and a date.
