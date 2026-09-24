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
  '',
  '----',
  '',
  '*Test Step (from ticket):* open the list',
  '*Expected Result (from ticket, verbatim):* the label reads บันทึก',
  '',
  '||*No.*||*ER*||*Case (Role)*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||',
  '|1|ER1|• TC_01 list shows the saved label (CREATOR)|label reads บันทึก|label reads บันทึก|!tc1.png!|✅|',
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
  const fs = R.scanBody(GOOD.replace('|1|ER1|', '|---|---|---|---|---|---|---|\n|1|ER1|'), {});
  assert.ok(has(fs, 'md-divider-row'));
});

check('rule 1: a full round carries no Scope line, and "*Scope:* FULL" is refused', () => {
  assert.ok(!/Scope:/.test(GOOD), 'the clean body must not carry a Scope line');
  const fs = R.scanBody(GOOD.replace('*Fixture:* seeded course, restored', '*Fixture:* seeded course, restored\n*Scope:* FULL'), {});
  assert.ok(has(fs, 'scope-full-line'), 'got ' + JSON.stringify(rules(fs)));
});

check('rule 1: a scoped round still needs its Scope line (scope is not optional there)', () => {
  const fs = R.scanBody(GOOD.replace('*Retest Result: PASSED* ✅', '*Retest Result: PASSED (scoped: TC_01)* ✅'), {});
  assert.ok(has(fs, 'header-line-missing'));
});

check('a malformed Scope line is a finding', () => {
  const fs = R.scanBody(GOOD.replace('*Fixture:* seeded course, restored', '*Fixture:* seeded course, restored\n*Scope:* some of them'), {});
  assert.ok(has(fs, 'scope-line-shape'));
});

check('a scoped verdict summary is accepted', () => {
  const body = GOOD
    .replace('*Retest Result: PASSED* ✅', '*Retest Result: PASSED (scoped: TC_01)* ✅')
    .replace('*Fixture:* seeded course, restored', '*Fixture:* seeded course, restored\n*Scope:* CASES: TC_01');
  const fs = R.scanBody(body, {});
  assert.deepStrictEqual(fs, [], 'unexpected: ' + JSON.stringify(rules(fs)));
});

check('a design column in the table is refused', () => {
  const body = GOOD
    .replace('||*Evidence*||*Status*||', '||*Evidence*||*Design*||*Status*||')
    .replace('|!tc1.png!|✅|', '|!tc1.png!|none|✅|');
  const fs = R.scanBody(body, {});
  assert.ok(has(fs, 'case-table-design-column'));
});

check('rule 3: a separate "Test cases run" table is refused (one table only)', () => {
  const body = GOOD.replace('||*No.*||',
    '||*Case*||*Title*||*Covers*||*Role*||*Status*||\n|TC_01|list shows the saved label|ER1|CREATOR|✅|\n\n||*No.*||');
  const fs = R.scanBody(body, {});
  assert.ok(has(fs, 'separate-case-table'), 'got ' + JSON.stringify(rules(fs)));
  assert.ok(has(fs, 'more-than-one-table'), 'got ' + JSON.stringify(rules(fs)));
});

check('rule 3: the retired two-table headers (no ER / Case (Role) column) are refused', () => {
  const body = GOOD
    .replace('||*No.*||*ER*||*Case (Role)*||', '||*No.*||')
    .replace('|1|ER1|• TC_01 list shows the saved label (CREATOR)|', '|1|');
  const fs = R.scanBody(body, {});
  assert.ok(has(fs, 'verdict-table-headers'));
});

check('rule 3: column 2 reads ER on a Bug and AC on a Task', () => {
  assert.deepStrictEqual(R.scanBody(GOOD, { ticketType: 'Bug' }), []);
  assert.ok(has(R.scanBody(GOOD, { ticketType: 'Task' }), 'verdict-table-headers'));
  const task = GOOD.replace('||*ER*||', '||*AC*||');
  assert.deepStrictEqual(R.scanBody(task, { ticketType: 'Task' }), []);
  assert.deepStrictEqual(R.scanBody(task, {}), [], 'without a ticket type either ER or AC is accepted');
});

check('rule 3: a row with no covering case is refused', () => {
  const fs = R.scanBody(GOOD.replace('|• TC_01 list shows the saved label (CREATOR)|', '||'), {});
  assert.ok(has(fs, 'row-without-case'));
});

check('rule 3: several cases in one cell are "• " lines joined by the wiki line break', () => {
  const two = '• TC_01 list shows the saved label (CREATOR) \\\\ • TC_02 detail shows it too (CREATOR)';
  assert.deepStrictEqual(R.scanBody(GOOD.replace('• TC_01 list shows the saved label (CREATOR)', two), {}), []);
  const bare = 'TC_01 list (CREATOR) \\\\ TC_02 detail (CREATOR)';
  assert.ok(has(R.scanBody(GOOD.replace('• TC_01 list shows the saved label (CREATOR)', bare), {}), 'case-cell-shape'));
});

check('rule 3: an actual-result cell running points together with " · " is refused', () => {
  const fs = R.scanBody(GOOD.replace('label reads บันทึก|!tc1.png!', 'label reads บันทึก · count is 1|!tc1.png!'), {});
  assert.ok(has(fs, 'cell-inline-list'));
  const ok = R.scanBody(GOOD.replace('label reads บันทึก|!tc1.png!', '• label reads บันทึก \\\\ • count is 1|!tc1.png!'), {});
  assert.deepStrictEqual(ok, [], 'unexpected: ' + JSON.stringify(rules(ok)));
});

check('rule 2: a header value with several points on one line is refused', () => {
  ['seeded course · restored after', 'seeded course — restored after'].forEach((v) => {
    const fs = R.scanBody(GOOD.replace('*Fixture:* seeded course, restored', '*Fixture:* ' + v), {});
    assert.ok(has(fs, 'header-inline-list'), v + ' -> ' + JSON.stringify(rules(fs)));
  });
});

check('rule 2: label on its own line + one bullet per point + one blank line is accepted', () => {
  const body = GOOD.replace('*Fixture:* seeded course, restored\n',
    '*Fixture:*\n* seeded course\n* restored after\n');
  assert.deepStrictEqual(R.scanBody(body, {}), [], 'unexpected: ' + JSON.stringify(rules(R.scanBody(body, {}))));
});

check('rule 2: a bullet list followed directly by the next label is refused (the list swallows it)', () => {
  const body = GOOD.replace('*Build:* abc1234\n*Fixture:* seeded course, restored',
    '*Build:*\n* abc1234\n* tag v1\n*Fixture:* seeded course, restored');
  const fs = R.scanBody(body, {});
  assert.ok(has(fs, 'list-swallows-next-line'), 'got ' + JSON.stringify(rules(fs)));
});

check('rule 4: the coverage lines come after the table', () => {
  const lines = GOOD.split('\n');
  const cov = lines.findIndex((l) => l.startsWith('*Expected-result coverage:*'));
  const moved = lines.slice();
  const [line] = moved.splice(cov, 1);
  moved.splice(moved.findIndex((l) => l.startsWith('||')), 0, line, '');
  const fs = R.scanBody(moved.join('\n'), {});
  assert.ok(has(fs, 'coverage-before-table'), 'got ' + JSON.stringify(rules(fs)));
});

check('rule 5: the column widths are pinned in one place, one per column of the single table', () => {
  assert.deepStrictEqual(R.TABLE_COLUMN_WIDTHS.slice(), [50, 75, 230, 200, 330, 230, 65]);
  assert.strictEqual(R.TABLE_COLUMN_WIDTHS.length, R.VERDICT_TABLE_HEADERS.length);
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
    .replace('||*Evidence*||*Status*||', '||*Status*||')
    .replace('|label reads บันทึก|label reads บันทึก|!tc1.png!|✅|', '|200 OK|200 OK|✅|');
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

check('both questions are answered — nothing is left as a guess', () => {
  // Q1 settled against a live comment; Q2 settled by the owner: report the status the
  // case actually has, and when the destination cannot hold it, ask rather than map.
  assert.deepStrictEqual(R.OPEN_QUESTIONS.slice(), [], 'an entry here means something is still unresolved');
});

check('the summary line may state BLOCKED or PWMI, because a round reports its rows', () => {
  ['*Retest Result: BLOCKED* ⛔', '*Retest Result: PWMI*', '*Retest Result: PASSED (scoped: TC_01)* ✅']
    .forEach((line) => assert.ok(R.SUMMARY_LINE.test(line), 'rejected: ' + line));
  assert.ok(!R.SUMMARY_LINE.test('*Retest Result: probably fine*'));
});

check('the refusal names every verdict the summary line actually accepts', () => {
  // The message is what a person reads when the gate stops them. When it named only
  // PASSED/FAILED, a truthful BLOCKED round was told to rewrite itself as one of two
  // words the rule had already stopped requiring — the gate teaching the exact mistake
  // the rule exists to prevent. Read the accepted words out of the pattern so the two
  // cannot drift apart again.
  const accepted = /\(([A-Z|]+)\)/.exec(R.SUMMARY_LINE.source)[1].split('|');
  assert.ok(accepted.length >= 4, 'could not read the verdicts out of SUMMARY_LINE');
  const body = String(GOOD).split('\n');
  body[0] = '*Retest Result: probably fine*';
  const shape = R.scanBody(body.join('\n'), { format: R.FORMATS.WIKI, bugType: 'FE' })
    .find((f) => f.rule === 'summary-line-shape');
  assert.ok(shape, 'the malformed summary line was not caught at all');
  accepted.forEach((v) => assert.ok(
    (shape.message + ' ' + (shape.fix || '')).includes(v),
    'the refusal never mentions ' + v + ': ' + shape.message));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
