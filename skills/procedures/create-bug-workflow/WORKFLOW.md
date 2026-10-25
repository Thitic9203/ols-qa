---
name: create-bug-workflow
description: |
  Open bug reports on Jira or GitHub after collecting target link, format template, and bug details — confirm before creating.
  Use when the user chooses Create bug from Helix, invokes /create-bug, or wants issues filed from test findings.
  Do NOT use for Playwright test runs (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), posting manual TC tables (tc-fe-prep / tc-api-prep), or updating test result sheets without filing bugs.
---

# Create bug workflow

File **one or more bug reports** on the tracker the user names (Jira, GitHub Issues, etc.). Ported from the former full-test **Phase 6** — **self-contained in Helix**; do not invoke `full-test-plugin`.

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Phase A — Intake (one message, three parts) \[medium freedom\]](#phase-a--intake-one-message-three-parts-medium-freedom)
- [Phase B — Parse target \[medium freedom\]](#phase-b--parse-target-medium-freedom)
- [🔴 GATE: Phase B2 — Board-conflict re-check (hard gate, before drafting/confirm) \[low freedom\]](#-gate-phase-b2--board-conflict-re-check-hard-gate-before-draftingconfirm-low-freedom)
- [Phase E — Falsification (before create) \[high freedom\]](#phase-e--falsification-before-create-high-freedom)
- [🔴 GATE: Phase C — Confirm before create (hard gate) \[low freedom\]](#-gate-phase-c--confirm-before-create-hard-gate-low-freedom)
- [Phase D — Create issues \[low freedom\]](#phase-d--create-issues-low-freedom)
- [Phase F — Fix-verify and close (mandatory) \[low freedom\]](#phase-f--fix-verify-and-close-mandatory-low-freedom)
- [QA closing (mandatory before "done") \[low freedom\]](#qa-closing-mandatory-before-done-low-freedom)
- [Out of scope](#out-of-scope)
- [References](#references)
- [MUST / NEVER](#must--never)

Sections appear in execution order: Phase E (falsification) runs after Phase B2 and before Phase C —
its letter is kept from the original numbering, its place is not.

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
Create bug progress:
- [ ] Refusal-first (precondition gate)
- [ ] Phase A — Intake (one message, three parts)
- [ ] Phase B — Parse target
- [ ] Phase B2 — Board-conflict re-check (hard gate, before drafting/confirm)
- [ ] Phase E — Falsification (before create)
- [ ] Phase C — Confirm before create (hard gate)
- [ ] Phase D — Create issues
- [ ] Phase F — Fix-verify and close (mandatory)
- [ ] QA closing (mandatory before "done")
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
unconfirmed → it is a **question, not a bug**: resolve it (or mark BLOCKED / ask the owner) first. Do not
file. (Root cause this prevents: a phantom label bug filed against a transliterated word never in the
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
3. **Ask, never decide** — when no Severity was given, the given word is not a matrix row, or the
   reporter's Severity row has only `N/A` / no matching cell for this defect, or the reporter gave a
   Priority that differs from the matrix cell: show that matrix row (and the cell) and ask the reporter
   to choose. A reporter-given Priority is never silently replaced by your own pick. Do not swap in another Severity or Priority yourself and do not draft the
   bug until they answer.

Steps to reproduce come only from the user's input and evidence. A step that seems missing is a
follow-up question here, never a line you add to the draft.

If the user references findings from a **prior testing-ticket** run in the same chat, reuse that evidence; do not invent details.

**Wait** until A1–A3 are sufficient to draft. Ask follow-ups only for gaps.

---

## Phase B — Parse target [medium freedom]

| Target | Detect | Pre-flight |
|--------|--------|------------|
| **GitHub** | `github.com/owner/repo` | `gh auth status`; repo exists |
| **Jira** | Domain + project key from URL | MCP `getVisibleJiraProjects` or ask user to confirm browser login |

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

**For every bug about to be filed, search the tracker/board first** — a defect the team already
discussed and concluded is *intended behavior* is not a bug, even if it looks wrong to you, and
re-filing it wastes a full file → retest → close-out round.

1. **Search the board** for existing or closed tickets covering the same **screen / field / message /
   behavior** as each candidate bug. On Jira use `searchJiraIssuesUsingJql` (search summaries **and**
   comment text — the deciding conclusion often lives in a comment, not the title); on GitHub search
   open **and** closed issues. Use the distinctive terms of the finding (the exact error text, the
   field label, the component) — not just the ticket type. No status filter, so resolved tickets are
   included. Examples:
   - Jira (`text ~` covers summary, description and comments):
     `project = <KEY> AND text ~ "\"<exact error text>\"" ORDER BY updated DESC` — then repeat with the
     field label or component name.
   - GitHub: `gh issue list --repo <owner/repo> --state all --search '"<exact error text>" in:title,body,comments'`.
2. **Read the conclusion of any match**, including resolved/closed ones. A closed ticket can still hold
   the authoritative decision.
3. **Decide per candidate:**
   - **Conflict — not a bug.** A resolved ticket records that the current behavior is correct (e.g. a
     discussion concluded the message must be exactly what the app now shows) → **drop this candidate,
     do not draft or file it.** Report to the user in chat: what you found, the ticket key, and the
     **direct link to the concluding comment** (`…/browse/KEY?focusedCommentId=<id>` or the GitHub
     comment anchor) so they can verify the reasoning themselves.
   - **Duplicate — already open.** The same defect is already filed and unresolved → do not open a
     second one; point the user at the existing ticket.
   - **No conflict.** No ticket settles it → proceed to Phase E for this candidate.
4. **Uncertain whether a match truly settles it?** Treat it as a **question to the user / PO, not a
   bug** — surface the ticket link and ask, rather than filing over a possible prior decision.
5. **The search itself cannot run** (no tracker read access, MCP down, search error) → **STOP.**
   Report the error verbatim, hold every candidate as **BLOCKED (board search not run)**, and do not
   move to Phase E or Phase C until a search has completed for each candidate.

Only candidates that clear this gate move on — to Phase E, then Phase C. Note in the confirm block
that the board was checked (see Phase C).

(Root cause this prevents: re-filing a defect against a point the team already closed with an
agreed-upon expected value.)

**Go back:** A candidate that fails this gate (conflict or duplicate) leaves the batch here. If the user or PO answers an uncertain match with "still a bug", return to item 3 of this phase and decide that candidate again. After a blocked search (item 5), return to item 1 once access is restored.

---

## Phase E — Falsification (before create) [high freedom]

Runs here — after Phase B2, before the Phase C confirm — for every candidate that cleared B2.

For each bug, if not already validated in a prior test, run every check below once and record its
result (the board-conflict search is Phase B2 — do not skip it just because a bug "looks obvious"):

| Check | How | Record |
|-------|-----|--------|
| Intentional design? | Open the design frame / AC / PRD line the expected side cites (Refusal-first) and compare char-exact with the evidence | Source link + the matching or differing text |
| Role-only or data-only? | From the reporter's evidence, note which roles / accounts / entry points showed it; if only one, ask the reporter whether another was tried (never reproduce it yourself with new steps) | Roles/accounts seen, and the reporter's answer |
| Flake? | Check the evidence for more than one occurrence (two screenshots, a repeated error, the reporter's "every time"); if a single occurrence, ask the reporter how often it happens | Occurrence count + evidence refs |

Then give each candidate one label, written on its draft summary line:

- **Confirmed** — every check passed with evidence → goes to Phase C.
- **Likely** — checks passed but one rests on the reporter's word only → goes to Phase C marked
  **Likely**; filed only if the user approves it as Likely there.
- **Needs Review** — a check failed or is still open (design source matches the app, a role/flake
  question unanswered) → **not drafted and not filed.** List it in the Phase C confirm block on the
  `Needs Review:` line with its open question; it is filed only after the user answers the question and
  it is re-checked here as Confirmed or Likely.
- **Dropped** — the check proves it is not a defect (e.g. the design shows the current behavior) →
  report it in chat with the source link, as for a Phase B2 conflict.

**Go back:** If the disproof attempt finds the item already settled in another ticket, return to Phase B2 — Board-conflict re-check for that candidate. When the user answers a Needs Review question, return to the top of this phase for that candidate. Confirmed and Likely candidates move to Phase C.

---

## 🔴 GATE: Phase C — Confirm before create (hard gate) [low freedom]

Show:

```text
━━━ Create bug — confirm before filing ━━━
Target:     {Jira PROJ / GitHub owner/repo}
Format:     {user template name or Helix default}
Board check: {N candidates searched — M dropped as already-settled/duplicate, K to file}
Fields:     {GitHub: labels that exist / labels missing + the user's choice · Jira: Priority → field, Severity → field id from the workspace guide, required fields with their values}
Bug count:  {K}
Needs Review: {none · or per item: title — open question (not drafted, not filed)}

Draft summaries:
  1. [{Severity}] {Module} — {title one line} · Priority {Priority} · {Confirmed | Likely}
  2. ...

(Full drafts below — review each body)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to create all listed bugs (a Likely item is approved as Likely by this confirm), or specify edits.
```

Then post **full drafts** (one block per bug) per [bug-draft-template.md](references/bug-draft-template.md).

**Do not call `gh issue create`, `createJiraIssue`, or browser create until the user confirms.**

**Go back:** If the user asks for edits instead of **confirm**, revise the drafts and return to the start of Phase C — show the confirm block again. Phase D waits for **confirm**.

---

## Phase D — Create issues [low freedom]

Follow [posting-discipline.md](references/posting-discipline.md).

### GitHub

```bash
gh issue create --repo <owner/repo> \
  --title "<title>" \
  --label "bug,severity:<Severity>" \
  --body "<body>"
```

`<Severity>` is the Severity in the approved draft (Low / Medium / High / Urgent). Pass only labels the
Phase B pre-flight found in the repo, or that the user created/approved; when the user chose to file
without a missing label, leave it out and say so in the Phase F report. Capture the returned issue URL.

**🔴 GATE — `gh issue create` exits non-zero** (rejected label, validation error, auth, rate limit,
network) → treat that issue as not created until `gh issue list --repo <owner/repo> --state all
--search '"<title>" in:title'` shows otherwise (a timeout can still create it — never file twice). Show
the user the stderr **verbatim**, which bugs were and were not created, and the fix you propose; **retry
nothing until the user approves.** Rate limit → say when `gh api rate_limit` reports the reset and
wait for the user's go-ahead. Never strip a label, shorten the body or switch repo to make it pass.

### Jira

1. Lock **v2 wiki** (FE/UI) vs **v3 ADF** (API) per user format — do not switch mid-session.
2. Prefer Atlassian MCP `createJiraIssue`, with the field mapping shown in the Phase C `Fields:` line
   (Priority → `priority`, Severity → the guide's field id, every required field filled).
3. **Field-validation error** (HTTP 400 / an `errors` object naming a field — required, invalid option,
   unknown custom field) → nothing was created. Show the error **verbatim**, name the field and the fix
   you propose (from the create metadata), and **wait for the user's approval** before retrying on the
   same path. Never drop or blank the field to make the create pass, and never treat this as an MCP
   failure that switches path.
4. **MCP fails** (unreachable, auth, tool error — not a field error) → pick the first path that applies, and say which one you used:
   - macOS with a logged-in browser session → JXA + Chrome fallback per posting-discipline (ASCII-only script, dry-run before post);
   - otherwise, Jira REST credentials configured (see [dependencies.md](../../../references/dependencies.md)) → REST on the locked path;
   - otherwise → **STOP**: hand the approved drafts to the user to file manually, report the run as BLOCKED (no create path), and skip to Phase F only for anything the user files and links back.

**Write the body in the markup of the path you post through**, from the first keystroke
([jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md) § The rule). One table, one rule:

| Path | Body markup | Gates in jira-wiki-vs-markdown.md |
|------|-------------|-----------------------------------|
| MCP `createJiraIssue` | markdown (MCP converts it to ADF) | Post-post: re-fetch and confirm zero literal markup left in the rendered text |
| REST v2 (`/rest/api/2/…`) — FE/UI lock | Jira wiki markup (`*bold*`, `----`, `\|\|header\|\|` with no divider row) | Pre-post string scan **and** post-post counts — both |
| REST v3 (`/rest/api/3/…`) — API lock | ADF JSON | Post-post: re-fetch and confirm zero literal markup left in the rendered text |
| JXA + Chrome fallback | the markup of the endpoint the script calls (v2 → wiki, v3 → ADF) | the gates of that endpoint's row |

A markdown body on the v2 path returns HTTP 200 and renders as garbage — the gates are the only catch.

Attach screenshots to Jira before embedding them in wiki bodies, and embed them **bare** —
`!file.png!`, resized to ~600–640 px before upload. A width parameter puts a pipe inside a
table cell and splits the row. When the workspace carries `tools/retest-guard/retest_rules.js`,
run its scanner (rule `img-width-param`); when it does not, check every embed by hand for a bare
`!file.png!` and say so.

---

## Phase F — Fix-verify and close (mandatory) [low freedom]

After Phase D create calls:

1. List each issue with **URL or key** from tool output (not guessed).
2. **Fix-verify round 1:** Open or fetch each link — confirm title/summary and body match approved draft.
3. **🔴 GATE — mismatch** (wrong project, truncated body, wrong priority/severity): show the user the
   draft-vs-destination difference and the proposed fix (edit in place, or recreate), and **wait for
   approval**. Then fix via the edit API, or recreate — when recreating, also close or link the wrong
   issue as a duplicate (with the same approval) so no stray issue stays behind → **re-fetch** each link.
4. **Maximum 2 fix-verify rounds** — then report partial success honestly.
5. If any create failed → report which succeeded and which failed.

**Go back:** If fix-verify round 1 finds a mismatch, fix it (item 3) and return to item 2 of this phase — re-fetch every link. After round 2, stop and report partial success.

MUST NOT say “all bugs created” until at least one full fix-verify round passes — because create APIs can return success with wrong content.

```text
━━━ Create bug — complete ━━━
Verdict: CREATED {N}/{N} — verified at destination
| # | Target  | Issue              | Priority |
|---|---------|--------------------|----------|
| 1 | Jira    | PROJ-456 (link)    | High     |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## QA closing (mandatory before "done") [low freedom]

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] Board-conflict search (Phase B2) ran for every candidate; any dropped as already-settled/duplicate reported to the user with the reference link.
- [ ] Every created issue has URL/key from tool output (not guessed).
- [ ] Each URL opened or fetched — title visible.
- [ ] Close-out includes `Verdict: CREATED x/y`.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (Create bug section).
- [ ] Offer **retest** after the fix; handoff if blocked.

**Go back:** If any item above is unchecked, return to the phase it names (B2, D or F) and redo from there; do not report done.

---

## Out of scope

- Running a full test pass, retest, TC prep, result updates — see [skill-routing.md](../../../references/skill-routing.md)

---

## References

| File | Use |
|------|-----|
| [bug-draft-template.md](references/bug-draft-template.md) | Default draft layout |
| [posting-discipline.md](references/posting-discipline.md) | GitHub + Jira posting, JXA rules |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

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
