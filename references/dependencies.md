# Dependencies — what each skill needs, how to check it, how to get it

Every skill's `## Dependencies` section names the rows below that it uses. Run the **Check** for each
named row before step 1. A failed check is a stop: install it, use the stated fallback, or report the
step as BLOCKED with the missing dependency named. Never skip the step silently, never guess a path.

Paths are never machine paths. A local root (secrets folder, a clone, the QA tools folder) is a
placeholder resolved from the workspace project guide (`references/{PROJECT}-guide.md` in the
workspace under test), or asked once and saved there.

## Runtimes and CLIs

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| Node.js 18 or newer (CI uses 20) | `node -v` | Node.js LTS from nodejs.org, or a version manager (`nvm install 20`) |
| Python 3 | `python3 --version` | OS package manager or python.org |
| `openpyxl` (xlsx export only) | `python3 -c "import openpyxl"` | `python3 -m pip install --user openpyxl`; without it, warn the user and ask before falling back to CSV — never silently produce CSV when xlsx was requested |
| `pypdf` (PDF summary check) | `python3 -c "import pypdf"` | `python3 -m pip install --user pypdf` |
| `requests` (Python scripts that call APIs) | `python3 -c "import requests"` | `python3 -m pip install --user requests` |
| ffmpeg / ffprobe (clips) | `ffmpeg -version && ffprobe -version` | OS package manager (`brew`, `apt`, `winget`) |
| curl | `curl --version` | OS package manager. Behind a TLS-inspecting proxy pass the CA bundle from the project guide with `--cacert` |
| git | `git --version` | OS package manager |
| GitHub CLI `gh` | `gh --version && gh auth status` | cli.github.com, then `gh auth login` |
| Playwright (in the project under test only) | `npx playwright --version` then `npx playwright test --list` | `npm i -D @playwright/test && npx playwright install chromium` inside that project; never install into the skill repo |
| TypeScript / ESLint (e2e repo fixes only) | `npx tsc -v && npx eslint -v` | the e2e repo's own `npm ci` |
| `rtk` (optional output filter) | `command -v rtk` | optional; when absent run the bare command |
| macOS-only tools (`sips`, `osascript`, `scutil`) | `command -v sips` (or the tool named) | macOS only. On other systems use the stated alternative (ImageMagick for `sips`; the REST/MCP path instead of JXA; the VPN client's own status command instead of `scutil`) or mark the step BLOCKED |

## In-repo guard tools (run only when the workspace carries them)

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| `tools/result-gate`, `tools/retest-guard`, `tools/ask-guard`, `tools/lane-lease-check`, `tools/run-time`, `tools/adoption-check` | `test -f tools/<name>/<script>.js && node -v` | none to install (plain Node, no packages). When the workspace has no `tools/<name>/`, apply the same rule by hand and say so |

## Out-of-repo tools

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| QA capture and verify tools (recorder, `verify_video.py`, `verify_shot.py`, `freeze_cut.py`, reconcilers) and the smoke templates | `test -d "{QA_TOOLS_ROOT}/capture"` | live outside this repo, with the QA bot tooling. `{QA_TOOLS_ROOT}` comes from the project guide; when missing, stop and ask for it — evidence that needs them is BLOCKED until they run |
| Clones of the product repo and the e2e repo | `git -C "{MONOREPO}" rev-parse --is-inside-work-tree` (same for `{E2E_REPO}`) | `git clone` from the URL in the project guide |
| Private evidence repo (test-data files and covers) | `git -C "{EVIDENCE_REPO}" rev-parse --is-inside-work-tree` | ask the owner for access; never substitute self-written content |
| Local image API (cover generation) | `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:{IMAGE_API_PORT}/` returns 200 | start the app and enable its API; else BLOCKED |
| Secrets folder and token files | `test -r "{SECRETS_DIR}/{SECRETS_FILE}"` | ask the owner; never guess a path, never commit a resolved value |

## Agent skills and plugins

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| `superpowers:systematic-debugging` (every skill: any failure, error or mismatch) | the name appears in the session's available-skills list | install the superpowers plugin via `/plugin`; fallback: a debugging skill the session lists (e.g. `engineering:debug`) with the same reproduce → root cause → fix → verify order |
| `engineering:testing-strategy` (retest, testing ticket, review result) | listed in available skills | install the engineering plugin via `/plugin`; fallback: write the test strategy inline before running |
| `superpowers-chrome:browsing` (browser fallback) | listed in available skills | install via `/plugin`; fallback: the browser MCP below |
| `superpowers:writing-skills` (maintainers editing a skill) | listed in available skills | install via `/plugin` |

## MCP servers and accounts

| Dependency | Check | Install / fallback |
|------------|-------|--------------------|
| Atlassian (Jira / Confluence) MCP | call a read-only tool (e.g. list visible Jira projects) and get a result | connect it in the client's connector settings; fallback: Jira REST with the user's own email + API token |
| Jira REST credentials (ADF-direct publish, REST fallback) | `curl -s -o /dev/null -w '%{http_code}' -u "{JIRA_EMAIL}:{JIRA_TOKEN}" https://{JIRA_DOMAIN}/rest/api/3/myself` returns 200 | the user creates an API token in their Atlassian account; never reuse another person's token |
| Figma (Dev Mode MCP or browser view) | open the design node and read one frame | enable Dev Mode MCP, or view the file in a browser session; when neither opens, design comparison is "not verified" |
| Browser automation MCP (Chrome extension or equivalent) | list tabs and get a result | install and connect the extension; else BLOCKED for steps that need a real browser |
| Qase (TC suite tree, FE prep import) | open the project's suite tree | ask the owner for access; export the CSV anyway |
| Notify channel webhook / bot — tc-review: its project's TC-review channel on every run (owner decision 20/Oct); every other workflow: only on an explicit share request | the webhook or bot id is in the secrets folder; the channel comes from the project guide (`references/{PROJECT}-guide.md` § TC review notify) | ask the owner; never invent a channel, thread or id |
