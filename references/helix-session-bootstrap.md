# Helix session bootstrap (injected on SessionStart)

Compact context for new sessions. Full router: skill **`helix`**. Discipline: [skill-invocation-discipline.md](skill-invocation-discipline.md).

---

**Helix** is your QA assistant skill pack (TC FE/API prep, Playwright ticket test, retest bug, create bug).

**Before QA work:** If a Helix workflow might apply, use the matching slash-command — not ad-hoc procedure. Announce: `Using **{workflow}** to {purpose}.`

**Direct entry (Claude Code):** `/tc-fe-prep`, `/tc-api-prep`, `/retest-bug`, `/testing-ticket`, `/create-bug` — or `/helix` for the menu. You do **not** have to open the menu when the goal is already clear.

**Every workflow start:** Recite [helix-session-constraints.md](helix-session-constraints.md) (All Helix block; add Testing ticket block when relevant).

**Evidence:** No “done” or “passed” without proof — [qa-evidence-gates.md](qa-evidence-gates.md). User chat stays **English**; Jira/Sheet language follows the destination after approval.

**User instructions** in AGENTS.md / CLAUDE.md override Helix defaults.
