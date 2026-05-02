# ◈ Helix

**Full-cycle project orchestrator — works with any AI**

Helix is a plugin/skill pack that guides any AI through every stage of software development: requirements analysis, planning, implementation, testing, deployment, and code review.

Skills are written in plain Markdown following the [agentskills.io](https://agentskills.io/specification) open format.

## Compatible AI Tools

| AI Tool | Support | Example usage |
|---------|:-------:|--------------|
| **Claude Code** (Anthropic) | ✅ Full | `/helix analyze` |
| **GitHub Copilot CLI** | ✅ Full | `@helix-analyze` |
| **Codex CLI** (OpenAI) | ✅ Full | `@helix-analyze` |
| **Gemini CLI** (Google) | ✅ Full | `/skill helix-analyze` |
| **Cursor** | ✅ Full | `Apply rule helix-analyze` |
| **Windsurf** (Codeium) | ✅ Full | `Apply rule helix-analyze` |
| **Continue** (VS Code / JetBrains) | ✅ Full | `@helix-analyze` |
| **Aider** | ✅ Full | `/add skills/analyze/SKILL.md` |
| **Any AI with Markdown context** | ✅ Manual | paste `SKILL.md` into chat |

> The plugin entry point (`.claude-plugin/`, `commands/`) is Claude Code only. All skills and knowledge files work universally.

---

## Install

### Claude Code
```bash
claude plugins install helix@https://github.com/Thitic9203/helix
```

### Copilot CLI / Codex
```bash
git clone https://github.com/Thitic9203/helix /tmp/helix-install
for d in /tmp/helix-install/skills/*/; do
  cp -r "$d" ~/.agents/skills/helix-$(basename "$d")/
done
```

### Gemini CLI
```bash
git clone https://github.com/Thitic9203/helix /tmp/helix-install
mkdir -p ~/.gemini/skills
for d in /tmp/helix-install/skills/*/; do
  cp -r "$d" ~/.gemini/skills/helix-$(basename "$d")/
done
```

### Cursor / Windsurf / Any AI
Copy the `SKILL.md` files from `skills/<phase>/` into your tool's rules directory, or paste them directly as AI context. Skills are self-contained — no tooling required.

See [COMPATIBILITY.md](./COMPATIBILITY.md) for full platform details.

---

## Commands

| Platform | Command |
|----------|---------|
| Claude Code | `/helix`, `/helix full`, `/helix analyze` … |
| Copilot CLI | `@helix-full`, `@helix-analyze` … |
| Gemini CLI | `/skill helix-full`, `/skill helix-analyze` … |
| Any AI | *"Follow the helix analyze skill"* |

### Available phases

```
full          — complete workflow, start to finish
analyze       — requirements breakdown + risk analysis
plan          — create development plan (3-round review)
execute       — implement the approved plan
test          — run unit, integration, E2E, perf, or security tests
deploy        — staging-first deployment + verification
review        — code review + security audit
```

### Test sub-skills

```
test-unit          — unit tests (creates structure if missing)
test-integration   — integration tests with real DB/services
test-e2e           — Playwright E2E tests
test-perf          — performance tests (k6, autocannon, locust)
test-security      — OWASP Top 10, semgrep, trufflehog, trivy
```

---

## How it works

```
analyze → plan → execute → [bug-fix loop ×3] → test → deploy → review
```

Each phase is independent. Run the full pipeline or jump into any phase directly.

### Key behaviors

| Behavior | Detail |
|----------|--------|
| **Staging-first** | Every deploy goes to staging first, never straight to production |
| **Free-first** | All tool recommendations are free-tier; paid options require explicit approval |
| **Ask before acting** | Changes that risk breaking existing code ask the user first |
| **Bug-fix loop** | 3 mandatory rounds (Logic / Integration / Security) after implementation, before testing |
| **Scope discipline** | Won't exceed the agreed scope; out-of-scope findings are flagged, not silently fixed |
| **10-min updates** | Execution reports progress every 10 minutes as a table |

---

## What's inside

```
.claude-plugin/        ← Claude Code plugin entry point
commands/helix.md      ← Claude Code slash command

skills/
  full/                ← complete workflow
  analyze/             ← requirements + risk
    requirement-patterns.md
    risk-patterns.md
  plan/                ← plan creation + 3-round review
    planning-patterns.md
    review-checklist.md
  execute/             ← implementation + bug-fix loop
    impact-analysis.md
    bug-fix-patterns.md
  test/                ← test orchestrator
  test-unit/
    testing-patterns.md
  test-integration/
    integration-patterns.md
  test-e2e/            ← Playwright-based
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

COMPATIBILITY.md       ← install guide for all AI platforms
PRINCIPLES.md          ← core rules reference
```

Each skill ships with knowledge reference files — domain patterns, checklists, and templates loaded automatically at invocation.

### Platform compatibility

| Component | Universal | Claude Code only |
|-----------|-----------|-----------------|
| `skills/*/SKILL.md` | ✅ | — |
| Knowledge reference files | ✅ | — |
| `PRINCIPLES.md` | ✅ | — |
| `.claude-plugin/`, `commands/` | — | ✅ |

---

## Core rules (all platforms)

- **Cost rule** — any paid infrastructure requires estimate + explicit approval
- **Safety rule** — changes affecting existing code list the impact and wait for confirmation
- **Deployment rule** — staging always before production, no exceptions
- **Scope rule** — never work beyond the agreed scope; flag, don't fix silently
- **Skill rule** — external skill recommendations come with trust rating and fallback; user decides

---

## Advanced: parallel agents + MCP (Claude Code)

Some skills support optional parallel sub-agents (faster, 2–4× more tokens) and MCP tool integrations (Jira, GitHub, Confluence, Slack). Both require explicit opt-in — the skill will ask before using either. These features are currently Claude Code only.

---

## Wiki

Full documentation at [github.com/Thitic9203/helix/wiki](https://github.com/Thitic9203/helix/wiki)

---

## License

MIT
