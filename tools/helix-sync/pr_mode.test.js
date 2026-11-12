#!/usr/bin/env node
'use strict';
/* Pins HELIX_SYNC_MODE=pr of scripts/sync-skills-to-helix.sh (pluton-ai-agent docs/sdd/helix-auto-sync H1–H6, H9).
 * Helix main is protected by a ruleset, so the VM timer syncs through one PR from sync/ols-qa-auto:
 * content from ols-qa origin/main only, a Synced-From trailer, never a push to helix main, never an
 * edit of rule-line-register.json / token-budget.json, rule rewords + budget + parity listed in the body.
 *
 *   node tools/helix-sync/pr_mode.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SYNC = path.join(ROOT, 'scripts', 'sync-skills-to-helix.sh');
const HELPER = path.join(ROOT, 'scripts', 'git-env-clean.sh');
const PARITY = path.join(ROOT, 'scripts', 'helix-parity.sh');
const PR_MODE = path.join(ROOT, 'scripts', 'sync-skills-pr-mode.sh');
const SHARED = 'references/qa-closing-shared.md';
const BACKLOG = 'references/backlog-drift.md';
const BRANCH = 'sync/ols-qa-auto';
const RULE = 'Agents MUST keep the old rule.';

const CLEAN_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(GIT_|HELIX_)/.test(k)));

let failed = 0;
let ran = 0;
const tmpDirs = [];
function check(name, fn) {
  ran++;
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${String(e.message).split('\n').join('\n       ')}`);
  }
}
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: CLEAN_ENV, ...opts });
  if (r.error) throw r.error;
  return r;
}
function git(cwd, ...args) {
  const r = run('git', args, { cwd });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${r.stderr}`);
  return r.stdout.trim();
}
function tryGit(cwd, ...args) {
  const r = run('git', args, { cwd });
  return r.status === 0 ? r.stdout.trim() : null;
}
function identity(repo) {
  git(repo, 'config', 'user.name', 'sync-test');
  git(repo, 'config', 'user.email', 'sync-test@example.invalid');
}
function write(file, text, mode) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, mode ? { mode } : undefined);
}

// Secret guard stub: refuses any scanned file holding the planted shape (SCAN_ROOT as the real guard uses).
const SECRETS_STUB = `#!/bin/sh
root="\${SCAN_ROOT:-.}"
for f in "$@"; do grep -q 'PLANTED-SECRET' "$root/$f" 2>/dev/null && { echo "secret in $f"; exit 1; }; done
exit 0
`;
// Rule-line stub with the real script's output shape: a MUST line on <base> missing from <head> is "removed".
const RULE_LINES_STUB = `#!/bin/sh
b="$1"; h="$2"; rc=0; tmp="$(mktemp)"
for f in $(git diff --name-only "$b" "$h" -- skills references commands); do
  git show "$b:$f" 2>/dev/null | grep MUST | while IFS= read -r l; do
    git show "$h:$f" 2>/dev/null | grep -qxF "$l" || echo "rule-lines: removed from $f: $l"
  done
done | tee "$tmp"; [ -s "$tmp" ] && rc=1; rm -f "$tmp"
[ $rc = 0 ] && echo "rule-lines: pass (no MUST/NEVER/🔴/STOP/GATE line cut)"
exit $rc
`;
const BUDGET_STUB = `#!/bin/sh
echo "token-budget: session tokens 1234 of budget 2000 (fixture)"
exit 0
`;
// gh stub: logs each call, answers \`pr list\` from gh-open, keeps every --body-file.
function ghStub(base) {
  return `#!/bin/sh
printf '%s\\n' "$*" >> "${base}/gh.log"
prev=""
for a in "$@"; do
  [ "$prev" = "--body-file" ] && cp "$a" "${base}/body-$(wc -l < "${base}/gh.log" | tr -d ' ').md"
  prev="$a"
done
case "$1 $2" in
  "pr list") cat "${base}/gh-open" 2>/dev/null; exit 0 ;;
esac
exit 0
`;
}

function fixture() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-pr-'));
  tmpDirs.push(base);
  const noHooks = path.join(base, 'no-hooks');
  fs.mkdirSync(noHooks);
  const bin = path.join(base, 'bin');
  write(path.join(bin, 'gh'), ghStub(base), 0o755);

  const helixOrigin = path.join(base, 'helix-origin.git');
  const helix = path.join(base, 'helix');
  git(base, 'init', '-q', '--bare', '-b', 'main', helixOrigin);
  git(base, 'init', '-q', '-b', 'main', helix);
  identity(helix);
  git(helix, 'config', 'core.hooksPath', noHooks);
  write(path.join(helix, SHARED), `intro\n${RULE}\n`);
  write(path.join(helix, BACKLOG), 'helix version\n');
  write(path.join(helix, 'rule-line-register.json'), '{"entries": []}\n');
  write(path.join(helix, 'token-budget.json'), '{"total": 2000}\n');
  write(path.join(helix, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'helix', skills: ['./skills/helix'] }, null, 2) + '\n');
  write(path.join(helix, 'skills', 'helix', 'SKILL.md'), 'helix\n');
  write(path.join(helix, 'scripts', 'check-no-secrets.sh'), SECRETS_STUB, 0o755);
  write(path.join(helix, 'scripts', 'check-rule-lines.sh'), RULE_LINES_STUB, 0o755);
  write(path.join(helix, 'scripts', 'ci-token-budget.sh'), BUDGET_STUB, 0o755);
  for (const g of ['sync-version.sh', 'ci-check-portable-skills.sh', 'ci-check-skill-structure.sh']) {
    write(path.join(helix, 'scripts', g), '#!/bin/sh\nexit 0\n', 0o755);
  }
  git(helix, 'add', '-A');
  git(helix, 'commit', '-qm', 'init');
  git(helix, 'remote', 'add', 'origin', helixOrigin);
  git(helix, 'push', '-q', 'origin', 'main');

  const olsOrigin = path.join(base, 'olsqa-origin.git');
  const olsqa = path.join(base, 'olsqa');
  git(base, 'init', '-q', '--bare', '-b', 'main', olsOrigin);
  git(base, 'init', '-q', '-b', 'main', olsqa);
  identity(olsqa);
  git(olsqa, 'config', 'core.hooksPath', noHooks);
  write(path.join(olsqa, SHARED), `intro\n${RULE}\n`);
  write(path.join(olsqa, BACKLOG), 'ols-qa version\n');
  fs.mkdirSync(path.join(olsqa, 'scripts'), { recursive: true });
  fs.copyFileSync(SYNC, path.join(olsqa, 'scripts', 'sync-skills-to-helix.sh'));
  fs.copyFileSync(HELPER, path.join(olsqa, 'scripts', 'git-env-clean.sh'));
  fs.copyFileSync(PARITY, path.join(olsqa, 'scripts', 'helix-parity.sh'));
  if (fs.existsSync(PR_MODE)) fs.copyFileSync(PR_MODE, path.join(olsqa, 'scripts', 'sync-skills-pr-mode.sh'));
  git(olsqa, 'add', '-A');
  git(olsqa, 'commit', '-qm', 'init');
  git(olsqa, 'remote', 'add', 'origin', olsOrigin);
  git(olsqa, 'push', '-q', '-u', 'origin', 'main');
  return { base, helix, helixOrigin, olsqa, olsOrigin };
}

/** Lands `content` for SHARED on ols-qa origin/main (as a merged PR does), then leaves the local checkout behind on a feature branch. */
function mergeOnOrigin(fx, content) {
  write(path.join(fx.olsqa, SHARED), content);
  git(fx.olsqa, 'add', SHARED);
  git(fx.olsqa, 'commit', '-qm', `change ${content.split('\n')[0]}`);
  git(fx.olsqa, 'push', '-q', 'origin', 'main');
  const sha = git(fx.olsqa, 'rev-parse', 'HEAD');
  git(fx.olsqa, 'checkout', '-q', '-b', 'local-wip');
  write(path.join(fx.olsqa, SHARED), 'local work tree text that must never ship\n');
  git(fx.olsqa, 'commit', '-qam', 'wip');
  return sha;
}

function syncPr(fx, files = [SHARED], extra = {}) {
  const env = {
    ...CLEAN_ENV,
    PATH: `${path.join(fx.base, 'bin')}:${CLEAN_ENV.PATH}`,
    HELIX_REPO: fx.helix,
    HELIX_SYNC_MODE: 'pr',
    HELIX_GH_REPO: 'test/helix',
    ...extra,
  };
  const r = run('bash', [path.join(fx.olsqa, 'scripts', 'sync-skills-to-helix.sh'), ...files], { cwd: fx.olsqa, env });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}
const ghLog = (fx) => (fs.existsSync(path.join(fx.base, 'gh.log')) ? fs.readFileSync(path.join(fx.base, 'gh.log'), 'utf8') : '');
function lastBody(fx) {
  const bodies = fs.readdirSync(fx.base).filter((f) => /^body-\d+\.md$/.test(f)).sort((a, b) => parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10));
  assert.ok(bodies.length, `no PR body was written; gh calls:\n${ghLog(fx)}`);
  return fs.readFileSync(path.join(fx.base, bodies[bodies.length - 1]), 'utf8');
}

check('pr mode pushes sync/ols-qa-auto from origin/main content, leaves helix main and the helix checkout untouched, opens one PR (H1)', () => {
  const fx = fixture();
  const mainBefore = git(fx.helixOrigin, 'rev-parse', 'main');
  const checkoutBefore = git(fx.helix, 'rev-parse', 'HEAD');
  const sha = mergeOnOrigin(fx, 'intro\nAgents MUST keep the old rule.\nnew line\n');
  const { status, out } = syncPr(fx);
  assert.strictEqual(status, 0, out);
  assert.strictEqual(git(fx.helixOrigin, 'rev-parse', 'main'), mainBefore, 'helix main moved');
  assert.strictEqual(git(fx.helix, 'rev-parse', 'HEAD'), checkoutBefore, 'the helix checkout gained a commit');
  assert.strictEqual(git(fx.helix, 'status', '--porcelain'), '', 'the helix checkout was left dirty');
  assert.strictEqual(git(fx.helixOrigin, 'show', `${BRANCH}:${SHARED}`), 'intro\nAgents MUST keep the old rule.\nnew line');
  assert.strictEqual(git(fx.helixOrigin, 'log', '-1', '--format=%(trailers:key=Synced-From,valueonly)', BRANCH), `ols-qa@${sha}`);
  assert.strictEqual(git(fx.helixOrigin, 'rev-parse', `${BRANCH}~1`), mainBefore, 'the branch is not one commit on top of helix main');
  const log = ghLog(fx);
  assert.ok(/^pr list .*--head sync\/ols-qa-auto/m.test(log), `no open-PR lookup:\n${log}`);
  assert.ok(/^pr create .*--base main .*--head sync\/ols-qa-auto/m.test(log), `no PR created:\n${log}`);
  assert.ok(!/\bpr merge\b/.test(log), `the sync merged a PR (H9):\n${log}`);
  assert.ok(!/\[rule-reword\]/.test(log), `PR title carries [rule-reword] (H3):\n${log}`);
  const body = lastBody(fx);
  assert.ok(body.includes(`\`${SHARED}\``), `body does not list the file:\n${body}`);
  assert.ok(new RegExp(`Synced-From: ols-qa@${sha}\\s*$`).test(body), `body does not end with the trailer:\n${body}`);
});

check('only the named files are copied: unchanged backlog drift stays out of the diff (H2)', () => {
  const fx = fixture();
  mergeOnOrigin(fx, 'intro\nAgents MUST keep the old rule.\nv2\n');
  const { status, out } = syncPr(fx);
  assert.strictEqual(status, 0, out);
  const changed = git(fx.helixOrigin, 'diff', '--name-only', 'main', BRANCH).split('\n');
  assert.ok(changed.includes(SHARED), changed.join(','));
  assert.ok(!changed.includes(BACKLOG), `backlog drift was copied: ${changed.join(',')}`);
});

check('a reworded rule line is listed for owner approval; register and budget files stay byte-identical (H3, H4)', () => {
  const fx = fixture();
  mergeOnOrigin(fx, 'intro\nAgents MUST keep the reworded rule.\n');
  const { status, out } = syncPr(fx);
  assert.strictEqual(status, 0, out);
  const body = lastBody(fx);
  const section = body.split('### Rule rewords — owner approval needed')[1];
  assert.ok(section, `no rewords section:\n${body}`);
  assert.ok(section.split('###')[0].includes(RULE), `removed rule line not listed:\n${body}`);
  assert.ok(/### Token budget[\s\S]*session tokens 1234 of budget 2000/.test(body), `no budget result:\n${body}`);
  assert.ok(/### Helix parity \(reported, not synced\)[\s\S]*HELIX-PARITY/.test(body), `no parity summary:\n${body}`);
  assert.ok(/DIFFERS references\/backlog-drift\.md/.test(body), `parity list missing the backlog file:\n${body}`);
  for (const f of ['rule-line-register.json', 'token-budget.json']) {
    assert.strictEqual(git(fx.helixOrigin, 'diff', '--name-only', 'main', BRANCH, '--', f), '', `${f} changed on the branch`);
  }
  assert.ok(!/approved|อนุมัติแล้ว/i.test(section.split('###')[0].replace(/owner approval needed/g, '')), 'body claims an owner approval');
});

check('an open PR is updated, never a second one created; the branch is rebuilt from helix main (H1)', () => {
  const fx = fixture();
  mergeOnOrigin(fx, 'intro\nAgents MUST keep the old rule.\nfirst\n');
  assert.strictEqual(syncPr(fx).status, 0);
  fs.writeFileSync(path.join(fx.base, 'gh-open'), '7\n');
  fs.writeFileSync(path.join(fx.base, 'gh.log'), '');
  git(fx.olsqa, 'checkout', '-q', 'main');
  const sha2 = mergeOnOrigin2(fx, 'intro\nAgents MUST keep the old rule.\nsecond\n');
  const { status, out } = syncPr(fx);
  assert.strictEqual(status, 0, out);
  const log = ghLog(fx);
  assert.ok(/^pr edit 7 /m.test(log), `open PR 7 not edited:\n${log}`);
  assert.ok(!/^pr create/m.test(log), `a second PR was created:\n${log}`);
  assert.strictEqual(git(fx.helixOrigin, 'rev-list', '--count', `main..${BRANCH}`), '1', 'branch was not rebuilt as one commit');
  assert.strictEqual(git(fx.helixOrigin, 'log', '-1', '--format=%(trailers:key=Synced-From,valueonly)', BRANCH), `ols-qa@${sha2}`);
});
function mergeOnOrigin2(fx, content) {
  git(fx.olsqa, 'branch', '-D', 'local-wip');
  return mergeOnOrigin(fx, content);
}

check('a commit by someone else on the sync branch is kept: no push, the file list goes to a PR comment', () => {
  const fx = fixture();
  mergeOnOrigin(fx, 'intro\nAgents MUST keep the old rule.\nfirst\n');
  assert.strictEqual(syncPr(fx).status, 0);
  const other = path.join(fx.base, 'other');
  git(fx.base, 'clone', '-q', '-b', BRANCH, fx.helixOrigin, other);
  identity(other);
  write(path.join(other, 'rule-line-register.json'), '{"entries": ["owner"]}\n');
  git(other, 'commit', '-qam', 'owner: register entry');
  git(other, 'push', '-q', 'origin', BRANCH);
  const foreign = git(other, 'rev-parse', 'HEAD');
  fs.writeFileSync(path.join(fx.base, 'gh-open'), '7\n');
  fs.writeFileSync(path.join(fx.base, 'gh.log'), '');
  git(fx.olsqa, 'checkout', '-q', 'main');
  mergeOnOrigin2(fx, 'intro\nAgents MUST keep the old rule.\nsecond\n');
  const { status, out } = syncPr(fx);
  assert.strictEqual(status, 0, out);
  assert.strictEqual(git(fx.helixOrigin, 'rev-parse', BRANCH), foreign, 'the foreign commit was dropped');
  assert.ok(/^pr comment 7 /m.test(ghLog(fx)), `no PR comment:\n${ghLog(fx)}`);
});

check('a planted secret in the source fails the run: no branch, no PR call (H6)', () => {
  const fx = fixture();
  mergeOnOrigin(fx, 'intro\nAgents MUST keep the old rule.\nPLANTED-SECRET\n');
  const { status, out } = syncPr(fx);
  assert.notStrictEqual(status, 0, `exited 0 with a secret:\n${out}`);
  assert.ok(/OLS secret in ols-qa SOURCE/.test(out), `refused for another reason:\n${out}`);
  assert.strictEqual(tryGit(fx.helixOrigin, 'rev-parse', '--verify', '--quiet', BRANCH), null, 'branch was pushed');
  assert.ok(!/^pr (create|edit)/m.test(ghLog(fx)), `PR call made:\n${ghLog(fx)}`);
});

check('nothing new against helix main: no commit, no push, no PR', () => {
  const fx = fixture();
  const { status, out } = syncPr(fx);
  assert.strictEqual(status, 0, out);
  assert.ok(/nothing to propose/.test(out), out);
  assert.strictEqual(tryGit(fx.helixOrigin, 'rev-parse', '--verify', '--quiet', BRANCH), null, 'branch was pushed');
  assert.ok(!/^pr (create|edit)/m.test(ghLog(fx)), ghLog(fx));
});

check('an unknown HELIX_SYNC_MODE is refused before anything runs', () => {
  const fx = fixture();
  mergeOnOrigin(fx, 'intro\nAgents MUST keep the old rule.\nx\n');
  const { status, out } = syncPr(fx, [SHARED], { HELIX_SYNC_MODE: 'prr' });
  assert.notStrictEqual(status, 0, out);
  assert.ok(/HELIX_SYNC_MODE must be main or pr/.test(out), out);
  assert.strictEqual(tryGit(fx.helixOrigin, 'rev-parse', '--verify', '--quiet', BRANCH), null);
  assert.strictEqual(ghLog(fx), '');
});

for (const d of tmpDirs) {
  fs.rmSync(d, { recursive: true, force: true });
}
if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
