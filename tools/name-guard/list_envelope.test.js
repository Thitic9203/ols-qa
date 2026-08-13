#!/usr/bin/env node
'use strict';
/* Regression test for the list-envelope trap.
 *
 * OLS list endpoints do NOT agree on the array key: /api/media and /api/achievements answer
 * `{data:[...]}` while /api/courses and /api/learning-paths answer `{items:[...]}`. A reader
 * that only looks at `data` sees an empty course catalogue with a healthy `total` — which
 * reads exactly like a backend outage and is not one. That misdiagnosis already cost a
 * session's time once; this test pins the behaviour of the extractor.
 *
 *   node tools/name-guard/list_envelope.test.js
 */
const assert = require('assert');

// the extractor used by scan.js
const extract = (j) => j.data || j.items || (Array.isArray(j) ? j : []);

const cases = [
  { name: 'media/achievements envelope (data)', body: { data: [{ id: 1 }, { id: 2 }], total: 2 }, expect: 2 },
  { name: 'courses/learning-paths envelope (items)', body: { items: [{ id: 1 }], total: 67 }, expect: 1 },
  { name: 'bare array', body: [{ id: 1 }, { id: 2 }, { id: 3 }], expect: 3 },
  { name: 'empty data', body: { data: [], total: 0 }, expect: 0 },
  { name: 'empty items', body: { items: [], total: 0 }, expect: 0 },
  { name: 'unknown envelope falls back to empty', body: { results: [{ id: 1 }] }, expect: 0 },
];

let failed = 0;
for (const c of cases) {
  const got = extract(c.body).length;
  try {
    assert.strictEqual(got, c.expect);
    console.log('PASS  ' + c.name + ' -> ' + got);
  } catch (_) {
    failed++;
    console.log('FAIL  ' + c.name + ' -> got ' + got + ', want ' + c.expect);
  }
}

// The trap itself: reading only `data` silently loses the whole course list.
const coursesBody = { items: [{ id: 'a' }, { id: 'b' }], total: 67 };
const naive = (coursesBody.data || []).length;
try {
  assert.strictEqual(naive, 0);
  assert.strictEqual(extract(coursesBody).length, 2);
  console.log('PASS  data-only reader returns 0 for a courses response (the trap this guards)');
} catch (_) { failed++; console.log('FAIL  trap case'); }

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
