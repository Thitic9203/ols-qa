#!/usr/bin/env node
'use strict';
/* The v2 comment template is copied by readers, so its example pair is machine-checked:
 * the manifest it shows must validate, must render to exactly the body it shows, and that
 * body must pass the rules. An example that drifts fails here instead of in a posted comment.
 *
 *   node tools/retest-guard/comment_template.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./retest_rules');
const M = require('./retest_manifest');
const RENDER = require('./retest_render');

const FILE = path.join(__dirname, '..', '..', 'skills', 'procedures', 'retest-bug-workflow', 'references', 'comment-template-v2.md');
const md = fs.readFileSync(FILE, 'utf8');

function fences(text) {
  const out = [];
  const re = /^```([a-zA-Z]*)\n([\s\S]*?)^```/gm;
  let m;
  while ((m = re.exec(text)) !== null) out.push({ lang: m[1], body: m[2] });
  return out;
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const blocks = fences(md);
const jsonIdx = blocks.findIndex((b) => b.lang === 'json');
const manifestBlock = blocks[jsonIdx];
const bodyBlock = blocks[jsonIdx + 1];
const antiBlock = blocks[jsonIdx + 2];

check('the template carries a json manifest followed by its rendered text body', () => {
  assert.ok(jsonIdx > -1, 'no json manifest block');
  assert.ok(bodyBlock && bodyBlock.lang === 'text', 'the body after the manifest must be fenced as text');
});

let manifest = null;
check('the example manifest validates with no errors', () => {
  manifest = JSON.parse(manifestBlock.body);
  const errors = M.validate(manifest).filter((f) => f.severity !== 'warn');
  assert.deepStrictEqual(errors.map((f) => f.rule + ' ' + f.field), []);
});

check('the example body is exactly what the renderer produces from the manifest', () => {
  const rendered = RENDER.render(manifest).replace(/\n+$/, '');
  assert.strictEqual(bodyBlock.body.replace(/\n+$/, ''), rendered);
});

check('the example body passes every mechanical rule', () => {
  const findings = R.scanBody(bodyBlock.body, { format: 'v2', bugType: 'FE', ticketType: 'Bug' })
    .filter((f) => f.severity !== 'warn');
  assert.deepStrictEqual(findings.map((f) => f.rule), []);
});

check('the anti-example, put into the body, is rejected as row-column-count', () => {
  assert.ok(antiBlock && /\n\* <POINT_1>\n\* <POINT_2>/.test(antiBlock.body), 'anti-example missing');
  const broken = bodyBlock.body.replace('|• <POINT_1> \\\\ • <POINT_2>|', '|\n* <POINT_1>\n* <POINT_2>|');
  assert.notStrictEqual(broken, bodyBlock.body, 'could not build the broken body');
  const rules = R.scanBody(broken, { format: 'v2', bugType: 'FE', ticketType: 'Bug' }).map((f) => f.rule);
  assert.ok(rules.includes('row-column-count'), 'guard did not report row-column-count: ' + rules.join(', '));
});

if (failed) { console.log('\n' + failed + ' check(s) failed'); process.exit(1); }
console.log('\nall checks passed');
