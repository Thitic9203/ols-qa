#!/usr/bin/env node
'use strict';
/* Every relative markdown link in the skill tree must point at a file that exists.
 *
 * The skills are a linked document set: a workflow sends the reader to a reference,
 * which sends them to a gate. A link that 404s does not fail loudly — the reader
 * simply never sees the rule, and the rule stops being followed without anyone
 * deciding that. Renaming or moving a reference is exactly when this breaks, which
 * is exactly when nobody re-reads 485 links by hand.
 *
 *   node tools/portability/links_resolve.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DIRS = ['skills', 'references', 'commands'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const files = DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const broken = [];
let checked = 0;

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  // relative links to .md only — http(s), anchors and mailto are out of scope here
  for (const m of text.matchAll(/\]\((?!https?:|#|mailto:)([^)#]+\.md)(#[^)]*)?\)/g)) {
    checked += 1;
    const target = path.resolve(path.dirname(f), m[1]);
    if (!fs.existsSync(target)) broken.push(path.relative(ROOT, f) + ' → ' + m[1]);
  }
}

check('there are links to check (a scan that found nothing is not a pass)', () => {
  assert.ok(checked > 100, 'only ' + checked + ' relative links found — the walk is probably wrong');
});

check('every relative markdown link resolves', () => {
  assert.deepStrictEqual(broken, [], broken.length + ' broken link(s):\n  ' + broken.join('\n  '));
});

console.log(`\n(${checked} relative links across ${files.length} files)`);
console.log(failed ? failed + ' FAILED' : 'ALL PASS');
process.exit(failed ? 1 : 0);
