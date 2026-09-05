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

check('explicit file staging is never refused', () => {
  for (const c of [
    'git add CLAUDE.md',
    'git add tools/git-staging-guard/staging_rules.js',
    'git add -- a.js b.sh',
    'git add .claude/hooks/investigation-rule.sh .claude/settings.json',
    'git add path/to/deeply/nested/file.md',
  ]) assert.strictEqual(d(c).block, false, `บล็อกผิด: ${c}`);
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
  assert.ok(/tools\/\*\/\*\.test\.js/.test(src), 'pre-push ไม่ได้รันชุดเทสต์ทั้งหมดแล้ว');
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

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
