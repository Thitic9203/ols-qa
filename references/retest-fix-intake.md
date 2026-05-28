# Retest — fix claim vs verification plan

Run **after Step 2 (fetch ticket)**, **before Step 3 (test execution)**. English only.

## Collect from Jira

| Source | Extract |
|--------|---------|
| Latest dev comment(s) | What they claim was fixed |
| Description / custom fields | Original repro, expected, environment |
| Linked issues | PR keys, parent story, duplicate links |
| Attachments | Screenshots, logs (note filenames only in summary) |

If the environment exposes **linked PRs** (GitHub/GitLab/Bitbucket), fetch or ask user for PR title + merge status — **do not** claim “PR merged” without tool output.

## Post verification plan

```text
━━━ Retest plan ━━━
Bug: {KEY} — {one-line title}
Dev claimed fix:
  • {bullet from dev comment}
  • …
We will verify:
  • {observable check 1 — maps to claimed fix}
  • {observable check 2}
Out of scope this retest: {list}
Bug type: API | FE — comment format locked to {v2|v3}
Linked: {PR-123 or none}
━━━━━━━━━━━━━━━━━━
```

**Wait** if environment URL or credentials are still missing — combine with Step 1 config.

## Rules

| Rule | Because |
|------|---------|
| MUST separate “dev said” vs “we will check” | Avoid retesting the comment instead of the product |
| MUST NOT mark PASSED until tests + evidence | False retest closes bugs |
| FE bugs: plan screenshot points before run | v2 wiki needs attachments |

Then continue the retest workflow (Swagger compare for API, browser for FE).
