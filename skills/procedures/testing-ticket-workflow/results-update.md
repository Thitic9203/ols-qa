# Testing ticket — update results elsewhere (Phase G)

Part of [WORKFLOW.md](WORKFLOW.md). Section moved verbatim; read when the run updates an external results destination.

## Contents

- [Phase G — Optional: update results elsewhere \[low freedom\]](#phase-g--optional-update-results-elsewhere-low-freedom)
  - [G1 — Destination wanted? (from the guide)](#g1--destination-wanted-from-the-guide)
  - [G2 — Destination details (from the guide)](#g2--destination-details-from-the-guide)
  - [G3 — Update plan (a line item in the single approval popup)](#g3--update-plan-a-line-item-in-the-single-approval-popup)
  - [G4 — Access and read first](#g4--access-and-read-first)
  - [G5 — Apply updates](#g5--apply-updates)
  - [G5·M — Usage marker (last line of the tracker summary comment)](#g5m--usage-marker-last-line-of-the-tracker-summary-comment)
  - [G6 — Review before “complete” (mandatory)](#g6--review-before-complete-mandatory)
  - [G7 — Close](#g7--close)
  - [G8 — QA result notify (mandatory when a channel is configured)](#g8--qa-result-notify-mandatory-when-a-channel-is-configured)

---

## Phase G — Optional: update results elsewhere [low freedom]

G1–G3 collapse into the F5 end-of-round bundle
([round-time-contract.md §2–§3](../../../references/round-time-contract.md)) — no separate questions
and no separate confirm.

### G1 — Destination wanted? (from the guide)

Whether results go somewhere else (Jira comment, Google Sheet, Confluence table, CSV file, etc.) is read
from the workspace guide's results destination. If the guide has no entry, ask **once** — in the
Phase A grouped intake or the F5 decisions popup — and save the answer to the guide immediately.

- **None** → Reply: *Testing ticket session complete.* **Stop here.**
- **A destination** → G2.

### G2 — Destination details (from the guide)

Read from the guide; ask once and save immediately only for what is missing:

1. **Link** — full URL to the destination (Jira issue, Sheet, Confluence page, file path in repo if applicable).
2. **Columns** — which columns or fields to update (names or letters, e.g. `Result`, `Tester`, `Date`, `Notes`).
3. **Formats** — per-column rules if specific (e.g. `Result` = `PASSED`/`FAILED` only; `Date` = `YYYY-MM-DD`; language; no bare ticket keys in Jira wiki).

### G3 — Update plan (a line item in the single approval popup)

The update plan is listed in the F5 approval popup next to every other action — not a separate gate:

```text
Result update — destination: {link}
  Columns: {Column A}: {format rule} · {Column B}: {format rule}
  Rows to update: {count} — mapped from scenarios 1..N
```

Approval of that popup covers G4–G7; there is no second approval.

### G4 — Access and read first

- Open or fetch the destination (browser, API, MCP, or file read).
- **Match existing layout** — headers, row order, language, status vocabulary already in use.
- For Google Sheets: read headers and sample rows before writing. **Detect the result columns from the header row — never assume fixed column letters**, and confirm the tab name and tab id refer to the same tab.
- For Jira comments: draft in chat; use v2 wiki vs v3 ADF per project guide if present. **The chat draft's markdown is not the posted body** — on the v2 path rewrite it as wiki markup and run both gates in [jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md); markdown posts with HTTP 200 and renders wrong. The render and media check on the **final** body (render locally in the guide's format; every referenced image/clip resolves to an existing attachment) runs in F5 **before** the approval popup — a failure blocks the popup until fixed ([round-time-contract.md §6](../../../references/round-time-contract.md)).
- If access fails (auth, 403, VPN) → report exactly what failed; **do not claim success.**

**Go back:** If access fails, return to G2 — Destination details once the user supplies working access; nothing is written meanwhile.

**Claim the scope (layer 1 — hard gate).** Snapshot the destination, then classify every target
row: untested (empty / `NOT STARTED`, no result text, no links) or written by an earlier run of
yours = **yours to write**; anything a person filled in = **not yours**. Drop the not-yours rows
here and list them for the user. Same for a shared evidence folder: note which files already
exist and were not uploaded by you. **When the project uses a shared evidence folder, organize
uploads one subfolder per test-case id** (e.g. `<ticket>/<TC-ID>/…`) rather than dropping every
file flat in the ticket folder — follow the project guide's exact folder scheme and upload command
if one is specified. See [result-update-discipline.md](references/result-update-discipline.md).

### G5 — Apply updates

- Write **every** planned row/cell/comment field **that this run owns** — and nothing else.
- Map each test scenario to the correct row (by TC id, row number, or user mapping), and **anchor
  on the row's own identifier**: if the id in that row is not the case you are recording, skip it.
- **Re-read each row immediately before writing** (layer 2) — if it changed since G4, someone is
  editing it; skip that row rather than overwrite.
- Never overwrite, rename, delete, reorder, or reformat anything a person put there — and never
  reuse an existing file's link as this run's evidence. Refusing is a correct outcome: record
  "not written — owned by someone else" and carry on.
- **Do not damage what you do write:** never put a literal over a cell holding a formula; send
  text so the sheet cannot re-read it as a formula/date/number (`=`, `+`, `-`, `@`, `1/2`,
  `2026-07-23`, `007`); and make every row exactly as wide as the range so nothing shifts into
  the wrong column.
- Include evidence references where the format allows (screenshot names, bug keys as `{{KEY}}` in Jira wiki).
- **A FAILED/BLOCKED row carries its F3 write-up, not just the word "FAILED".** Whatever the destination
  allows (actual-result cell, Jira comment, remark column) must state which entry points reproduce it,
  the expected line verbatim vs what actually happens, **the root cause with its `Confirmed` /
  `Suspected` / `Unknown — not investigated` label**, and — when the deviation is from the written
  expectation rather than a broken feature — who decides between updating the expectation and changing
  the code. A bare status forces the next reader back to you.
- **The cause label travels with the sentence.** If the destination is too narrow for the full E2
  block, write the one-sentence cause **with its label** and link the full block; never publish a
  `Suspected` cause with its label stripped off.

### G5·M — Usage marker (last line of the tracker summary comment)

🔴 **Every summary comment this run posts on the ticket ends with the usage marker, after one blank
line** — the same anchor the retest skill uses, so one tracker search (`comment ~ "retestskillmarker"`)
counts both skills, and `skill=` tells them apart:

```text
*Test run time:* {minutes} min — includes evidence capture ({screenshots|screenshots and video}); excludes re-checks, design lookup and comment drafting

_retestskillmarker · skill=testing-ticket · src={ols-qa|helix} · via={testing-ticket|testing-ticket-workflow|helix-menu} · agent={claude-code|cursor|codex|copilot|other} · result={PASSED|FAILED|BLOCKED|PWMI} · passed={n} · failed={n} · pwmi={n} · blocked={n}_
```

Fill it from the run, never guess: `src=helix` from the Helix plugin, `src=ols-qa` from this repo;
`via` = the command or skill the user invoked; `agent` = the AI tool doing the run. `result` = the
overall result the F1 executive summary states; `passed` / `failed` / `pwmi` / `blocked` = the F2 row
counts per verdict (they add up to the F2 row count).
Values are single words or digits — no spaces, no `/`. A comment edited in place keeps the marker as
its last line, unchanged. Chat-only rounds (nothing posted) carry no marker and are not counted.

🔴 **The line just above the marker = the measured test run time (one blank line between) — never estimate it.**
Right before drafting the summary comment, measure over **every lane's** evidence/result directories
(screenshots, clips, `results.jsonl`):

```bash
node tools/run-time/measure.js --dirs {lane1_evidence_dir},{lane2_evidence_dir} [--gap-s 120]
```

It prints `{method, minutes, bursts, files, gapS, hasVideo}` (method `evidence-burst-v1`): the file write
times of all lanes as one union, split into bursts wherever no file was written for more than 120 s, and
the burst durations summed — so it counts running and evidence capture, and leaves out idle time,
re-checks, design lookup and comment drafting. Put `minutes` in the line; `hasVideo` picks "screenshots"
or "screenshots and video". Exit 2 = it could not measure (a lane directory is missing, or no evidence
files) — fix the directory list; never type a number instead. When the workspace has no such tool,
measure by the same method by hand (list every evidence file's modification time across all lanes, split
at gaps over 120 s, sum the bursts) and say in the chat report that it was measured by hand. This comment
has no renderer or guard — check the line by eye in the F5 render check before the approval popup.

### G6 — Review before “complete” (mandatory)

Before telling the user updates are done:

1. **Re-open or re-fetch** the destination.
2. **Checklist:**
   - [ ] Every scenario from Phase F2 has a corresponding update (or documented skip reason).
   - [ ] Column values match agreed formats.
   - [ ] No partial rows, empty required cells, or wrong ticket/sheet tab.
   - [ ] Jira/Confluence: comment or table visible as intended (not draft-only unless user asked draft).
   - [ ] **No literal `<br>`, HTML tags, or stray markup** visible as text in any cell.
   - [ ] **Numbered items** each on a separate line — not running together on one line.
   - [ ] **Nothing outside this run's own cells/files changed** (layer 3): diff the destination
         against the G4 snapshot. Anything else changed → restore it from the snapshot, stop, and
         tell the user. Existing files in a shared folder still present and unmodified.
   - [ ] Every **refused / skipped** row is listed in the report with the reason.
   - [ ] **Nothing was damaged**: written cells read back exactly what was sent, every formula
         that was there is still a formula, no new `#REF!/#NAME?/#VALUE!/#N/A` anywhere, and the
         header row is unchanged.
3. If any mismatch → fix and re-check. **Maximum 3 fix rounds** — then report specific failures with best available workaround (see [jira-comment-post-review.md](../../../references/jira-comment-post-review.md)).

**Go back:** If a G6 check fails, fix and return to G5 — Apply updates for the failing rows, then run G6 again from item 1 (max 3 rounds). A layer-3 diff failure restores from the G4 snapshot and stops. G7 waits.

### G7 — Close

Only after G6 passes:

```text
━━━ Result update complete ━━━
Updated: {link}
Rows/fields written: {summary}
Verified: {what you re-read}
Adoption: {Counted in … | NOT counted yet — …}   (see below)
Notify: {helper success line + message id | not configured — no channel in the guide}   (G8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

🔴 **Adoption count — verify, then say it in the chat close-out.** After the result comment is posted, check
that the ticket is counted by the project's AI-skill adoption dashboard (the project guide names it — by
placeholder `<ADOPTION_DASHBOARD_URL>` in shared files; the real URL lives in local secrets). The dashboard
runs the tracker search `comment ~ "retestskillmarker"` and counts a ticket when one of its comments carries
the marker (created after its snapshot cutoff). Run the same search scoped to this ticket and confirm the
marker is the last line of the posted comment:

```bash
TRACKER_BASE_URL=https://{JIRA_DOMAIN} TRACKER_EMAIL=… TRACKER_API_TOKEN=… \
  node tools/adoption-check/check.js --key {ISSUE_KEY} [--cutoff {snapshot cutoff}] [--dashboard {dashboard URL}]
```

It runs `key = {ISSUE_KEY} AND comment ~ "retestskillmarker"` on the tracker's current search endpoint
(`POST /rest/api/3/search/jql`), then reads the comments: exit 0 = counted · 1 = not counted (the reason says
why) · 2 = cannot check. When the workspace has no such tool, run that search by hand and open the posted
comment to confirm the marker is its last line. The chat close-out MUST then carry exactly one of:

- `Counted in <ADOPTION_DASHBOARD_URL> — tab AI Skill Adoption Overview (dashboard refreshes every 5 minutes)`
- `NOT counted yet — {reason from the search / comment read}` (also when the check could not run — say why)

Never claim it without the search result.

If verification failed partially, state what succeeded and what did not — NEVER say “complete” for unverified work — because partial writes look finished to stakeholders.

### G8 — QA result notify (mandatory when a channel is configured)

When the project guide configures a QA notify channel, this step is **mandatory** on every round — whoever
started the run, asked for a notify or not. It is covered by the Step 4 approval bundle (channel + resolved
recipient), so there is no second approval.

- **The agent sends the notify itself — every time.** Load the helper's transport (webhook, credentials,
  flags) from where the project guide says it lives, and run the real send yourself; never hand the send
  command to the user.
- Recipient = the ticket's **QA Owner** field the guide names, read fresh from the ticket for this send —
  never the Reporter, never a name from another ticket.
- Dry-run first and check: ticket key + title, PASS/FAIL/BLOCKED counts equal the posted result, result
  link opens the posted comment, recipient matches the QA Owner field.
- A helper skip / "transport unavailable" result is not a send: re-read the project guide's notify section
  and every file or note it points to, fix the input, and send again —
  never state a cause you have not checked.
- The round is not closed until the helper prints its success line (the guide names it); put that line and
  the message id on the G7 `Notify:` line.

---
