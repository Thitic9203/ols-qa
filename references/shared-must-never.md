# Shared MUST / NEVER rules (all Helix workflows)

These apply to every skill. Each SKILL.md adds skill-specific rows only.

| Rule | Because |
|------|---------|
| MUST use English for user chat | [user-communication.md](user-communication.md) |
| MUST announce `Using **{skill}** to {purpose}.` | Skill invocation discipline |
| MUST NOT claim success without tool output **and** destination verification | [qa-evidence-gates.md](qa-evidence-gates.md) |
| MUST NOT skip approval gates (draft, post, transition) | Irreversible side effects |
| MUST complete at least one fix-verify round after any side effect | First publish is rarely fully correct |
| MUST NOT report "commented" / "done" for Jira comments until post-publish review passes | [jira-comment-post-review.md](jira-comment-post-review.md) — no stray HTML tags, numbered items on separate lines, attachment present |
| MUST convert `<br>` to Jira-native line breaks before posting any table to Jira | [jira-linebreak-conversion.md](jira-linebreak-conversion.md) — raw `<br>` renders as literal text |
| MUST investigate before stating a cause — invoke a real debugging skill (`superpowers:systematic-debugging` first), cite a captured artifact, and label it `Confirmed` / `Suspected` / `Unknown — not investigated` | [root-cause-investigation.md](root-cause-investigation.md) — an unverified cause sends the reader to the wrong layer |
| MUST NOT use a hedge (`probably`, `น่าจะ`, `seems`, `flaky`, `cache issue`, `environment issue`) as a cause, or infer one from another record / role / run / entry point | Hedged guessing is still guessing, and it publishes as QA's finding |
