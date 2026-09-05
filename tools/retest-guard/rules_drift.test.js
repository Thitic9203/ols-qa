#!/usr/bin/env node
'use strict';
/* Stops a rule from being re-stated in prose and drifting.
 *
 * The `|width=` parameter was written in SEVEN places by hand. Three of them said
 * "use it" — including the worked example, whose whole job is to be copied, and
 * the post-publish recovery table, whose job is to un-break a comment. Reviewing
 * markdown by eye had not caught it in months.
 *
 * A rule literal may appear in markdown only where it is shown as the thing NOT to
 * do, and only at a spot listed in `DRIFT_ALLOWLIST` in retest_rules.js. Anything
 * new fails here, which forces a deliberate decision instead of a silent copy.
 *
 *   node tools/retest-guard/rules_drift.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./retest_rules');

const ROOT = path.join(__dirname, '..', '..');
const SCAN_DIRS = ['skills', 'references', 'commands'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const allowed = new Set(R.DRIFT_ALLOWLIST.filter((a) => a.needle === '|width=').map((a) => a.file));

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

check('no markdown file teaches an image width parameter outside the allowlist', () => {
  const offenders = [];
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const text = fs.readFileSync(f, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (!line.includes('|width=')) return;
      if (allowed.has(rel)) return;
      offenders.push(rel + ':' + (i + 1));
    });
  }
  assert.deepStrictEqual(offenders, [], 'restated rule at: ' + offenders.join(', '));
});

check('every allowlisted counter-example still exists (a stale allowlist hides the next one)', () => {
  const stale = [];
  for (const a of R.DRIFT_ALLOWLIST) {
    const abs = path.join(ROOT, a.file);
    if (!fs.existsSync(abs)) { stale.push(a.file + ' (missing)'); continue; }
    if (!fs.readFileSync(abs, 'utf8').includes(a.needle)) stale.push(a.file + ' (no longer contains ' + a.needle + ')');
  }
  assert.deepStrictEqual(stale, [], 'allowlist entries no longer needed: ' + stale.join(', '));
});

check('the retest closing checklist requires the MP4, not screenshots alone', () => {
  const p = path.join(ROOT, 'references', 'verify-closing-checklist.md');
  const text = fs.readFileSync(p, 'utf8');
  const start = text.indexOf('## Retest bug');
  assert.ok(start > -1, 'no "## Retest bug" section');
  const end = text.indexOf('\n## ', start + 1);
  const section = text.slice(start, end === -1 ? undefined : end);
  assert.ok(/MP4/.test(section), 'the retest section never mentions the MP4 the workflow makes mandatory');
  assert.ok(/retest_guard\.js/.test(section), 'the retest section does not run the guard');
});

check('the canonical rules module is the only place the rule tables live', () => {
  // A markdown file may name a rule id; it may not re-list the whole verdict header set,
  // because that list drifting is what put a "Design" column back into the case table.
  const offenders = [];
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    if (rel.startsWith('skills/deprecated/retest-bug-workflow/')) continue; // the workflow documents it for humans
    const text = fs.readFileSync(f, 'utf8');
    if (/No\.\s*·\s*Expected Result\s*·\s*Actual Result\s*·\s*Evidence\s*·\s*Status/.test(text)) offenders.push(rel);
  }
  assert.deepStrictEqual(offenders, [], 'verdict header list restated in: ' + offenders.join(', '));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
