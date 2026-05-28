# Helix skill rules — runtime (Pluton-aligned)

Agent-facing rules for running workflows. Contributor/authoring rules → [docs/skill-rules-authoring.md](../docs/skill-rules-authoring.md).

## Rule 3 — MUST / NEVER + reason

| Pattern | Example |
|---------|---------|
| MUST refuse | MUST refuse to post until the user approves the draft — because premature posts cannot be recalled cleanly. |
| NEVER | NEVER claim Jira post success without re-opening the issue in the UI — because MCP can return OK while the body is truncated. |

Avoid soft-only wording (`should consider`, `might want to`) for safety gates.

When you catch yourself rationalizing past a gate, use [agent-rationalizations.md](agent-rationalizations.md). Evidence before claims: [qa-evidence-gates.md](qa-evidence-gates.md).

## Rule 5 — Bug-hunt / fix-verify mindset (Pluton กฎที่ 5)

1. **Assume the first output is wrong** until a checklist passes.
2. Run a **closing QA** section at the end of the workflow (skill-specific items + shared items from [qa-closing-shared.md](qa-closing-shared.md)).
3. **MUST complete at least one fix-verify round** after any **side effect** (Jira comment/post, issue create, CSV write, Sheet/Confluence update): re-read the destination → if mismatch, fix → re-read again. **Maximum 2 rounds** — then report what remains blocked. NEVER declare complete without this round.
4. **Fresh-eyes review** (second read or subagent):
   - **MUST** before publish when: TC table or result table **> 15 rows**, OR Jira comment body **> 80 lines** / large embedded tables.
   - **SHOULD** for any approved draft the user will paste to executives.

<a id="qa-closing-doubt-and-fix-verify"></a>

### QA closing — doubt and fix-verify

See [qa-closing-shared.md](qa-closing-shared.md) for the shared checklist that every skill includes.

## Refusal-first (precondition gates)

When required inputs are missing, **stop in one message**:

```text
I cannot start {workflow name} yet. Missing:
- {item 1}
- {item 2}

Please provide these, then I will continue.
```

## Scripts (Rule 4)

- **CSV export:** [csv-export-rules.md](csv-export-rules.md) — in-agent by default; script only if the user provides `HELIX_INSTALL_ROOT`.
- **Per-skill pointer:** `skills/<name>/scripts/README.md` when a workflow uses CSV.
