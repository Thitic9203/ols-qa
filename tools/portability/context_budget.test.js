#!/usr/bin/env node
'use strict';
/* CLAUDE.md and everything it @-includes load into every session, before any work starts.
 *
 * On 2026-09-19 that set had grown to ~590 KB (CLAUDE.md alone 478 KB, plus a 109 KB
 * auto-included project guide). The context refilled within a few turns of every
 * compaction and autocompact thrashed. The fix was to keep rules as short bullets in
 * CLAUDE.md, move rationale and post-mortem summaries to docs/CLAUDE-ARCHIVE.md, and
 * stop auto-including the guide. Nothing about that stays true on its own — appending
 * "just one more paragraph" per incident is how it grew — so the budget is a test.
 *
 *   node tools/portability/context_budget.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');

const MAX_LINES = 200;
const MAX_CLAUDE_BYTES = 40 * 1024;
const MAX_AUTOLOAD_BYTES = 50 * 1024; // CLAUDE.md + every @-include, recursively
const NEVER_AUTOLOAD = ['references/ols-project-guide.md', 'docs/CLAUDE-ARCHIVE.md'];

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

// An @-include is a line that is exactly "@<path>" — the form Claude Code expands.
function includes(file) {
  return fs.readFileSync(file, 'utf8').split('\n')
    .map((l) => l.trim())
    .filter((l) => /^@[^\s@]+$/.test(l))
    .map((l) => path.resolve(path.dirname(file), l.slice(1)));
}

function autoloaded(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const inc of includes(file)) if (fs.existsSync(inc)) autoloaded(inc, seen);
  return seen;
}

const text = fs.readFileSync(CLAUDE_MD, 'utf8');
const lines = text.split('\n').length;
const bytes = Buffer.byteLength(text);
const loaded = [...autoloaded(CLAUDE_MD)];
const total = loaded.reduce((n, f) => n + fs.statSync(f).size, 0);
const rel = (f) => path.relative(ROOT, f);

check('the measurement read something real (CLAUDE.md is not empty, set has ≥ 1 file)', () => {
  assert.ok(bytes > 1000 && loaded.length >= 1, 'CLAUDE.md is ' + bytes + ' bytes — wrong file?');
});

check('the include parser finds a known include (CONTEXT.md)', () => {
  assert.ok(loaded.map(rel).includes('CONTEXT.md'), 'parsed includes: ' + loaded.map(rel).join(', '));
});

check(`CLAUDE.md is at most ${MAX_LINES} lines`, () => {
  assert.ok(lines <= MAX_LINES, lines + ' lines — move rationale to docs/CLAUDE-ARCHIVE.md, keep the rule as one bullet');
});

check(`CLAUDE.md is at most ${MAX_CLAUDE_BYTES} bytes`, () => {
  assert.ok(bytes <= MAX_CLAUDE_BYTES, bytes + ' bytes — move rationale to docs/CLAUDE-ARCHIVE.md');
});

check(`everything auto-loaded is at most ${MAX_AUTOLOAD_BYTES} bytes`, () => {
  assert.ok(total <= MAX_AUTOLOAD_BYTES, total + ' bytes across ' + loaded.map(rel).join(', '));
});

check('large reference files are never auto-included', () => {
  const bad = loaded.map(rel).filter((f) => NEVER_AUTOLOAD.includes(f));
  assert.deepStrictEqual(bad, [], 'auto-included: ' + bad.join(', ') + ' — link it, do not @-include it');
});

check('the archive the header points to exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'docs', 'CLAUDE-ARCHIVE.md')), 'docs/CLAUDE-ARCHIVE.md missing');
});

console.log(`\n(CLAUDE.md ${lines} lines / ${bytes} B · auto-loaded ${loaded.length} file(s) / ${total} B)`);
console.log(failed ? failed + ' FAILED' : 'ALL PASS');
process.exit(failed ? 1 : 0);
