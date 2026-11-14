# Dependencies — what each skill needs, how to check it, how to get it

Each skill's `## Dependencies` names the rows it uses. Run the **Check** for each
named row at the skill's dependency step (before its first phase), or at the later point that section names. A failed check is a stop: install it, use the stated fallback, or report the
step as BLOCKED with the missing dependency named. Never skip the step silently, never guess a path.

Paths are never machine paths: a local root is a placeholder from the workspace project guide
(`references/{PROJECT}-guide.md`), or asked once and saved there.

## Runtimes and CLIs

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| Node.js 18 or newer (CI uses 20) | `node -v` | Node.js LTS from nodejs.org, or a version manager (`nvm install 20`) |
| Python 3 | `python3 --version` | OS package manager or python.org |
| `openpyxl` (xlsx export only) | `python3 -c "import openpyxl"` | Never install it yourself: show `python3 -m pip install --user openpyxl` for the user to run; ask before falling back to CSV |
| `pypdf` (PDF summary check) | `python3 -c "import pypdf"` | `python3 -m pip install --user pypdf` |
| `requests` (Python scripts that call APIs) | `python3 -c "import requests"` | `python3 -m pip install --user requests` |
| ffmpeg / ffprobe (clips) | `ffmpeg -version && ffprobe -version` | OS package manager (`brew`, `apt`, `winget`) |
| curl | `curl --version` | OS package manager. Behind a TLS-inspecting proxy pass the CA bundle from the project guide with `--cacert` |
| git | `git --version` | OS package manager |
| GitHub CLI `gh` | `gh --version && gh auth status` | cli.github.com, then `gh auth login` |
| Playwright (in the project under test only) | `npx playwright --version` then `npx playwright test --list` | `npm i -D @playwright/test && npx playwright install chromium` inside that project; never install into the skill repo |
| TypeScript / ESLint (e2e repo fixes only) | `npx tsc -v && npx eslint -v` | the e2e repo's own `npm ci` |
| `rtk` (optional output filter) | `command -v rtk` | absent → run the bare command |
| macOS-only tools (`sips`, `osascript`, `scutil`) | `command -v sips` (or the tool named) | macOS only. Elsewhere use the stated alternative (ImageMagick for `sips`; REST/MCP instead of JXA; the VPN client's status command instead of `scutil`) or mark the step BLOCKED |

## In-repo guard tools (run only when the workspace carries them)

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| `tools/result-gate`, `tools/retest-guard`, `tools/ask-guard`, `tools/lane-lease-check`, `tools/run-time`, `tools/adoption-check` | `test -f tools/<name>/<script>.js && node -v` | nothing to install (plain Node). No `tools/<name>/` in the workspace → apply the same rule by hand and say so |

## Out-of-repo tools

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| QA capture and verify tools (recorder, `verify_video.py`, `verify_shot.py`, `freeze_cut.py`, reconcilers) and the smoke templates | `test -d "{QA_TOOLS_ROOT}/capture"` | outside this repo; missing → stop, ask the user to clone the QA tooling and set `{QA_TOOLS_ROOT}`; evidence needing them is BLOCKED until then; stills or Playwright `recordVideo` never stand in |
| Clones of the product repo and the e2e repo | `git -C "{MONOREPO}" rev-parse --is-inside-work-tree` (same for `{E2E_REPO}`) | `git clone` from the URL in the project guide |
| Private evidence repo (test-data files and covers) | `git -C "{EVIDENCE_REPO}" rev-parse --is-inside-work-tree` | ask the owner for access; never substitute self-written content |
| Local image API (cover generation) | `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:{IMAGE_API_PORT}/` returns 200 | start the app and enable its API; else BLOCKED |
| Secrets folder and token files | `test -r "{SECRETS_DIR}/{SECRETS_FILE}"` | ask the owner; never commit a resolved value |

## Agent skills and plugins

`/plugin` below is Claude Code's installer; another runtime uses its own.

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| `superpowers:systematic-debugging` (every skill: any failure, error or mismatch) | listed in available skills | install the superpowers plugin (`/plugin` or host installer); fallback: [root-cause-investigation § 0](root-cause-investigation.md), then [qa-debug-discipline](qa-debug-discipline.md) |
| `engineering:testing-strategy` (retest, testing ticket, review result) | listed in available skills | install the engineering plugin via `/plugin`; fallback: write the test strategy inline before running |
| `superpowers-chrome:browsing` (browser fallback) | listed in available skills | install via `/plugin`; fallback: the browser MCP below |
| `superpowers:writing-skills` (maintainers editing a skill) | listed in available skills | install via `/plugin` |

## MCP servers and accounts

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| Atlassian (Jira / Confluence) MCP | call a read-only tool (e.g. list visible Jira projects) and get a result | connect it in the client's connector settings; fallback: Jira REST with the user's own email + API token; `helix` keeps routing and asks for the pasted ticket text |
| Jira REST credentials (REST publish or fallback) | `curl -s -o /dev/null -w '%{http_code}' -u "{JIRA_EMAIL}:{JIRA_TOKEN}" https://{JIRA_DOMAIN}/rest/api/3/myself` returns 200 | the user creates an API token in their Atlassian account; never reuse another person's token; browser-tab publishers need no token: tc-api-prep checks it only at its REST fallback, tc-fe-prep never |
| Figma (Dev Mode MCP or browser view) | open the design node and read one frame | enable Dev Mode MCP, or view the file in a browser session; when neither opens, design comparison is "not verified" |
| Browser automation MCP (Chrome extension or equivalent) | list tabs and get a result | install and connect the extension; else BLOCKED for steps that need a real browser |
| Qase (TC suite tree, FE prep import) | open the project's suite tree, or the user pastes it | ask the owner for access; still unreadable → tc-fe-prep Step 6 suite gate: no CSV, export **Not exported** |
| Notify channel webhook / bot — tc-review: its project's TC-review channel on every run; testing-ticket: every round when the project guide configures a QA notify channel (results-update G8); retest-bug: every retest at its Step 9 notify; every other workflow: only on an explicit share request | the webhook or bot id is in the secrets folder; the channel comes from the project guide (`references/{PROJECT}-guide.md` § TC review notify) | ask the owner; never invent a channel, thread or id |
