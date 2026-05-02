# Platform Compatibility

Helix skills are written in plain Markdown and follow the [agentskills.io](https://agentskills.io/specification) open format. The **skill content works with any AI** that can read Markdown context. Only the activation mechanism differs by platform.

---

## What's Universal vs Platform-Specific

| Component | Universal | Platform-specific |
|-----------|-----------|------------------|
| `skills/*/SKILL.md` | ✅ All AI tools | — |
| Knowledge reference files | ✅ All AI tools | — |
| `PRINCIPLES.md` | ✅ All AI tools | — |
| `.claude-plugin/plugin.json` | — | Claude Code only |
| `commands/helix.md` (slash command) | — | Claude Code only |

---

## Installation by Platform

### Claude Code
```bash
claude plugin marketplace add Thitic9203/helix
claude plugin install helix
```

### Copilot CLI / Codex (agentskills format)
```bash
git clone https://github.com/Thitic9203/helix /tmp/helix-install
for d in /tmp/helix-install/skills/*/; do
  skill=$(basename "$d")
  cp -r "$d" ~/.agents/skills/helix-${skill}/
done
```
Skills become available as `helix-analyze`, `helix-plan`, `helix-execute`, etc.

### Gemini CLI
```bash
git clone https://github.com/Thitic9203/helix /tmp/helix-install
mkdir -p ~/.gemini/skills
for d in /tmp/helix-install/skills/*/; do
  skill=$(basename "$d")
  cp -r "$d" ~/.gemini/skills/helix-${skill}/
done
```

### Cursor / Windsurf / Continue
Add the skill content as project rules. Copy the relevant `SKILL.md` content into `.cursor/rules/`, `.windsurf/rules/`, or your tool's equivalent:

```bash
git clone https://github.com/Thitic9203/helix /tmp/helix-install
mkdir -p .cursor/rules
cp /tmp/helix-install/skills/analyze/SKILL.md .cursor/rules/helix-analyze.md
cp /tmp/helix-install/skills/plan/SKILL.md .cursor/rules/helix-plan.md
# ... repeat for skills you want
```

### Any AI — Manual Context
Copy `skills/<name>/SKILL.md` (and the knowledge `.md` files next to it) directly into your system prompt, project context, or AI chat. The skills are self-contained process guides.

---

## Invoking Skills by Platform

| Platform | How to invoke a skill |
|----------|-----------------------|
| Claude Code | `/helix:analyze` |
| Copilot CLI | `@helix-analyze` |
| Gemini CLI | `/skill helix-analyze` |
| Cursor / manual | Paste `SKILL.md` as context, then describe the task |
| Any | Tell the AI: *"Follow the helix analyze skill process"* |

---

## Skill Naming Across Platforms

The skill names in this repo use the `helix:<phase>` convention (Claude Code style). When installed on other platforms, the same skills are addressable as:

| Skill | Claude Code | Copilot CLI | Generic |
|-------|------------|-------------|---------|
| Analyze | `helix:analyze` | `helix-analyze` | "helix analyze" |
| Plan | `helix:plan` | `helix-plan` | "helix plan" |
| Execute | `helix:execute` | `helix-execute` | "helix execute" |
| Test | `helix:test` | `helix-test` | "helix test" |
| Deploy | `helix:deploy` | `helix-deploy` | "helix deploy" |
| Review | `helix:review` | `helix-review` | "helix review" |
| QA Strategy | `helix:qa-strategy` | `helix-qa-strategy` | "helix qa-strategy" |
| QA Plan | `helix:qa-plan` | `helix-qa-plan` | "helix qa-plan" |
| QA Risk | `helix:qa-risk` | `helix-qa-risk` | "helix qa-risk" |
| QA Explore | `helix:qa-explore` | `helix-qa-explore` | "helix qa-explore" |
| QA Report | `helix:qa-report` | `helix-qa-report` | "helix qa-report" |
| QA Defect | `helix:qa-defect` | `helix-qa-defect` | "helix qa-defect" |
| QA Metrics | `helix:qa-metrics` | `helix-qa-metrics` | "helix qa-metrics" |
| QA Data | `helix:qa-data` | `helix-qa-data` | "helix qa-data" |
| QA CI | `helix:qa-ci` | `helix-qa-ci` | "helix qa-ci" |
| QA Full | `helix:qa-full` | `helix-qa-full` | "helix qa-full" |
