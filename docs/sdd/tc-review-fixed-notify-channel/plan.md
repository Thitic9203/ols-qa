# Plan — TC review fixed notify channel

## Files

| File | Change | Rule |
|---|---|---|
| `skills/tc-review-workflow/SKILL.md` | Step 5 → mandatory send to the config channel; one thread question; checklist line; MUST/NEVER rows; description | R1–R4, R6, R7 |
| `commands/tc-review.md` | Same rule, short form | R1–R3 |
| `references/ols-project-guide.md` | New "TC review notify" section with `<TC_REVIEW_NOTIFY_CHANNEL>` placeholder | R2 |
| `~/.ols-qa-secrets/ols-secrets.md` (local, untracked) | Real guild/channel id + webhook file path | R2, R6 |
| `tools/ask-guard/ask_rules.js` | `FIXED_DESTINATION` rule checked before the search rule | R5 |
| `tools/ask-guard/check.js` | none needed if `decide()` already receives transcript lines | R5 |
| `tools/ask-guard/ask_rules.test.js` | Tests for R5 | R5 |
| `tools/ask-guard/README.md` | Document the new state | R5 |

## Design of the guard

- `WHICH_GROUP_RE`: `(กลุ่ม|ห้อง|แชนแนล|ช่อง|เซิร์ฟเวอร์|server|channel|guild)` followed (within a few chars) by `ไหน|อะไร`, or English `which (discord )?(channel|server|group|guild)` / `what (channel|server|group)`.
- `TC_REVIEW_RE` over question text: `tc[\s_-]*review|รีวิว\s*(เทส|test)\s*เคส|รีวิว\s*tc`.
- `tcReviewRan(lines)`: any transcript line whose `Skill` tool_use `input.skill` or a user `<command-name>` text contains `tc-review`.
- Fires when `WHICH_GROUP_RE` matches and (`TC_REVIEW_RE` matches or `tcReviewRan`). New state `fixed-destination`, decision deny, no override.

## Alternatives weighed

- Block every which-channel question: rejected — smoke/retest flows may still ask legitimately.
- Hard-code the channel in the skill: rejected — public repo (§5) and helix portability.

## What may break

- A false block on a thread question that also says "ห้องไหน". Mitigation: tests; the deny message says to ask only for the thread.
- No new cost; no other repo touched except the helix sync of the skill file after merge.

## Amendment 20/Oct/2026 — channel per project

- Guard: `FIXED_CHANNEL_PROJECTS = ['OLS']` (project keys only, no ids). Project read from a `<KEY>-<n>` ticket key in the question text, else the latest tc-review `Skill` input `args` / `<command-args>` in the transcript. Not found or not in the list → R5 does not fire.
- Skill Step 5: channel = the ticket project's config entry; missing → search history/memory → ask once for that project → record it.
