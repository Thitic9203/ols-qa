# Create bug workflow

File **one or more bug reports** on the tracker the user names (Jira, GitHub Issues, etc.). Ported from the former full-test **Phase 6** — **self-contained in Helix**; do not invoke `full-test-plugin`.

## Contents

This file holds the start of the run (checklist, discipline, Refusal-first, Phases A–B) and MUST / NEVER. Each later phase lives in its own file next to this one; open it when its checklist line is reached, not before.

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
Create bug progress:
- [ ] Refusal-first (precondition gate)
- [ ] Phase A — Intake (one message, three parts)
- [ ] Phase B — Parse target
- [ ] Phase B2 — Board-conflict re-check (hard gate, before drafting/confirm) — open phase-b2-board-check.md
- [ ] Phase B3 — Falsification (before create) — open phase-e-falsification.md
- [ ] Phase C — Confirm before create (hard gate) — open phase-c-confirm.md
- [ ] Phase D — Create issues — open phase-d-create.md
- [ ] Phase F — Fix-verify and close (mandatory) — open phase-f-close.md
- [ ] QA closing (mandatory before "done", filed or not) — in phase-f-close.md
```

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Gates:** MUST NOT create issues until Phase C confirm. MUST NOT file without evidence. MUST verify each URL in Phase F before saying done — because create APIs can return IDs for empty bodies.

**No evidence for a candidate** → ask for it in the A3 follow-up. If none can be supplied, do not
draft that candidate; report it to the user as **BLOCKED (no evidence)** and continue with the rest.

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
source needed (design frame, PRD, AC or PO). (Root cause this prevents: a phantom label bug filed against a transliterated word never in the
design — the real spec matched the app all along.)

**MUST re-check the tracker/board for a prior ticket that already settled this behavior BEFORE filing** —
the full rule, its search steps and its outcomes are in
[Phase B2](#-gate-phase-b2--board-conflict-re-check-hard-gate-before-draftingconfirm-low-freedom).

On first response after constraints, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Create bug**, then show [intake-one-pager.md](../../../references/intake-one-pager.md) (Create bug section).

---

## Phase A — Intake (one message, three parts) [medium freedom]

Ask in **one** grouped message (fill in only what the user has not already provided):

### A1 — Where to open bugs (required)

> **Where should I open the bug(s)?** Please provide the target link or identifier, for example:
> - Jira: project URL, board URL, or project key + issue type (e.g. Bug)
> - GitHub: repo URL (`https://github.com/owner/repo`) or `owner/repo`

Support **one target per run** unless the user explicitly asks for both Jira and GitHub (then treat as two targets with separate confirms).

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
verbatim). One rule settles the two values, in this order:

1. **Severity** — the matrix supplies the vocabulary (its rows); the reporter supplies the value. A
   Severity the reporter gives in a matrix word is kept exactly as given — it is the title bracket — and
   is never replaced by your own reading.
2. **Priority** — its own field: the column of the matrix cell, in the reporter's Severity row, whose
   example text matches the defect.
3. **🔴 STOP — Ask, never decide** — when no Severity was given, the given word is not a matrix row, or the
   reporter's Severity row has only `N/A` / no matching cell for this defect, or the reporter gave a
   Priority that differs from the matrix cell: show that matrix row (and the cell) and ask the reporter
   to choose. A reporter-given Priority is never silently replaced by your own pick. Do not swap in another Severity or Priority yourself and do not draft the
   bug until they answer.
   Several plausible cells in the reporter's Severity row is **not** a STOP: cite the closest cell, draft the bug, and carry the
   choice to Phase C as a **Likely** open question (phase-e-falsification.md).

Steps to reproduce come only from the user's input and evidence. A step that seems missing is a
follow-up question here, never a line you add to the draft.

If the user references findings from a **prior testing-ticket** run in the same chat, reuse that evidence; do not invent details.

**🔴 STOP — Wait** until A1–A3 are sufficient to draft. Ask follow-ups only for gaps.

---

## Phase B — Parse target [medium freedom]

| Target | Detect | Pre-flight |
|--------|--------|------------|
| **GitHub** | `github.com/owner/repo` | `gh auth status`; repo exists |
| **Jira** | Domain + project key from URL | MCP `getVisibleJiraProjects` lists the key; no MCP → open the project URL in the user's logged-in browser and read the key on the page |

If pre-flight fails (auth, repo missing), report and stop — MUST NOT create issues silently.

**Tracker fields pre-flight** (runs after the target is reachable, before Phase C):

- **GitHub labels.** Run `gh label list --repo <owner/repo> --limit 500` and check that `bug` and each
  `severity:<Severity>` the drafts need exist (`gh issue create` rejects an unknown label and creates
  nothing). Any missing → name the missing labels in the Phase C confirm block (`Fields:` line) and ask
  the user to choose: they create the labels (or approve creating them — a new label is a change in their
  repo, so it needs that explicit yes), **or** file without the missing labels, with the Severity kept in
  the title bracket and body. Never drop a label silently; Phase D passes only labels that exist.
- **Jira fields.** Fetch the create metadata for the project and issue type (Atlassian MCP
  `getJiraIssueTypeMetaWithFields`, or REST `GET /rest/api/<v>/issue/createmeta/<KEY>/issuetypes/<id>`).
  Map Priority to the `priority` field (use the option name the metadata lists) and Severity to the
  field id the workspace project guide names — never a guessed `customfield_` id. A required field with
  no value in the draft, or a Severity field the guide does not name → ask in the Phase C confirm block.
  Show the mapping on the `Fields:` line.
- **Metadata cannot be read** (no permission, error) → report the error verbatim and ask; do not create
  with unmapped fields.

**Go back:** If pre-flight fails, return to Phase A — Intake (A1 — Where to open bugs) once the user gives a reachable target; nothing is created meanwhile.

---

## 🔴 GATE: Phase B2 — Board-conflict re-check (hard gate, before drafting/confirm) [low freedom]

At Phase B2, open [phase-b2-board-check.md](phase-b2-board-check.md) and follow every line of it before you move on. Hard gate: nothing is drafted, confirmed or filed until every candidate has its board-check result.

---

## Phase B3 — Falsification (before create) [high freedom]

At Phase B3, open [phase-e-falsification.md](phase-e-falsification.md) and follow every line of it before you move on. No candidate reaches Phase C until it survives falsification.

---

## 🔴 GATE: Phase C — Confirm before create (hard gate) [low freedom]

At Phase C, open [phase-c-confirm.md](phase-c-confirm.md) and follow every line of it before you move on. Hard gate: no create call before the user replies confirm.

---

## Phase D — Create issues [low freedom]

At Phase D, open [phase-d-create.md](phase-d-create.md) and follow every line of it before you move on. Read shared-must-never.md (linked in MUST / NEVER) before the first write.

---

## Phase F — Fix-verify and close (mandatory) [low freedom]

At Phase F, open [phase-f-close.md](phase-f-close.md) and follow every line of it before you move on. Mandatory: no done claim before every created URL is verified.

---

## Out of scope

- Running a full test pass, retest, TC prep, result updates — see [skill-routing.md](../../../references/skill-routing.md)

---

## References

All shared references and the trigger that opens each: [skill-reference-index.md](../../../references/skill-reference-index.md). This skill's own files: [bug-draft-template.md](references/bug-draft-template.md) at Phase A2/C (default draft layout), [posting-discipline.md](references/posting-discipline.md) at Phase D (GitHub + Jira posting), [worked-example.md](references/worked-example.md) only when a format sample is needed.

---

## MUST / NEVER

Shared rules: at Phase D, before the first write, read [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT invent reproduction steps — they come only from the reporter's input and evidence; a missing step is a question | False bugs |
| NEVER file a bug whose expected side is a transliteration, a feature name or a hedged line ("should be…", "confirm with PO") | App vs an assumed spec is a question, not a bug (Refusal-first) |
| NEVER file a second ticket for a defect already open on the board (Phase B2 duplicate) | Two tickets split the discussion and the retest |
| NEVER call a create API before the user replies **confirm** in Phase C | An unapproved issue is public at once and must be cleaned up by hand |
| NEVER replace a Severity the reporter gave with your own reading — a value the matrix cannot place is a question to the reporter (Phase A3, item 3), not a correction | The reporter's severity is the title bracket; a guessed one misroutes triage |
| NEVER drop a label or field to make a create succeed (Phase B pre-flight, Phase D field errors) | A silently missing Severity/Priority hides the bug from the views that filter on it |
| MUST search the board (Phase B2) before filing; drop any bug already settled as intended in a prior/closed ticket and report it with the reference link | Re-filing a closed decision wastes a full retest round |
| MUST use only the bug-priority-matrix vocabulary for Priority and Severity and cite the cell (Severity value from the reporter, Priority from the cell; a reporter value the cell does not match is asked, never replaced — Phase A3) | An invented scale cannot be compared with the verdicts that use the matrix |
| MUST verify each issue URL in Phase F | Silent partial failure |
| MUST lock Jira v2/v3 per session when user specifies | Rewrite cost |
