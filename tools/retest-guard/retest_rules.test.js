#!/usr/bin/env node
'use strict';
/* Pins the canonical retest rules.
 *
 * Each mutation below is a mistake that has actually shipped, or that the rule
 * exists to stop. A rule that stops firing is a test failure — which is the point:
 * the rules moved out of prose so that eroding one breaks a build instead of
 * quietly producing a wrong comment.
 *
 *   node tools/retest-guard/retest_rules.test.js
 */
const assert = require('assert');
const R = require('./retest_rules');

const GOOD = [
  '*Retest Result: PASSED* ✅',
  '',
  '*Env:* pre-prod (https://example.test)',
  '*Design ref:* https://figma.example/file/x?node-id=1-2',
  '*Role:* CREATOR',
  '*Date:* 2026-09-05',
  '*Build:* abc1234',
  '*Fixture:* seeded course, restored',
  '*Scope:* FULL',
  '',
  '----',
  '',
  '*Test Step (from ticket):* open the list',
  '*Expected Result (from ticket, verbatim):* the label reads บันทึก',
  '',
  '*Test cases run:* 1',
  '',
  '||*Case*||*Title*||*Covers*||*Role*||*Status*||',
  '|TC_01|list shows the saved label|ER1|CREATOR|✅|',
  '',
  '||*No.*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||',
  '|1|label reads บันทึก|label reads บันทึก|!tc1.png!|✅|',
  '',
  '*Expected-result coverage:* 1 / 1 items met',
  '*Case coverage:* 1 / 1 cases run — 1 passed / 0 failed / 0 blocked',
].join('\n');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}
const rules = (fs) => fs.map((f) => f.rule);
const has = (fs, rule) => rules(fs).includes(rule);

check('a well-formed v2 comment produces no findings', () => {
  const fs = R.scanBody(GOOD, { format: R.FORMATS.WIKI, bugType: 'FE' });
  assert.deepStrictEqual(fs, [], 'unexpected: ' + JSON.stringify(rules(fs)));
});

check('image width parameter is refused (PM-004 / OLS-289)', () => {
  const fs = R.scanBody(GOOD.replace('!tc1.png!', '!tc1.png|width=450!'), {});
  assert.ok(has(fs, 'img-width-param'));
});

check('markdown bold posted to the wiki endpoint is refused', () => {
  const fs = R.scanBody(GOOD.replace('*Build:* abc1234', '**Build:** abc1234'), {});
  assert.ok(has(fs, 'md-bold-in-wiki'));
});

check('a markdown divider row is refused', () => {
  const fs = R.scanBody(GOOD.replace('|TC_01|', '|---|---|---|---|---|\n|TC_01|'), {});
  assert.ok(has(fs, 'md-divider-row'));
});

check('a missing Scope line is a finding (scope is not optional)', () => {
  const fs = R.scanBody(GOOD.replace('*Scope:* FULL\n', ''), {});
  assert.ok(has(fs, 'header-line-missing'));
});

check('a malformed Scope line is a finding', () => {
  const fs = R.scanBody(GOOD.replace('*Scope:* FULL', '*Scope:* some of them'), {});
  assert.ok(has(fs, 'scope-line-shape'));
});

check('a scoped verdict summary is accepted', () => {
  const body = GOOD
    .replace('*Retest Result: PASSED* ✅', '*Retest Result: PASSED (scoped: TC_01)* ✅')
    .replace('*Scope:* FULL', '*Scope:* CASES: TC_01');
  const fs = R.scanBody(body, {});
  assert.deepStrictEqual(fs, [], 'unexpected: ' + JSON.stringify(rules(fs)));
});

check('a design column in the case table is refused', () => {
  const body = GOOD
    .replace('||*Case*||*Title*||*Covers*||*Role*||*Status*||', '||*Case*||*Title*||*Covers*||*Role*||*Design*||*Status*||')
    .replace('|TC_01|list shows the saved label|ER1|CREATOR|✅|', '|TC_01|list shows the saved label|ER1|CREATOR|none|✅|');
  const fs = R.scanBody(body, {});
  assert.ok(has(fs, 'case-table-design-column'));
});

check('a renamed verdict header is refused', () => {
  const fs = R.scanBody(GOOD.replace('||*No.*||', '||*#*||'), {});
  assert.ok(has(fs, 'verdict-table-headers'));
});

check('a passing row with no evidence is refused', () => {
  const fs = R.scanBody(GOOD.replace('|!tc1.png!|✅|', '||✅|'), {});
  assert.ok(has(fs, 'passing-row-no-evidence'));
});

check('a passing row that says it could not be verified is refused', () => {
  const fs = R.scanBody(GOOD.replace('label reads บันทึก|!tc1.png!', 'ยืนยันไม่ได้|!tc1.png!'), {});
  assert.ok(has(fs, 'caveat-on-passing-row'));
});

check('coverage that does not reconcile is refused', () => {
  const fs = R.scanBody(GOOD.replace('coverage:* 1 / 1', 'coverage:* 1 / 2'), {});
  assert.ok(has(fs, 'coverage-not-reconciled'));
});

check('a local path in the body is refused', () => {
  // Built at runtime: this repo is public and its secret guard refuses the literal
  // shape of a home directory even in a counter-example, which is the correct
  // trade — see scripts/check-no-secrets.sh.
  const homePath = ['', 'Users', 'someone', 'out', 'tc1.png'].join('/');
  const fs = R.scanBody(GOOD.replace('!tc1.png!', homePath), {});
  assert.ok(has(fs, 'local-path-home'));
});

check('an unclosed {macro} is refused', () => {
  const fs = R.scanBody(GOOD.replace('open the list', 'GET /api/media/{id}'), {});
  assert.ok(has(fs, 'unclosed-macro'));
});

check('a FAILED comment without root cause / resolution options is refused', () => {
  const body = GOOD.replace('*Retest Result: PASSED* ✅', '*Retest Result: FAILED* ❌').replace('|✅|', '|❌|');
  const fs = R.scanBody(body, {});
  assert.strictEqual(fs.filter((f) => f.rule === 'non-pass-block-missing').length, 2);
});

check('a hedge word in a non-PASSED comment is flagged as a warning', () => {
  const body = GOOD.replace('*Retest Result: PASSED* ✅', '*Retest Result: FAILED* ❌')
    + '\n\n*Root cause:* probably a cache issue\n*Resolution options:* …';
  const fs = R.scanBody(body, {});
  const hedge = fs.filter((f) => f.rule === 'hedge-as-cause');
  assert.ok(hedge.length >= 1);
  assert.strictEqual(hedge[0].severity, 'warn');
});

check('an API bug drops the Evidence column and needs no Design ref', () => {
  const body = GOOD
    .replace('*Design ref:* https://figma.example/file/x?node-id=1-2\n', '')
    .replace('*Env:* pre-prod (https://example.test)', '*Env:* pre-prod (https://example.test)\n*API:* GET /api/media\n*Swagger:* https://example.test/swagger')
    .replace('||*No.*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||', '||*No.*||*Expected Result*||*Actual Result*||*Status*||')
    .replace('|1|label reads บันทึก|label reads บันทึก|!tc1.png!|✅|', '|1|200 OK|200 OK|✅|');
  const fs = R.scanBody(body, { bugType: 'API' });
  assert.deepStrictEqual(fs, [], 'unexpected: ' + JSON.stringify(rules(fs)));
});

check('a wiki header row posted to the ADF endpoint is refused', () => {
  const fs = R.scanBody(GOOD, { format: R.FORMATS.ADF });
  assert.ok(has(fs, 'wiki-header-row-in-adf'));
});

check('a pipe inside a link span is not a cell boundary', () => {
  const row = R.splitWikiCells('|TC_01|[▶ KEY_TC_01.mp4|^KEY_TC_01.mp4]|✅|');
  assert.strictEqual(row.cells.length, 3, 'got ' + JSON.stringify(row.cells));
  assert.strictEqual(row.cells[1], '[▶ KEY_TC_01.mp4|^KEY_TC_01.mp4]');
});

check('the unverified link-pipe question is recorded, not guessed', () => {
  assert.ok(R.OPEN_QUESTIONS.some((q) => /link-with-pipe/.test(q)));
});


check('a row with a stray delimiter is refused, not read one column over', () => {
  const fs = R.scanBody(GOOD.replace('|1|label reads บันทึก|label reads บันทึก|!tc1.png!|✅|',
                                     '|1|label reads|บันทึก|label reads บันทึก|!tc1.png!|✅|'), {});
  assert.ok(has(fs, 'row-column-count'), JSON.stringify(rules(fs)));
});

check('a case row with the wrong cell count is refused too', () => {
  const fs = R.scanBody(GOOD.replace('|TC_01|list shows the saved label|ER1|CREATOR|✅|',
                                     '|TC_01|list shows the saved label|ER1|✅|'), {});
  assert.ok(has(fs, 'row-column-count'), JSON.stringify(rules(fs)));
});

check('a Case-coverage line is not a substitute for the item-coverage line', () => {
  const fs = R.scanBody(GOOD.replace('*Expected-result coverage:* 1 / 1 items met',
                                     '*Case coverage:* 1 / 1 cases run'), {});
  assert.ok(has(fs, 'coverage-line-missing'), JSON.stringify(rules(fs)));
});

check('a Task retest may name its coverage line after the acceptance criteria', () => {
  const fs = R.scanBody(GOOD.replace('*Expected-result coverage:* 1 / 1 items met',
                                     '*Acceptance-criteria coverage:* 1 / 1 items met'), {});
  assert.deepStrictEqual(fs, [], JSON.stringify(rules(fs)));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
