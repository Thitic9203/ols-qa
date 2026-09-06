#!/usr/bin/env node
'use strict';

/* Pins the staging rules.
 *
 * Both directions are pinned, and the ALLOW direction is the one that keeps this alive: a
 * guard that refuses `git add path/to/file.js` gets deleted the same afternoon, and takes the
 * protection with it.
 *
 *   node tools/git-staging-guard/staging_rules.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./staging_rules');

const ROOT = path.join(__dirname, '..', '..');
let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}
const isDir = (p) => ['tools', 'tools/', 'skills', '.claude', 'docs'].includes(p);
const d = (cmd) => R.decideCommand(cmd, isDir);

check('the exact command that caused the incident is refused', () => {
  // ceddf08 staged by path and swept another session's in-flight files onto main.
  assert.ok(d('git add CLAUDE.md tools/ skills/').block);
  assert.ok(d('git add tools/').block);
});

check('every broad form of staging is refused', () => {
  for (const c of [
    'git add -A', 'git add --all', 'git add -A .', 'git add .', 'git add ./', 'git add :/',
    'git add -u', 'git add --update', 'git add "*"', 'git add tools',
    'git commit -a', 'git commit --all', 'git commit -am "x"', 'git commit -a -m "x"',
  ]) assert.ok(d(c).block, `ไม่บล็อก: ${c}`);
});

check('a wrapper word in front does not hide the git command', () => {
  // This machine rewrites git commands through a proxy — RTK.md: "All other commands are
  // automatically rewritten by the Claude Code hook. Example: `git status` → `rtk git
  // status` (transparent, 0 tokens overhead)". Measured 2026-09-06 against the live hook:
  // `git add -A` exited 2 (blocked) while `rtk git add -A` exited 0 (allowed), so on this
  // machine the guard written for the ceddf08 incident was not in the path at all.
  for (const c of [
    'rtk git add -A', 'rtk git add .', 'rtk git commit -a',
    'command git add -A', 'sudo git add .', 'env git add -A',
    'nohup git add -A', '/usr/bin/env git add .',
    'GIT_DIR=.git git add -A',
  ]) assert.ok(d(c).block, `wrapper hid the command: ${c}`);
});

check('a wrapper word does not turn an explicit path into a refusal either', () => {
  for (const c of [
    'rtk git add CLAUDE.md',
    'command git add tools/git-staging-guard/staging_rules.js',
    'sudo git add -- a.js b.sh',
  ]) assert.strictEqual(d(c).block, false, `wrapper caused a false block: ${c}`);
});

check('explicit file staging is never refused', () => {
  for (const c of [
    'git add CLAUDE.md',
    'git add tools/git-staging-guard/staging_rules.js',
    'git add -- a.js b.sh',
    'git add .claude/hooks/investigation-rule.sh .claude/settings.json',
    'git add path/to/deeply/nested/file.md',
  ]) assert.strictEqual(d(c).block, false, `บล็อกผิด: ${c}`);
});

check('a path the SHELL expands is refused — the guard cannot read what it will become', () => {
  // `git add tools/*` stages exactly what the incident staged; the expansion happens before git
  // runs, so the typed command shows one innocent-looking argument.
  for (const c of [
    'git add tools/*', 'git add *.js', 'git add ./tools/*', 'git add tools/**',
    'git add $(git diff --name-only)', 'git add `ls`', 'git add "$(ls)"',
    'git add -- src/*.ts', 'git add file[0-9].txt',
  ]) assert.ok(d(c).block, `ไม่บล็อก: ${c}`);
});

check('an ordinary path with no metacharacter is still allowed', () => {
  for (const c of [
    'git add tools/git-staging-guard/staging_rules.js',
    'git add docs/post-mortem/PENDING.md CLAUDE.md',
    'git add ../sibling/file.md',
  ]) assert.strictEqual(d(c).block, false, `บล็อกผิด: ${c}`);
});

check('an operator INSIDE quotes is text, not a command boundary', () => {
  // This blocked two of this repo's own review commands: a script that merely quoted a staging
  // command was torn at the pipe inside the quotes, and the tail parsed as a real one.
  const g = 'GG';
  for (const c of [
    `echo "note | ${g} here"`,
    `git commit -m "before | ${g} after"`,
    `echo 'a && ${g}'`,
    `printf "%s" "x ; ${g}"`,
  ]) assert.strictEqual(d(c.replace(/GG/g, 'git add -A')).block, false, `บล็อกผิด: ${c}`);
});

check('an operator OUTSIDE quotes still splits — the fix must not blunt the guard', () => {
  for (const c of [
    'echo "safe text" && git add -A',
    'echo hi | git add -A',
    'echo "a | b" ; git add -A',
    'false || git add -A',
  ]) assert.ok(d(c).block, `ไม่บล็อก: ${c}`);
});

check('reading, diffing and ordinary committing are untouched', () => {
  for (const c of [
    'git status --short', 'git diff --cached --stat', 'git log --oneline -5',
    'git commit -m "msg"', 'git commit -F -', 'git push origin main',
    'git show HEAD', 'git stash list', 'git add -p',
  ]) assert.strictEqual(d(c).block, false, `บล็อกผิด: ${c}`);
});

check('a broad stage hidden later in a chained line is still caught', () => {
  assert.ok(d('cd /tmp && git add -A && git commit -m x').block);
  assert.ok(d('git status; git add .').block);
  assert.ok(d('git fetch origin && git add tools/ || true').block);
});

check("git's own global options do not hide the subcommand", () => {
  assert.ok(d('git -C /repo add -A').block);
  assert.ok(d('git -c user.name=x commit -am "y"').block);
  assert.strictEqual(d('git -C /repo add file.js').block, false);
});

check('a full binary path does not slip past', () => {
  assert.ok(d('/usr/bin/git add -A').block);
  assert.strictEqual(d('/usr/bin/git add file.js').block, false);
});

check('a bare word is treated as a file when directory-ness is unknown', () => {
  // The module cannot know the cwd, so it must not guess. Erring toward ALLOW here is
  // deliberate; the hook injects a real stat and catches the directory case.
  assert.strictEqual(R.decideCommand('git add tools', () => false).block, false);
  assert.ok(R.decideCommand('git add tools', () => true).block);
});

check('a non-git command that merely contains the words is left alone', () => {
  for (const c of ['echo "git add -A"', 'grep -r "git commit -a" docs/', 'cat notes-git-add.md']) {
    assert.strictEqual(d(c).block, false, `บล็อกผิด: ${c}`);
  }
});

check('the refusal names the offending segment, not just "blocked"', () => {
  const r = d('cd x && git add -A');
  assert.ok(r.segment.includes('git add -A'));
  assert.ok(r.reason.includes('git add -A'));
});

check('the guard is wired into settings.json as a PreToolUse Bash hook', () => {
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
  const pre = (s.hooks.PreToolUse || []).filter((g) => g.matcher === 'Bash')
    .flatMap((g) => (g.hooks || []).map((h) => h.command)).join(' ');
  assert.ok(pre.includes('git-staging-guard.sh'), 'hook ไม่ได้ต่อสายไว้ — กฎมีอยู่แต่ไม่มีอะไรเรียกใช้');
  assert.ok(fs.existsSync(path.join(ROOT, '.claude', 'hooks', 'git-staging-guard.sh')));
});

check('the pre-push gate exists and tests the pushed commit, not the working tree', () => {
  const p = path.join(ROOT, 'scripts', 'hooks', 'pre-push');
  assert.ok(fs.existsSync(p), 'pre-push หายไป — ครึ่งฟีเจอร์ขึ้น main ได้อีก');
  const src = fs.readFileSync(p, 'utf8');
  assert.ok(src.includes('worktree add'), 'pre-push เลิกตรวจ commit ที่จะ push แล้วไปตรวจ working tree แทน');
  // เดิมบรรทัดนี้ตรึง "ต้องมี glob เขียนอยู่ในไฟล์" ซึ่งเป็นการตรึง *วิธีเขียน* ไม่ใช่ *คุณสมบัติ*
  // 2026-09-06 pattern ถูกย้ายไปอยู่ที่เดียวคือ scripts/list-test-suites.sh เพราะตอนที่มันถูก
  // เขียน 2 ที่ (ที่นี่กับไฟล์ CI) 2 ที่นั้นเพี้ยนจากกัน — ฝั่ง CI ปฏิเสธเมื่อไม่เจอชุดเทสต์
  // ฝั่ง pre-push ไม่ปฏิเสธ จึงพิมพ์ว่าเขียวทับ commit ที่ไม่เคยวัด (รายงาน #0006)
  // เจตนาของข้อนี้ไม่เปลี่ยน: pre-push ต้องรันชุดเทสต์ทั้งหมด — รับได้ทั้ง 2 วิธี
  assert.ok(
    /tools\/\*\/\*\.test\.js/.test(src) || src.includes('list-test-suites.sh'),
    'pre-push ไม่ได้รันชุดเทสต์ทั้งหมดแล้ว',
  );
  assert.ok(!src.includes('|| break'), 'ใช้ || break ซึ่งคืน 0 เสมอ — gate จะรายงานผ่านทั้งที่เทสต์แดง');
});

check('the rule is written in CLAUDE.md, not only in code', () => {
  const md = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
  assert.ok(md.includes('git-staging-guard'), 'CLAUDE.md ไม่ได้ชี้ไปที่ตัวบังคับ');
  assert.ok(md.includes('pre-push'), 'CLAUDE.md ไม่ได้พูดถึง pre-push gate');
});

check('the guard has no override flag', () => {
  const src = [ 'tools/git-staging-guard/staging_rules.js', '.claude/hooks/git-staging-guard.sh' ]
    .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  for (const bad of ['--force', 'SKIP_STAGING', 'ALLOW_BROAD', 'no-verify']) {
    assert.ok(!src.includes(bad), `มีทางลัด "${bad}"`);
  }
});

/* ── the hook itself, run as a process ───────────────────────────────────────────
 * Everything above this line tests the rules module. The module is not what Claude
 * Code executes — the shell hook is, and until this section existed the suite made
 * zero process calls: the rules could be perfect while the hook that consults them
 * was wired wrong, missing, or swallowing its own exit code, and every case here
 * would still have printed PASS. Same lesson as #0002 and #0006 — a layer with no
 * test of its own is a layer nobody knows is still running.
 */
const { spawnSync } = require('child_process');
const os = require('os');

const HOOK_SRC = path.join(ROOT, '.claude', 'hooks', 'git-staging-guard.sh');
const RULES_SRC = path.join(__dirname, 'staging_rules.js');

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'staging-hook-'));
  fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'tools', 'git-staging-guard'), { recursive: true });
  fs.copyFileSync(HOOK_SRC, path.join(dir, '.claude', 'hooks', 'git-staging-guard.sh'));
  fs.copyFileSync(RULES_SRC, path.join(dir, 'tools', 'git-staging-guard', 'staging_rules.js'));
  fs.mkdirSync(path.join(dir, 'tools', 'name-guard'), { recursive: true }); // a real directory to refuse
  return dir;
}

function runHook(dir, command, env) {
  const r = spawnSync('bash', [path.join(dir, '.claude', 'hooks', 'git-staging-guard.sh')], {
    input: JSON.stringify({ tool_input: { command }, cwd: dir }),
    encoding: 'utf8',
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: dir }, env || {}),
  });
  return { code: r.status, err: (r.stderr || '') + (r.stdout || '') };
}

check('the hook process refuses a broad stage and lets an explicit path through', () => {
  const dir = sandbox();
  const bad = runHook(dir, 'git add -A');
  assert.strictEqual(bad.code, 2, 'git add -A was not blocked by the hook: ' + bad.err);
  assert.ok(/BLOCKED/.test(bad.err), 'the refusal carried no reason: ' + bad.err);

  const folder = runHook(dir, 'git add tools/name-guard/');
  assert.strictEqual(folder.code, 2, 'a directory argument was not blocked: ' + folder.err);

  const ok = runHook(dir, 'git add tools/git-staging-guard/staging_rules.js');
  assert.strictEqual(ok.code, 0, 'an explicit path was refused: ' + ok.err);
  assert.ok(!/BLOCKED/.test(ok.err), 'an explicit path produced a refusal: ' + ok.err);
});

check('a wrapper in front of git is refused by the hook, not only by the module', () => {
  const dir = sandbox();
  for (const cmd of ['rtk git add -A', 'command git add .', 'env GIT_DIR=.git git add -u']) {
    const r = runHook(dir, cmd);
    assert.strictEqual(r.code, 2, 'not blocked through the hook: ' + cmd + ' -> ' + r.err);
  }
});

check('when it cannot run it says so out loud, and says the rule is still on', () => {
  // This layer is deliberately fail-OPEN — its own header says so, because blocking every
  // git command when node breaks costs more than the sweep it prevents, and a swept file is
  // always recoverable. Fail-open is only defensible while it is LOUD, so that is what is
  // pinned here: silence would leave the agent believing it had been checked.
  const noNode = (process.env.PATH || '').split(':')
    .filter((d) => d && !fs.existsSync(path.join(d, 'node'))).join(':');

  const gone = sandbox();
  const r1 = runHook(gone, 'git add -A', { PATH: noNode });
  assert.strictEqual(r1.code, 0, 'it blocked instead of degrading: ' + r1.err);
  assert.ok(/รันไม่ได้/.test(r1.err), 'it went quiet with no node: ' + JSON.stringify(r1.err));
  assert.ok(/ระบุไฟล์ทีละตัว/.test(r1.err), 'the warning does not restate the rule: ' + r1.err);

  const norules = sandbox();
  fs.unlinkSync(path.join(norules, 'tools', 'git-staging-guard', 'staging_rules.js'));
  const r2 = runHook(norules, 'git add -A');
  assert.strictEqual(r2.code, 0, r2.err);
  assert.ok(/รันไม่ได้/.test(r2.err), 'a missing rules module passed silently: ' + JSON.stringify(r2.err));
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
