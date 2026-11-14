# Create bug — Phase D

Part of [WORKFLOW.md](WORKFLOW.md), opened at Phase D; every rule here is a full gate.

## Phase D — Create issues [low freedom]

Follow [posting-discipline.md](references/posting-discipline.md).

### GitHub

```bash
gh issue create --repo <owner/repo> \
  --title "<title>" \
  --label "bug,severity:<Severity>" \
  --body-file - <<'EOF'
<body>
EOF
```

`<Severity>` is the Severity in the approved draft (Low / Medium / High / Urgent). Pass only labels the
Phase B pre-flight found in the repo, or that the user created/approved; when the user chose to file
without a missing label, leave it out and say so in the Phase F report. Capture the returned issue URL.
Screenshots: gh uploads no files — embed reporter image URLs; the user attaches local files in the browser.

**🔴 GATE — `gh issue create` exits non-zero** (rejected label, validation error, auth, rate limit,
network) → run `gh issue list --repo <owner/repo> --state all --search '"<title>" in:title'` (a
timeout can still create it — never file twice): one equal title → this run's issue, record its URL; two or more → show them and ask which is this run's, create nothing; none →
not created; **the search itself fails** → **🔴 STOP:** that bug's outcome is unknown (never "not created")
— ask the user to check the repo before any retry. Show the user the stderr **verbatim**, which bugs were and were not created, and the fix you propose; **retry
nothing until the user approves.** Rate limit → say when `gh api rate_limit` reports the reset and
wait for the user's go-ahead. Never strip a label, shorten the body or switch repo to make it pass.

### Jira

1. Lock **v2 wiki** (FE/UI) vs **v3 ADF** (API) per user format — do not switch mid-session.
2. Create with Atlassian MCP `createJiraIssue`, with the field mapping shown in the Phase C `Fields:` line
   (Priority → `priority`, Severity → the guide's field id, every required field filled); another path only through item 4. No Atlassian MCP in the session → skip the search; take item 4's MCP-failure paths.
3. **🔴 GATE — Field-validation error** (HTTP 400 / an `errors` object naming a field — required, invalid option,
   unknown custom field) → nothing was created. Show the error **verbatim**, name the field and the fix
   you propose (from the create metadata), and **wait for the user's approval** before retrying on the
   same path. Never drop or blank the field to make the create pass, and never treat this as an MCP
   failure that switches path.
4. **A create call fails with a non-field error** — MCP, JXA or REST: unreachable, auth/401, 5xx, tool or script error, timeout → the create may still have gone through, so **search before any retry or path switch**:
   - Search for the approved summary with no status filter: `project = <KEY> AND summary ~ "\"<approved title>\"" ORDER BY created DESC` (`searchJiraIssuesUsingJql` or REST on the locked path); a match is a summary equal to the approved title.
   - **Found one** → it is this run's issue: record its key, do **not** create it again, and continue at Phase F. **Found two or more** → show the keys and ask which is this run's issue; create nothing.
   - **The search itself cannot run** → **STOP**: ask the user to check the board before any retry. Never create blind.
   - **Found none after an MCP failure** → pick the first path that applies, and say which one you used:
     - macOS with a logged-in browser session → JXA + Chrome fallback per posting-discipline (ASCII-only script, dry-run before post);
     - otherwise, Jira REST credentials configured (see [dependencies.md](../../../references/dependencies.md)) → REST on the locked path;
     - otherwise → **STOP**: hand the approved drafts to the user to file manually, report the run as BLOCKED (no create path), and skip to Phase F only for anything the user files and links back.
   - **Found none after a JXA or REST failure** → **🔴 GATE:** show the error verbatim and which bugs were and were not created; **retry nothing until the user approves** — never file twice.

**Write the body in the markup of the path you post through**, from the first keystroke
([jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md) § The rule). One table, one rule:

| Path | Body markup | Gates in jira-wiki-vs-markdown.md |
|------|-------------|-----------------------------------|
| MCP `createJiraIssue` | markdown (MCP converts it to ADF) | Post-post: re-fetch and confirm zero literal markup left in the rendered text |
| REST v2 (`/rest/api/2/…`) — FE/UI lock | Jira wiki markup (`*bold*`, `----`, `\|\|header\|\|` with no divider row) | Pre-post string scan **and** post-post counts — both |
| REST v3 (`/rest/api/3/…`) — API lock | ADF JSON | Post-post: re-fetch and confirm zero literal markup left in the rendered text |
| JXA + Chrome fallback | the markup of the endpoint the script calls (v2 → wiki, v3 → ADF) | the gates of that endpoint's row |

Embed screenshots **bare** — `!file.png!`, resized to 640 px wide before upload (macOS `sips -Z 640 <file>`, then `sips -g pixelWidth <file>` reads the width; elsewhere any image tool, then read the width). A width parameter puts
a pipe inside a table cell and splits the row. The attachments endpoint needs an issue key
(`issueIdOrKey`), so for a **new bug** create the issue first with a body that has no image embed, then
upload the attachments to the returned key, then update the body to embed them bare, then re-fetch the
issue and confirm every embed rendered (not a literal `!file.png!`). "Attach before embed" applies only
to an issue that already has a key. If an upload fails (rejected type, size limit, permission, any
non-2xx) → **🔴 GATE:** show the error verbatim, do not post a body that embeds the missing file, and ask the user:
retry the upload, leave the image out (embed line removed from the draft, shown again for **confirm**),
or attach it by hand. When the issue is created but the attach failed, also tell the user the issue key
that now exists. Never continue on your own. When the workspace carries `tools/retest-guard/retest_rules.js`,
run its scanner (rule `img-width-param`); when it does not, check every embed by hand for a bare
`!file.png!` and say so.

**Go back:** a field or upload error whose fix the user approves → retry that same step. The user files by hand → Phase F for each issue they link back. Any edit to a draft body → return to Phase C and show the confirm block again.
