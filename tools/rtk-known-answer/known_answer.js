#!/usr/bin/env node
'use strict';

/* rtk known-answer check — post-mortem #0119 (repeat of #0116's class).
 *
 * The Bash tool's hook rewrites commands through `rtk rewrite`. Three times a rewritten command
 * returned a silently wrong answer (find -> empty, diff -> "Files are identical", wc -l -> 0),
 * and each fix excluded only the command that had just bitten. This asks every common command
 * the same question at once: run it raw and as rtk would rewrite it, in a fixture whose answers
 * are known, and fail if the rewritten form loses the answer (text or exit code).
 *
 * Compression is fine (rtk's purpose); losing the answer is not. Each case names the facts the
 * output must still contain.
 *
 *   node tools/rtk-known-answer/known_answer.js            live run against the rtk on PATH
 *     exit 0  every case measured, 0 divergent
 *     exit 1  at least one rewritten command lost its answer (listed)
 *     exit 3  UNVERIFIABLE — rtk missing / errored, or the fixture's raw answer was wrong
 *
 * The live run is NOT in the test suite: its answer depends on the global rtk config on the
 * machine, and CI has no rtk. known_answer.test.js pins the logic with stub binaries instead.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const A = 'alpha\n# keep-comment\n\nline4 needle\n// slash-comment\nline6\nline7\n';
const B = A.replace('line6\n', 'line6-changed\n');

const CASES = [
  { name: 'find', cmd: 'find . -name a.txt', want: [/\.\/a\.txt/] },
  { name: 'ls', cmd: 'ls', want: [/a\.txt/, /b\.txt/] },
  { name: 'grep', cmd: 'grep -n needle a.txt', want: [/4:line4 needle/] },
  { name: 'wc -l', cmd: 'wc -l < a.txt', want: [/(^|\s)7(\s|$)/] },
  { name: 'diff', cmd: 'diff a.txt b.txt', want: [/line6-changed/], rc: 1 },
  { name: 'cat', cmd: 'cat a.txt', want: [/# keep-comment/, /\/\/ slash-comment/, /line7/] },
  { name: 'head -5', cmd: 'head -5 a.txt', want: [/# keep-comment/, /line4 needle/, /\/\/ slash-comment/] },
  { name: 'tail -2', cmd: 'tail -2 a.txt', want: [/line6/, /line7/] },
  { name: 'git status', cmd: 'git status', cwd: 'repo', want: [/a\.txt/] },
  { name: 'git log -1', cmd: 'git log -1', cwd: 'repo', want: [/known subject KA1/] },
  { name: 'git diff', cmd: 'git diff', cwd: 'repo', want: [/changed-line-KA2/] },
];

function sh(cmd, cwd, env) {
  const r = spawnSync('/bin/bash', ['-c', cmd], { cwd, encoding: 'utf8', env: env || process.env, timeout: 30000 });
  return { out: (r.stdout || '') + (r.stderr || ''), rc: r.status };
}

function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-ka-fx-'));
  fs.writeFileSync(path.join(dir, 'a.txt'), A);
  fs.writeFileSync(path.join(dir, 'b.txt'), B);
  const repo = path.join(dir, 'repo');
  fs.mkdirSync(repo);
  fs.writeFileSync(path.join(repo, 'a.txt'), A);
  const g = (args) => spawnSync('git', ['-c', 'user.name=ka', '-c', 'user.email=ka@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd: repo, encoding: 'utf8' });
  const steps = [['init', '-q'], ['add', 'a.txt'], ['commit', '-q', '-m', 'known subject KA1']];
  for (const s of steps) { const r = g(s); if (r.status !== 0) throw new Error(`fixture git ${s[0]} failed: ${r.stderr}`); }
  fs.appendFileSync(path.join(repo, 'a.txt'), 'changed-line-KA2\n');
  return dir;
}

function satisfies(res, c) {
  const missing = c.want.filter((re) => !re.test(res.out)).map(String);
  const rcOk = c.rc === undefined || res.rc === c.rc;
  return { ok: missing.length === 0 && rcOk, missing, rcOk };
}

function runAll({ rtk }) {
  let dir;
  try { dir = makeFixture(); } catch (e) { return { status: 'UNVERIFIABLE', why: e.message, results: [], measured: 0, divergent: 0 }; }
  // The fixture env keeps git from paging and makes the stub dir visible for rewritten commands.
  const env = { ...process.env, GIT_PAGER: 'cat', PAGER: 'cat', PATH: `${path.dirname(rtk)}:${process.env.PATH}` };
  const results = [];
  let why = '';
  try {
    for (const c of CASES) {
      const cwd = c.cwd ? path.join(dir, c.cwd) : dir;
      const raw = sh(c.cmd, cwd, env);
      const rawCheck = satisfies(raw, c);
      if (!rawCheck.ok) { why = `fixture raw answer wrong for ${c.name}: missing ${rawCheck.missing} rc ${raw.rc}`; break; }
      const rw = spawnSync(rtk, ['rewrite', c.cmd], { encoding: 'utf8', env, timeout: 10000 });
      if (rw.error) { why = `rtk rewrite could not run: ${rw.error.code || rw.error.message}`; break; }
      const rewrittenCmd = (rw.stdout || '').trim();
      if (!rewrittenCmd) {
        if (rw.status !== 1) { why = `rtk rewrite "${c.cmd}" printed nothing with exit ${rw.status}`; break; }
        results.push({ name: c.name, cmd: c.cmd, rewritten: false, ok: true, raw });
        continue;
      }
      const got = sh(rewrittenCmd, cwd, env);
      const verdict = satisfies(got, c);
      results.push({ name: c.name, cmd: c.cmd, rewritten: true, as: rewrittenCmd, ok: verdict.ok, missing: verdict.missing, rc: got.rc, wantRc: c.rc, raw });
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const measured = results.length;
  const divergent = results.filter((r) => !r.ok).length;
  const status = why || measured !== CASES.length ? 'UNVERIFIABLE' : divergent ? 'DIVERGENT' : 'OK';
  return { status, why, results, measured, divergent };
}

function main() {
  const which = spawnSync('/bin/bash', ['-c', 'command -v rtk'], { encoding: 'utf8' });
  const rtk = (which.stdout || '').trim();
  if (!rtk) { console.log('UNVERIFIABLE: rtk not on PATH — 0 commands measured (not a pass)'); process.exit(3); }
  const res = runAll({ rtk });
  for (const r of res.results) {
    const tag = !r.rewritten ? 'raw     ' : r.ok ? 'kept    ' : 'LOST    ';
    const extra = r.rewritten && !r.ok ? `  -> ${r.as}  missing ${JSON.stringify(r.missing)}${r.wantRc !== undefined ? ` rc ${r.rc}/${r.wantRc}` : ''}` : r.rewritten ? `  -> ${r.as}` : '';
    console.log(`${tag}${r.cmd}${extra}`);
  }
  const rewritten = res.results.filter((r) => r.rewritten).length;
  console.log(`\n${res.status}: ${res.measured}/${CASES.length} measured · ${rewritten} rewritten by rtk · ${res.divergent} lost the answer${res.why ? ` · ${res.why}` : ''}`);
  process.exit(res.status === 'OK' ? 0 : res.status === 'DIVERGENT' ? 1 : 3);
}

if (require.main === module) main();

module.exports = { CASES, runAll };
