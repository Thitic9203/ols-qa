# QA debug discipline (flaky E2E, retest, API)

Use when **Playwright fails intermittently**, **retest result disagrees with dev**, **environment unreachable**, or **evidence contradicts the chat summary**. Inspired by systematic root-cause practice — scoped to QA, not application code fixes.

## Iron rule

```
NO “ROOT CAUSE FOUND” OR WORKAROUND UNTIL REPRODUCTION AND EVIDENCE ARE DOCUMENTED
```

Helix does **not** patch product code unless the user explicitly asks — this skill is for **test and environment diagnosis**.

## Phase 1 — Reproduce and bound

1. **Reproduce or prove non-repro** — exact steps, data, role, environment URL.  
2. **Read failures literally** — Playwright trace, `test-results/`, console, network failed requests.  
3. **Recent changes** — deploy version, config, test data, VPN, `CF_BYPASS`, auth session age.  
4. **One boundary at a time** — browser vs API vs Jira vs VPN:
   - Log or note: request URL, status, response snippet at each boundary.  
   - Do not fix multiple layers in one guess.

## Phase 2 — Hypothesis (max 3)

Write hypotheses ranked by likelihood. Each must be **falsifiable** in one check.

```text
H1: {hypothesis} — falsify by: {single check}
H2: ...
```

## Phase 3 — Minimal check

Run the **smallest** check that falsifies or confirms H1 (single curl, single UI step, reload auth file). Document output.

## Phase 4 — Report (no mystery fixes)

Post in chat:

```text
━━━ QA debug summary ━━━
Symptom: {one line}
Repro: {always | flaky | not yet} — steps
Root cause: {confirmed | suspected | unknown}
Evidence: {trace path, status code, screenshot}
Recommended: {retest | data fix | infra | dev fix}
Blocked on: {user action if any}
━━━━━━━━━━━━━━━━━━━━━━
```

Link failures to **testing-ticket** Phase F or **retest** comment only after user approves wording.

## When to use subagents

If trace/network analysis is large, see [subagent-qa-patterns.md](subagent-qa-patterns.md) — delegate analysis, not Jira posts.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST NOT mark PASSED after only changing timeouts | Masks flake |
| MUST NOT skip VPN/auth checks when symptom is navigation timeout | Common on PD3-style envs |
| MUST attach evidence paths in summary | Chat alone is not proof |
