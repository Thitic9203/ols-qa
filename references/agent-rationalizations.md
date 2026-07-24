# Agent rationalizations (Helix QA)

When you notice these thoughts, **stop** and follow the linked reference or skill.

## Jira and posting

| Rationalization | Correct action |
|-----------------|----------------|
| “MCP addComment returned 200” | Re-open issue in UI or GET — check truncation, ADF/wiki rendering |
| “Table is small, skip re-read” | Re-read anyway — formatting breaks are common |
| “User said post, skip draft approval” | Unless they explicitly waive approval, show draft first |
| “v3 will work for screenshots” | FE bugs: lock v2 wiki + attach before embed |

## Test execution

| Rationalization | Correct action |
|-----------------|----------------|
| “One scenario failed but overall pass” | Report per-scenario PASSED/FAILED; no aggregate pass |
| “VPN usually works” | Run [playwright-preflight.md](playwright-preflight.md) |
| “Trace is too big, skip” | Use [qa-debug-discipline.md](qa-debug-discipline.md) — sample failing request |
| “I'll increase timeout until green” | Find root cause — do not mask flake |

## Cause statements ([root-cause-investigation.md](root-cause-investigation.md))

| Rationalization | Correct action |
|-----------------|----------------|
| “It's obviously a cache/env issue” | Not a cause until a boundary artifact shows it — run the 8-boundary sweep |
| “Probably the same as the other record” | A cause inferred from another record/role/run is fabrication — re-run this one |
| “Verdict is FAILED anyway, cause won't change it” | The cause is what the reader acts on; the verdict is not the deliverable |
| “I'll write ‘likely caused by …’ to be safe” | A hedge is a cause claim wearing a disguise — label it `Suspected` + name the confirming check, or drop it |
| “I know why, no need to invoke a debugging skill” | Invoke `superpowers:systematic-debugging` first and name it — improvised reasoning is where guessing enters |
| “Boundary wasn't reachable, leave the row out” | Write `not checked` — a blank row reads as “fine” |
| “It's BLOCKED, so skip the investigation” | BLOCKED still records the sweep up to the blocking boundary + who can unblock it |

## Test cases

| Rationalization | Correct action |
|-----------------|----------------|
| “Row count = AC count, good enough” | Run AC/EC traceability — [ac-ec-coverage-review.md](../skills/deprecated/tc-fe-prep-workflow/references/ac-ec-coverage-review.md) |
| “Extra TCs are helpful” | Orphan TCs violate scope — remove or get user sign-off |
| “Swagger is enough, skip API spec” | Refuse Phase D until spec + Swagger per skill |

## Session and skills

| Rationalization | Correct action |
|-----------------|----------------|
| “I remember Helix from last chat” | Load workflow via command again; load workspace `*-guide.md` |
| “Menu is overhead” | Skip menu only when intent is explicit — [skill-invocation-discipline.md](skill-invocation-discipline.md) |
| “English is hard for user, use Thai in menu” | English only in chat — [user-communication.md](user-communication.md) |

## Completion pressure

| Rationalization | Correct action |
|-----------------|----------------|
| “Close ticket for user” | Only after user approves transition + evidence |
| “Partial post is good enough” | [qa-evidence-gates.md](qa-evidence-gates.md) — fix-verify max 2 rounds |
| “Handoff not needed” | Write [handoff-file-template.md](handoff-file-template.md) if long or blocked |
