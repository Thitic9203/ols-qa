# ◈ Helix

**Stop babysitting your AI. Give it a structured QA + dev brain.**

[![Stars](https://img.shields.io/github/stars/Thitic9203/helix?style=flat-square)](https://github.com/Thitic9203/helix/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-%E2%9C%93-orange?style=flat-square)](https://claude.ai/code)
[![Copilot CLI](https://img.shields.io/badge/Copilot%20CLI-%E2%9C%93-blue?style=flat-square)](https://githubnext.com/projects/copilot-cli)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-%E2%9C%93-green?style=flat-square)](https://gemini.google.com)

Helix is a plugin/skill pack that guides any AI through the **complete software development lifecycle** — with a particular focus on structured QA (ISO 25010 + ISTQB-aligned, 14 dedicated QA skills).

Skills are plain Markdown following the [agentskills.io](https://agentskills.io/specification) open format — no vendor lock-in. Works with Claude Code, Copilot CLI, Gemini CLI, Cursor, Windsurf, Aider, and more.

> ⭐ If Helix saves you time, a star helps others find it.

---

## Demo

```bash
# Preview the QA pipeline output (no AI needed)
bash demo/helix-demo.sh

# Record a shareable demo
asciinema rec demo.cast -c "bash demo/helix-demo.sh"
```

<details>
<summary>What the demo shows</summary>

`/helix qa-full` running through the full QA lifecycle:
- QA strategy (ISO 25010 + ISTQB)
- Risk matrix (ISO 31000 · Likelihood × Impact)
- Tier 1–2 test execution (unit → integration → E2E → security → a11y → visual)
- Exploratory testing session (SBTM)
- Defect report with 5-Whys RCA
- Final sign-off decision (PASS / CONDITIONAL / FAIL)
</details>

---

## Why Helix?

Most AI coding tools skip proper QA or deploy straight to production. Helix enforces discipline your team actually wants.

| Problem | Helix behavior |
|---|---|
| AI deploys straight to production | Staging-first, every time — no exceptions |
| AI breaks existing code silently | Asks before any risky change, lists all impact |
| QA is ad-hoc or forgotten | ISO 25010 + ISTQB-aligned, 3-tier test coverage |
| No structured bug-fix process | Mandatory 3-round loop: Logic → Integration → Security |
| AI picks paid tools freely | Free-tier only; paid requires your explicit approval + estimate |
| Scope creep during implementation | Flags out-of-scope findings; never silently expands |
| No progress visibility on long tasks | Reports every 10 minutes as a table |

---

## Quick Start

### Claude Code
```bash
claude plugin marketplace add Thitic9203/helix
claude plugin install helix
```

Then: `/helix` to run the full pipeline, or jump to any phase:
```
/helix analyze    → requirements breakdown + risk
/helix plan       → development plan (3-round review)
/helix execute    → implement the approved plan
/helix test       → run tests (unit → integration → E2E → perf)
/helix deploy     → staging-first deployment + smoke tests
/helix review     → code review + security audit
/helix qa-full    → complete QA lifecycle (strategy → report → metrics)
```

### Other AI Tools

<details>
<summary>Copilot CLI / Codex</summary>

```bash
git clone https://github.com/Thitic9203/helix /tmp/helix-install
for d in /tmp/helix-install/skills/*/; do
  cp -r "$d" ~/.agents/skills/helix-$(basename "$d")/
done
```
</details>

<details>
<summary>Gemini CLI</summary>

```bash
git clone https://github.com/Thitic9203/helix /tmp/helix-install
mkdir -p ~/.gemini/skills
for d in /tmp/helix-install/skills/*/; do
  cp -r "$d" ~/.gemini/skills/helix-$(basename "$d")/
done
```
</details>

<details>
<summary>Cursor / Windsurf / Any AI</summary>

Copy `SKILL.md` files from `skills/<phase>/` into your tool's rules directory, or paste directly as AI context. Skills are self-contained — no tooling required.
</details>

See [COMPATIBILITY.md](./COMPATIBILITY.md) for the full platform guide.

---

## QA Skills — the standout feature

Helix ships 14 QA-specific skills built around industry standards. Run them independently or chain with `qa-full`.

### 3-Tier Test System (ISO/IEC 25010 — SQuaRE)

**Tier 1 — Functional** *(must pass before Tier 2)*
```
test-unit          unit tests (creates structure if missing)
test-integration   integration tests with real DB/services
test-contract      API contract tests (Pact)
test-e2e           Playwright E2E tests
```

**Tier 2 — Non-Functional Quality** *(run after Tier 1 passes)*
```
test-security      OWASP Top 10 + semgrep + trufflehog + trivy
test-a11y          Accessibility (axe-core + WCAG 2.1 AA)
test-visual        Visual regression (Playwright snapshots)
```

**Tier 3 — Performance** *(requires a running environment)*
```
test-perf-load     p95/p99 latency at expected concurrent users
test-perf-stress   find breaking point + verify recovery
test-perf-soak     memory/connection leaks over 30–60 min sustained load
test-perf-frontend Core Web Vitals (LCP/CLS/INP), bundle size, Lighthouse CI
test-perf-db       slow queries, EXPLAIN ANALYZE, N+1 detection, index gaps
test-perf-profile  CPU flamegraph + heap snapshot (clinic.js, py-spy, pprof)
```

### QA Process Skills (ISTQB CTFL v4.0 + IEEE 829)

```
qa-strategy    test strategy aligned to ISO 25010 + ISTQB
qa-plan        test plan (IEEE 829) with entry/exit criteria + schedule
qa-risk        risk matrix (Likelihood × Impact, ISO 31000)
qa-explore     exploratory testing session (SBTM + HICCUPPS)
qa-report      test report + sign-off decision (PASS / CONDITIONAL / FAIL)
qa-defect      defect report with P0–P3 severity + 5-Whys root cause
qa-metrics     HTML dashboard (chart.js) + Markdown metrics summary
qa-data        test data management, PII masking, factory functions, seed scripts
qa-ci          GitHub Actions 5-stage CI pipeline setup
```

### Run the full QA pipeline
```
qa-full    strategy → plan → risk → tests → explore → data → report → defect → metrics
```

---

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

## Full Pipeline

```
analyze → plan → execute → [bug-fix loop ×3] → test → deploy → review
```

Each phase is independent. Run the full pipeline or jump in at any stage.

### All commands

| Phase | Claude Code | Copilot/Codex | Gemini CLI |
|-------|------------|---------------|------------|
| Full pipeline | `/helix full` | `@helix-full` | `/skill helix-full` |
| Analyze | `/helix analyze` | `@helix-analyze` | `/skill helix-analyze` |
| Plan | `/helix plan` | `@helix-plan` | `/skill helix-plan` |
| Execute | `/helix execute` | `@helix-execute` | `/skill helix-execute` |
| Test | `/helix test` | `@helix-test` | `/skill helix-test` |
| Deploy | `/helix deploy` | `@helix-deploy` | `/skill helix-deploy` |
| Review | `/helix review` | `@helix-review` | `/skill helix-review` |
| QA full | `/helix qa-full` | `@helix-qa-full` | `/skill helix-qa-full` |

---

## Core Rules (enforced on all platforms)

| Rule | What it means |
|------|--------------|
| **Staging-first** | Every deploy goes to staging first — no direct-to-prod |
| **Free-first** | All tool recommendations are free-tier; paid = explicit approval + estimate |
| **Ask before acting** | Changes risking existing code ask you first with a full impact list |
| **Bug-fix loop** | 3 mandatory rounds (Logic / Integration / Security) after implementation |
| **Scope discipline** | Out-of-scope findings are flagged, not silently fixed |
| **10-min updates** | Execution reports progress every 10 minutes as a markdown table |

---

## What's Inside

```
skills/
  full/                   complete workflow
  analyze/                requirements + risk
  plan/                   plan creation + 3-round review
  execute/                implementation + bug-fix loop
  test/                   test orchestrator
  test-unit/
  test-integration/
  test-e2e/               Playwright-based
  test-contract/          API contract (Pact)
  test-security/          OWASP + semgrep + trufflehog
  test-a11y/              axe-core + WCAG 2.1
  test-visual/            Playwright visual regression
  test-perf/              performance orchestrator
  test-perf-load/
  test-perf-stress/
  test-perf-soak/
  test-perf-frontend/     Core Web Vitals + Lighthouse CI
  test-perf-db/           slow query + index analysis
  test-perf-profile/      CPU flamegraph + heap snapshot
  deploy/                 staging-first + smoke tests
  review/                 code review + security audit
  qa-full/                QA pipeline orchestrator
  qa-strategy/            ISO 25010 + ISTQB aligned
  qa-plan/                IEEE 829 test plan
  qa-risk/                ISO 31000 risk matrix
  qa-explore/             SBTM exploratory testing
  qa-report/              sign-off report
  qa-defect/              P0–P3 defect + 5-Whys RCA
  qa-metrics/             HTML dashboard + Markdown
  qa-data/                PII masking + factory functions
  qa-ci/                  GitHub Actions 5-stage CI

COMPATIBILITY.md          install guide for all AI platforms
PRINCIPLES.md             core rules reference
```

Each skill ships with knowledge reference files — domain patterns, checklists, and templates loaded automatically at invocation.

---

## Contributing

Before opening a PR, run the validation suite:

```bash
bash tests/run.sh
```

| Check | What it verifies |
|-------|-----------------|
| `01-frontmatter` | Every `SKILL.md` has valid `name` + `description` |
| `02-dead-refs` | Knowledge files listed in SKILL.md headers exist on disk |
| `03-cross-refs` | `helix:skill-name` references point to real skill directories |
| `04-skill-map` | `skills/` directory is in sync with `commands/helix.md` |

Run a single check: `bash tests/run.sh 2`

---

## Advanced: Parallel Agents + MCP (Claude Code)

Some skills support optional parallel sub-agents (2–4× faster, more tokens) and MCP tool integrations (Jira, GitHub, Confluence, Slack). Both require explicit opt-in — the skill asks before using either.

---

## Wiki

Full documentation: [github.com/Thitic9203/helix/wiki](https://github.com/Thitic9203/helix/wiki)

---

## License

MIT

---

*Found Helix useful? ⭐ [Star it on GitHub](https://github.com/Thitic9203/helix) — it helps QA engineers and AI devs find it.*
