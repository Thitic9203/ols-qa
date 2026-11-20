# Create bug workflow

File **one or more bug reports** on the tracker the user names (Jira, GitHub Issues, etc.). Self-contained in Helix; do not invoke `full-test-plugin`.

## Contents

Checklist, Refusal-first, Phases A–B and MUST / NEVER live here; each later phase has its own file, opened at its checklist line.

## Progress checklist

Copy this block when the run starts; tick each line as it completes. A failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
Create bug progress:
- [ ] Refusal-first (precondition gate)
- [ ] Phase A — Intake (one message, three parts)
- [ ] Phase B — Parse target
- [ ] Phase B2 — Board-conflict re-check (hard gate, before drafting/confirm) — open phase-b2-board-check.md
- [ ] Phase B3 — Falsification (before create) — open phase-b3-falsification.md
- [ ] Phase C — Confirm before create (hard gate) — open phase-c-confirm.md
- [ ] Phase D — Create issues — open phase-d-create.md
- [ ] Phase F — Fix-verify and close (mandatory) — open phase-f-close.md
- [ ] QA closing (mandatory before "done", filed or not) — in phase-f-close.md
```

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Gates:** MUST NOT file without evidence. MUST verify each URL in Phase F before saying done — because create APIs can return IDs for empty bodies.

**No evidence for a candidate** → ask for it in the A3 follow-up. None supplied → do not draft it;
report it as **BLOCKED (no evidence)** and continue with the rest.

## Refusal-first (precondition gate)

MUST refuse to reach Phase B until **A1 (target)**, **A2 (format)**, and **A3 (bug details)** are sufficient to draft — because guessing tracker fields produces junk issues.

**MUST NOT file a defect whose "expected / spec" side is an UNVERIFIED assumption.** "App differs from
what you *assume* the spec says" is **not a bug** — a bug is "app differs from the *verified* spec." Before
drafting, the expected behavior/label/value MUST be confirmed against the **authoritative source** (design
file / Figma, PRD, AC, or the PO) — never derived from a transliteration, an English feature name, or
prose/verb usage, and read **char-exact** on both sides for any wording claim. If the expected side carries
a hedge ("please confirm with design/PO", "should be…", "probably", "ตามสเปก" unchecked), the spec is
unconfirmed → it is a **question, not a bug**: do not draft or file it, and do not send it to Phase B3.
Report it in chat as a question, **BLOCKED: spec unconfirmed**, that names the hedge and the authoritative
source needed (design frame, PRD, AC or PO). (Prevents phantom label bugs on words the design never had.)

**MUST re-check the tracker/board for a prior ticket that already settled this behavior BEFORE filing** —
the full rule, its search steps and its outcomes are in
[Phase B2](#-gate-phase-b2--board-conflict-re-check-hard-gate-before-draftingconfirm-low-freedom).

On first response after constraints, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Create bug**, then show [intake-one-pager.md](../../../references/intake-one-pager.md) (Create bug section).

---

## Phase A — Intake (one message, three parts) [medium freedom]

Ask in **one** message (only what the user has not given):

### A1 — Where to open bugs (required)

> **Where should I open the bug(s)?** Please provide the target link or identifier, for example:
> - Jira: project URL, board URL, or project key + issue type (e.g. Bug)
> - GitHub: repo URL (`https://github.com/owner/repo`) or `owner/repo`

**One target per run** unless the user asks for both Jira and GitHub (then two targets, separate confirms).

### A2 — Bug format (required)

> **Is there a required format or example?** For example:
> - Paste a template or link to an example issue
> - “Use Helix default” (behavioral title + What happens / Expected / Repro matrix / Steps / Environment)
> - Project rules (Jira v2 wiki for FE, v3 ADF for API — if user specifies, **lock** for the session)

If the user says “Helix default”, use the draft structure in [bug-draft-template.md](references/bug-draft-template.md).

### A3 — Bug information (required)

> **What bug(s) should I open?** Provide for each:
> - Title or short summary
> - What happens / expected behavior — and the source of the expected side (design frame, AC, PRD line, or PO decision, with a link)
> - Steps to reproduce, and every entry point you tried
> - Priority (Lowest / Low / Medium / High / Highest) and Severity (Low / Medium / High / Urgent), if you already know them
> - Evidence (screenshots, errors, URLs) — attach paths or paste text

Priority and Severity use the vocabulary of the
[Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md) only — no other scale.
Read each bug's cell from the matrix and cite it in the draft (cheat-sheet line number + row text,
verbatim). One rule settles the two values; apply the rows in this order:

| Case | Result |
|------|--------|
| Reporter gave a Severity in a matrix word | Keep it exactly as given — it is the title bracket; never replaced by your own reading |
| Priority | Its own field: the column of the matrix cell, in the reporter's Severity row, whose example text matches the defect |
| 🔴 STOP — Ask, never decide: no Severity given, the given word is not a matrix row, the Severity row has only `N/A` or no matching cell, or the reporter's Priority differs from the matrix cell | Show that matrix row (and the cell) and ask the reporter to choose; a reporter-given Priority is never silently replaced by your own pick; draft nothing until they answer |
| Several plausible cells in the reporter's Severity row | Not a STOP: cite the closest cell, draft the bug, carry the choice to Phase C as a **Likely** open question (phase-b3-falsification.md) |

Findings from a **prior testing-ticket** run in this chat: reuse that evidence; do not invent details.

**🔴 STOP — Wait** until A1–A3 are sufficient to draft. Ask follow-ups only for gaps.

---

## Phase B — Parse target [medium freedom]

| Target | Detect | Pre-flight |
|--------|--------|------------|
| **GitHub** | `github.com/owner/repo` | `gh auth status`; `gh repo view <owner/repo> --json name` exits 0 |
| **Jira** | Domain + project key from URL | MCP `getVisibleJiraProjects` lists the key; no MCP → open the project URL in the user's logged-in browser and read the key on the page |

**🔴 STOP — pre-flight fails** (auth, repo missing) → report it; MUST NOT create issues silently.

**Tracker fields pre-flight** (runs after the target is reachable, before Phase C):

- **GitHub labels.** Run `gh label list --repo <owner/repo> --limit 500` and check that `bug` and each
  `severity:<Severity>` the drafts need exist. Any missing → name the missing labels in the Phase C confirm block (`Fields:` line) and ask
  the user to choose: they create the labels (or approve creating them — a new label is a change in their
  repo, so it needs that explicit yes), **or** file without the missing labels, with the Severity kept in
  the title bracket and body. Never drop a label silently; Phase D passes only labels that exist.
- **Jira fields.** Fetch the create metadata for the project and issue type (Atlassian MCP
  `getJiraIssueTypeMetaWithFields`, or REST `GET /rest/api/<v>/issue/createmeta/<KEY>/issuetypes/<id>`).
  Map Priority to the `priority` field (use the option name the metadata lists) and Severity to the
  field id the workspace project guide names — never a guessed `customfield_` id. A required field with
  no value in the draft, or a Severity field the guide does not name → ask in the Phase C confirm block.
  Show the mapping on the `Fields:` line.
- **Metadata cannot be read** (`gh label list` or createmeta fails: no permission, error) → report the error verbatim and ask; do not create
  with unmapped fields.

**Go back:** If pre-flight fails, return to Phase A — Intake (A1 — Where to open bugs) once the user gives a reachable target; nothing is created meanwhile.

---

## 🔴 GATE: Phase B2 — Board-conflict re-check (hard gate, before drafting/confirm) [low freedom]

At Phase B2, open [phase-b2-board-check.md](phase-b2-board-check.md) and follow every line. Hard gate: nothing is drafted, confirmed or filed until every candidate has its board-check result.

---

## 🔴 GATE: Phase B3 — Falsification (before create) [high freedom]

At Phase B3, open [phase-b3-falsification.md](phase-b3-falsification.md) and follow every line before moving on. 🔴 GATE: no candidate reaches Phase C until it survives falsification.

---

## 🔴 GATE: Phase C — Confirm before create (hard gate) [low freedom]

At Phase C, open [phase-c-confirm.md](phase-c-confirm.md) and follow every line. Hard gate: no create call before the user replies confirm.

---

## Phase D — Create issues [low freedom]

At Phase D, open [phase-d-create.md](phase-d-create.md) and follow every line before moving on. Read shared-must-never.md (linked in MUST / NEVER) before the first write.

---

## Phase F — Fix-verify and close (mandatory) [low freedom]

At Phase F, open [phase-f-close.md](phase-f-close.md) and follow every line. Mandatory: no done claim before every created URL is verified.

---

## Out of scope

- Running a full test pass, retest, TC prep, result updates — see [skill-routing.md](../../../references/skill-routing.md)

---

## References

Shared, with triggers: [skill-reference-index.md](../../../references/skill-reference-index.md). Own: [bug-draft-template.md](references/bug-draft-template.md) (A2/C), [posting-discipline.md](references/posting-discipline.md) (D), [worked-example.md](references/worked-example.md) (format sample only).

---

## MUST / NEVER

Shared rules: at Phase D, before the first write, read [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT invent reproduction steps — they come only from the reporter's input and evidence; a missing step is a question | False bugs |
| NEVER file a bug whose expected side is a transliteration, a feature name or a hedged line ("should be…", "confirm with PO") | App vs an assumed spec is a question, not a bug (Refusal-first) |
| NEVER file a second ticket for a defect already open on the board (Phase B2 duplicate) | Two tickets split the discussion and the retest |
| NEVER call a create API before the user replies **confirm** in Phase C | An unapproved issue is public at once and must be cleaned up by hand |
| NEVER replace a reporter-given Severity or Priority with your own pick (Phase A3 item 3) | A guessed value misroutes triage |
| NEVER drop a label or field to make a create succeed (Phase B pre-flight, Phase D field errors) | A silently missing Severity/Priority hides the bug from the views that filter on it |
| MUST search the board (Phase B2) before filing; drop any bug already settled as intended in a prior/closed ticket and report it with the reference link | Re-filing a closed decision wastes a full retest round |
| MUST use only the bug-priority-matrix vocabulary and cite the cell (Phase A3) | An invented scale cannot be compared with the verdicts that use the matrix |
| MUST verify each issue URL in Phase F | Silent partial failure |
| MUST lock Jira v2/v3 per session when user specifies | Rewrite cost |
