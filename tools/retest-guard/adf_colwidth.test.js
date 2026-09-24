#!/usr/bin/env node
'use strict';
/* The post-publish layout step for the single table (FORMAT rules 5–6).
 *
 * The fixture is shaped like the ADF the tracker returns for a v2 wiki post of a
 * rendered body: a header row of tableHeader cells, then rows whose Evidence cell
 * holds the MP4 as a `mediaGroup` file card and the stills as `mediaSingle`.
 *
 *   node tools/retest-guard/adf_colwidth.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const R = require('./retest_rules');
const A = require('./adf_colwidth');

const p = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const th = (text) => ({ type: 'tableHeader', attrs: {}, content: [{ type: 'paragraph', content: [{ type: 'text', text, marks: [{ type: 'strong' }] }] }] });
const td = (...content) => ({ type: 'tableCell', attrs: {}, content });
const file = (id) => ({ type: 'media', attrs: { type: 'file', id, collection: '' } });
const still = (id) => ({ type: 'mediaSingle', attrs: { layout: 'align-start' }, content: [{ type: 'media', attrs: { type: 'file', id, collection: '' } }] });

function doc(headers = R.VERDICT_TABLE_HEADERS) {
  const withEvidence = headers.includes('Evidence');
  const row = (n) => ({
    type: 'tableRow',
    content: [
      td(p(String(n))), td(p('ER' + n)), td(p('• TC_0' + n + ' title (ROLE)')), td(p('expected')), td(p('actual')),
      ...(withEvidence ? [td({ type: 'mediaGroup', content: [file('clip' + n)] }, still('png' + n))] : []),
      td(p('✅')),
    ],
  });
  return {
    type: 'doc',
    version: 1,
    content: [
      p('Retest Result: PASSED'),
      { type: 'table', attrs: { isNumberColumnEnabled: false, layout: 'default' }, content: [
        { type: 'tableRow', content: headers.map(th) }, row(1), row(2),
      ] },
      p('Expected-result coverage: 2 / 2 items met'),
    ],
  };
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

check('the untouched fixture fails the check (the checker can find a problem)', () => {
  const r = A.verify(doc());
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mediaGroup, 2, 'two MP4 file cards expected in the fixture');
  assert.ok(r.problems.some((x) => /colwidth/.test(x)));
});

check('rule 5: every cell gets its column width [50, 75, 230, 200, 330, 230, 65]', () => {
  const d = doc();
  A.applyLayout(d);
  const t = d.content.find((n) => n.type === 'table');
  t.content.forEach((row) => assert.deepStrictEqual(row.content.map((c) => c.attrs.colwidth[0]), [50, 75, 230, 200, 330, 230, 65]));
});

check('rule 5: an API table (no Evidence) drops only the Evidence width', () => {
  const d = doc(R.VERDICT_TABLE_HEADERS_API);
  A.applyLayout(d);
  const t = d.content.find((n) => n.type === 'table');
  assert.deepStrictEqual(t.content[1].content.map((c) => c.attrs.colwidth[0]), [50, 75, 230, 200, 330, 65]);
  const r = A.verify(d);
  assert.ok(r.ok, r.problems.join('; '));
});

check('rule 6: readback has 0 mediaGroup and every mediaSingle is layout center', () => {
  const d = doc();
  const done = A.applyLayout(d);
  assert.strictEqual(done.convertedMediaGroups, 2);
  const r = A.verify(d);
  assert.strictEqual(r.mediaGroup, 0);
  assert.strictEqual(r.mediaSingle, 4, 'two clips + two stills');
  assert.strictEqual(r.nonCenterSingle, 0);
  assert.strictEqual(r.mediaNodes, 4, 'no media node may be lost in the conversion');
  assert.ok(r.ok, r.problems.join('; '));
});

check('rule 6: paragraphs in No., Evidence and Status are centred, the rest are not touched', () => {
  const d = doc();
  A.applyLayout(d);
  const row = d.content.find((n) => n.type === 'table').content[1].content;
  const centred = (c) => c.content.filter((n) => n.type === 'paragraph')
    .every((n) => (n.marks || []).some((m) => m.type === 'alignment' && m.attrs.align === 'center'));
  assert.ok(centred(row[0]) && centred(row[6]), 'No. / Status not centred');
  assert.ok(!(row[3].content[0].marks || []).length, 'Expected Result must keep its own alignment');
});

check('rule 6: a readback that kept one file card is refused', () => {
  const d = doc();
  A.applyLayout(d);
  d.content.find((n) => n.type === 'table').content[2].content[5].content.push({ type: 'mediaGroup', content: [file('x')] });
  const r = A.verify(d);
  assert.strictEqual(r.ok, false);
  assert.ok(r.problems.some((x) => /mediaGroup/.test(x)));
});

check('a body with two tables is refused, not guessed at', () => {
  const d = doc();
  d.content.push(JSON.parse(JSON.stringify(d.content[1])));
  assert.throws(() => A.applyLayout(d), (e) => e.code === 'table-count');
});

check('CLI on real files: --in/--out writes a PUT body, --check exits 0 on it and 1 on the raw input', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adf-colwidth-'));
  const inFile = path.join(tmp, 'get.json');
  const outFile = path.join(tmp, 'put.json');
  fs.writeFileSync(inFile, JSON.stringify({ id: '1', body: doc() }));
  const cli = path.join(__dirname, 'adf_colwidth.js');
  const a = spawnSync(process.execPath, [cli, '--in', inFile, '--out', outFile], { encoding: 'utf8' });
  assert.strictEqual(a.status, 0, a.stderr);
  const put = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  assert.strictEqual(put.body.type, 'doc');
  const ok = spawnSync(process.execPath, [cli, '--check', outFile], { encoding: 'utf8' });
  assert.strictEqual(ok.status, 0, ok.stdout + ok.stderr);
  const bad = spawnSync(process.execPath, [cli, '--check', inFile], { encoding: 'utf8' });
  assert.strictEqual(bad.status, 1, 'the un-laid-out input must fail the check');
  const none = spawnSync(process.execPath, [cli, '--check', path.join(tmp, 'missing.json')], { encoding: 'utf8' });
  assert.strictEqual(none.status, 2, 'an unreadable readback is "could not run", never a pass');
  fs.rmSync(tmp, { recursive: true, force: true });
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
