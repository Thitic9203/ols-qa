#!/usr/bin/env node
'use strict';
/* The worked example is the file people copy, so it is machine-checked.
 *
 * It once carried `!file.png|width=450!` — a parameter whose pipe splits the table
 * row — inside the block it tells the reader to copy. Reviewing it by eye did not
 * catch that for months. Extracting the fenced bodies and running them through the
 * canonical rules does.
 *
 *   node tools/retest-guard/worked_example.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./retest_rules');

const FILE = path.join(__dirname, '..', '..', 'skills', 'deprecated', 'retest-bug-workflow', 'references', 'worked-example.md');
const md = fs.readFileSync(FILE, 'utf8');

/** Every fenced block, with its info string. */
function fences(text) {
  const out = [];
  const re = /^```([a-zA-Z]*)\n([\s\S]*?)^```/gm;
  let m;
  while ((m = re.exec(text)) !== null) out.push({ lang: m[1], body: m[2] });
  return out;
}

const blocks = fences(md);
let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

check('the example file still carries both worked bodies', () => {
  assert.strictEqual(blocks.length, 2, 'found ' + blocks.length + ' fenced blocks');
  assert.strictEqual(blocks[0].lang, 'markdown', 'the API example must be fenced as markdown');
  assert.strictEqual(blocks[1].lang, 'text', 'the wiki example must be fenced as text, never markdown');
});

check('the API example (markdown/ADF) is clean against the canonical rules', () => {
  const found = R.scanBody(blocks[0].body, { format: R.FORMATS.ADF, bugType: 'API' })
    .filter((f) => f.severity !== 'warn');
  assert.deepStrictEqual(found, [], 'findings: ' + JSON.stringify(found.map((f) => f.rule + '@' + f.line)));
});

check('the FE example (v2 wiki) is clean against the canonical rules', () => {
  const found = R.scanBody(blocks[1].body, { format: R.FORMATS.WIKI, bugType: 'FE' })
    .filter((f) => f.severity !== 'warn');
  assert.deepStrictEqual(found, [], 'findings: ' + JSON.stringify(found.map((f) => f.rule + '@' + f.line)));
});

check('neither example teaches an image width parameter', () => {
  blocks.forEach((b, i) => assert.ok(!R.IMG_WIDTH_PARAM.test(b.body), 'block ' + i + ' carries |width='));
});

check('the FE example carries the per-row Evidence column, not a separate evidence section', () => {
  const t = R.findTables(blocks[1].body, R.FORMATS.WIKI).find((x) => R.kindOfTable(x) === 'verdict');
  assert.ok(t, 'no verdict table found');
  assert.deepStrictEqual(t.headers, R.VERDICT_TABLE_HEADERS.slice());
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
