# Proactive QA triggers (suggest-only)

Rules for **offering** the right Helix workflow from context (branch, linked ticket, last commit subject) instead of waiting for the user to open the `/helix` menu. **Offer only — never auto-run** (do not act on work the user did not ask for).

## Hard guardrails

| Rule | Because |
|------|---------|
| MUST only **offer**, never start a workflow automatically | No unrequested side effects |
| MUST respect opt-out `HELIX_PROACTIVE=0` (env var) | User keeps manual control |
| MUST offer **at most one** workflow per turn, once | Avoid nagging |
| MUST fall back to branch + commit when no Jira context | Works without Jira MCP |
| NEVER call paid Managed Agents API for triggers | Free hook/router only — no new cost |
| NEVER post to Jira / create issues from an offer | Side effects belong in the chosen workflow |

## Trigger table

Match the **strongest** signal available: linked ticket type, then branch, then last commit subject. Ticket type wins over branch when both are known.

| Signal | Offer | Command |
|--------|---------|---------|
| Branch `feat/*` **+** linked Jira type = Story | TC FE prep | `/tc-fe-prep` |
| Branch `feat/*` whose name or last commit subject names an API/endpoint/Swagger change | TC API prep | `/tc-api-prep` |
| Branch `fix/*` **+** linked Jira type = Bug | Retest bug | `/retest-bug` |
| Linked ticket or the user's message asks for a browser / Playwright / E2E run | Testing ticket | `/testing-ticket` |
| Defects found in chat, no ticket filed yet | Create bug | `/create-bug` |
| Signal ambiguous / none | Show `/helix` menu | `/helix` |

Routing source of truth: [skill-routing.md](skill-routing.md).

## Fallback when no Jira MCP

If linked-ticket type cannot be read (no MCP, offline), infer from **branch name + last commit subject** only:

- `feat/login-*`, commit "add ..." → likely Story → offer tc-fe-prep
- `fix/*`, commit "fix ..." → likely Bug → offer retest-bug

State the inference so the user can correct it: *"Branch looks like a feature — want TC FE prep? (or pick from /helix)"*.

## Suggestion wording (one line, then wait)

```text
Based on branch {branch} and {linked ticket or commit}, you may want **{workflow}** (`/{command}`).
Say the number/name to start, or ignore this. (Set HELIX_PROACTIVE=0 to silence.)
```

Then **wait** — do not load or run the workflow until the user picks it.

## Where this plugs in

- Router suggestion block → [skills/helix/SKILL.md](../skills/helix/SKILL.md)
- SessionStart hint → [hooks/session-start](../hooks/session-start) — emits a one-line branch-based hint (feat/* → TC FE prep, fix/* → retest); read-only, never auto-runs, honors `HELIX_PROACTIVE=0`.
