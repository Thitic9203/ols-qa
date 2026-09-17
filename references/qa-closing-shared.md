# Shared QA closing checklist (all Helix workflows)

Every skill's QA closing section MUST include these items **plus** skill-specific checks.

## Doubt and fix-verify

Follow [skill-rules-style.md — doubt and fix-verify](skill-rules-style.md#qa-closing-doubt-and-fix-verify).

1. **Assume the first draft/output is wrong** — name which phase catches it.
2. Complete **skill-specific** checkboxes (3–5 items in each SKILL.md).
3. [verify-closing-checklist.md](verify-closing-checklist.md) — workflow-specific section.
4. [session-closing.md](session-closing.md) — artifact index, next workflow, handoff, `Verdict:`.

## Shared checklist

- [ ] User-facing text is **English only**.
- [ ] No success claim without **tool output** and **destination verification**.
- [ ] Gates were not skipped (approval / confirm / refuse when inputs missing).
- [ ] If Jira comment posted: **post-publish review passed** ([jira-comment-post-review.md](jira-comment-post-review.md)) — no literal `<br>`/HTML tags, numbered items on separate lines, CSV/Excel attached.
- [ ] `Verdict:` or `Verified:` line with counts in close-out block.

## Cross-ticket conflict check

**Applies to testing-ticket and retest-bug only** — every run, whatever the verdict (PASSED included)
and whatever the tested ticket's type (story, task, improvement, bug). Run it at the workflow's QA
closing: after every verdict is final, before any remaining close-out action (retest-bug: before the
Step 8 transition and the Step 9 notify).

**Read-only.** This step never comments, links, transitions, edits, or creates a ticket. A conflict
that deserves a new ticket is proposed in chat and waits for an explicit go-ahead.

1. **Search the tested ticket's whole project** (Jira: `project = {PROJECT_KEY}`) — every issue type,
   every status, **Done included** (a Done ticket is often the one that changed the behavior). Run
   every layer and record its query and hit count:
   1. Direct relations — issue links in both directions, parent/epic, subtasks.
   2. Siblings under the same parent epic.
   3. Same surface — the tested ticket's component / feature / summary tags, project-wide.
   4. Same behavior — 2–4 distinctive terms from its expected result or acceptance criteria (UI
      label, route, field, status name), full-text, project-wide.
   5. Mentions — any issue whose text or comments cite the tested key.

   Run the searches so only a derived candidate list (key · type · status · summary · updated)
   reaches the conversation — never raw issue payloads.
2. **Open every candidate kept for comparison** — its fields and every comment. A summary alone is
   not evidence. Classify only what the ticket itself shows:

   | Conflict kind | Means |
   |---|---|
   | Contradicting expected | its AC / expected result specifies different behavior for the surface this run verified |
   | Superseded expected | a later ticket intentionally changed the behavior the tested ticket expects |
   | Duplicate | the same defect or requirement is tracked twice |
   | Open dependency | a ticket this one depends on, or blocks, is not Done or was reopened |
   | Regression risk | an open or recently shipped ticket changes the same surface after this verification |

   A spec that is unclear is a question for its owner, never a defect.
3. **Report in chat — mandatory, also when nothing is found.** One table:
   `# · Ticket · Type · Status · Conflict kind · What conflicts (quote the field or comment) · Effect on this verdict`.
   Every ticket cell is a clickable link `[{ISSUE_KEY}](https://{JIRA_DOMAIN}/browse/{ISSUE_KEY})` —
   resolve `{JIRA_DOMAIN}` from project config at runtime, never a bare key. Open the report with the
   tested ticket (link + verdict). Nothing found → say so with numbers: one row per search layer with
   its query and hit count, plus how many candidates were opened. A "no conflict" line without counts
   is not allowed.
4. **Ask, then wait.** One question, through the host's question UI when it has one: **Investigate
   further** or **Close out now**. Put the recommended option first — *Investigate further* when any
   conflict row exists, otherwise *Close out now*. Nothing after this step runs before the answer.
   - *Investigate further* → resolve each row (the ticket and all its comments, the prior regression
     result, the code when available), correct any already-published result in place through the
     workflow's after-publish step, then run this check again.
   - *Close out now* → continue with the workflow's remaining close-out steps.
5. **Unattended / bot mode** — nobody to ask: put the same table in the run's report and never block
   on the question. A verified *Contradicting* or *Superseded* row follows the existing challenge-gate
   rule (conflicting expected → BLOCKED + a remark naming who decides).
