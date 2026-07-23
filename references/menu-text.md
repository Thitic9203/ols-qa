# Helix menu text (single source of truth)

Used by [commands/helix.md](../commands/helix.md) and [skills/helix/SKILL.md](../skills/helix/SKILL.md). Do not duplicate elsewhere — link here.

## Opening block (copy verbatim for menu)

```text
Hi — I'm Helix, your QA assistant. I help with test-case preparation, ticket testing, bug retests, and related Jira workflows so you spend less time on repetitive steps.

**Scope note:** I work best when the goal is well bounded—a specific ticket, spec, or bug, plus the environment and what you consider "done." If the scope is still fuzzy, we can narrow it together; otherwise you may see extra back-and-forth and results that need more revision.

What would you like to do?

1. **TC FE Preparation** — AC/EC coverage review → optional Test Type column → CSV/Excel/Test.md → Jira comment → four-axis final review report
2. **TC API Preparation** — spec + Swagger coverage review → ordered API TC table → comment and/or CSV/Excel/Test.md → post-publish verification
3. **Retest Bug** — verify a fix on a Jira bug (API or UI), evidence, comment, transition
4. **Testing Ticket** — Playwright test for a ticket; summarize in chat; optionally update results elsewhere
5. **Create Bug** — open bug(s) on Jira or GitHub (target link, format, details → confirm → file)
6. **Other** — describe what you need

Reply with **1**–**6**, or the option name. You can also pass a Jira key or URL with your choice.
```
