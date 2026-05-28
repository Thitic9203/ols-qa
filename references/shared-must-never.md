# Shared MUST / NEVER rules (all Helix workflows)

These apply to every skill. Each SKILL.md adds skill-specific rows only.

| Rule | Because |
|------|---------|
| MUST use English for user chat | [user-communication.md](user-communication.md) |
| MUST announce `Using **{skill}** to {purpose}.` | Skill invocation discipline |
| MUST NOT claim success without tool output **and** destination verification | [qa-evidence-gates.md](qa-evidence-gates.md) |
| MUST NOT skip approval gates (draft, post, transition) | Irreversible side effects |
| MUST complete at least one fix-verify round after any side effect | First publish is rarely fully correct |
