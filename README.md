# ◈ Helix

**Full-cycle project orchestrator for Claude Code**

Helix is a Claude Code plugin that guides you through every stage of software development — from requirements intake to production deployment. Run the complete workflow end-to-end, or jump into any individual phase.

---

## Install

```bash
claude plugins install helix@https://github.com/Thitic9203/helix
```

---

## Commands

```
/helix              — show phase menu
/helix full         — complete workflow, start to finish
/helix analyze      — requirements breakdown + risk analysis
/helix plan         — create development plan (3-round review)
/helix execute      — implement the approved plan
/helix test         — run unit, integration, E2E, perf, or security tests
/helix deploy       — staging-first deployment + verification
/helix review       — code review + security audit
```

---

## How it works

```
analyze → plan → execute → [bug-fix loop ×3] → test → deploy → review
```

Each phase is independent — start where you need, skip what you don't.

### Key behaviors

| Behavior | Detail |
|----------|--------|
| **Staging-first** | Every deploy goes to staging first, never straight to production |
| **Free-first** | All tool recommendations are free-tier; paid options require explicit approval |
| **Ask before acting** | Any change that risks breaking existing code asks the user first |
| **Bug-fix loop** | After implementation, 3 mandatory rounds of Logic / Integration / Security checks before testing |
| **Scope discipline** | Won't do more than what was agreed; out-of-scope findings are flagged, not silently fixed |
| **10-min updates** | Execution reports progress every 10 minutes as a table |

---

## Test sub-commands

`/helix test` opens a menu. Run individual test types directly:

```
/helix test-unit          — unit tests (creates structure if missing)
/helix test-integration   — integration tests with real DB/services
/helix test-e2e           — Playwright E2E tests
/helix test-perf          — performance tests (k6, autocannon, locust)
/helix test-security      — OWASP Top 10, semgrep, trufflehog, trivy
```

Each sub-command checks the repo's existing test structure first — adds to it if present, creates it if not.

---

## What's inside

```
.claude-plugin/
  plugin.json

commands/
  helix.md              ← entry point + phase menu

skills/
  full/                 ← complete workflow
  analyze/              ← requirements + risk
    requirement-patterns.md
    risk-patterns.md
  plan/                 ← plan creation + 3-round review
    planning-patterns.md
    review-checklist.md
  execute/              ← implementation + bug-fix loop
    impact-analysis.md
    bug-fix-patterns.md
  test/                 ← test orchestrator
  test-unit/
    testing-patterns.md
  test-integration/
    integration-patterns.md
  test-e2e/             ← Playwright-based
    e2e-patterns.md
  test-perf/
    perf-thresholds.md
  test-security/
    owasp-checklist.md
  deploy/
    env-separation.md
    smoke-test-patterns.md
  review/
    code-quality-patterns.md
    review-output-format.md

PRINCIPLES.md           ← core rules reference
```

Each skill ships with knowledge reference files — domain patterns, checklists, and templates loaded automatically at no extra token cost.

---

## Core rules

- **Cost rule** — any approach that incurs cloud spend triggers an estimate + user approval before proceeding
- **Safety rule** — changes that may affect existing code list the impact and wait for user confirmation
- **Deployment rule** — staging always before production, no exceptions
- **Scope rule** — never work beyond the agreed scope; flag, don't fix silently
- **Skill rule** — external skill recommendations come with trust rating and fallback; user decides whether to install

---

## Advanced: parallel agents + MCP

Some skills support optional parallel sub-agents (faster analysis, ~2–4× more tokens) and MCP tool integrations (Jira, GitHub, Confluence, Slack). Both require explicit opt-in at invocation time — Helix will ask before using either.

---

## License

MIT
