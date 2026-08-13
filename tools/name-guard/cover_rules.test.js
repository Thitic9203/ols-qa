#!/usr/bin/env node
'use strict';
/* Regression test for the missing-cover rule.
 *
 * Two learning paths went live in training69 (2026-08-12) with coverImageUrl = null and stayed
 * that way until a human noticed the blank tiles. The name scan was green the whole time
 * because it only ever read title and description. This test pins the rule that closes that
 * gap: user-facing content owes a cover, drafts do not, and an item that merely *has* the field
 * is not automatically clean (the URL check lives in scan.js and is exercised separately).
 *
 *   node tools/name-guard/cover_rules.test.js
 */
const assert = require('assert');
const rules = require('./name_rules');

const cases = [
  { name: 'published, no cover at all', item: { status: 'PUBLISHED' }, expect: 1 },
  { name: 'published, cover null (the training69 case)', item: { status: 'PUBLISHED', coverImageUrl: null }, expect: 1 },
  { name: 'published, cover empty string', item: { status: 'PUBLISHED', coverImageUrl: '   ' }, expect: 1 },
  { name: 'published, cover present', item: { status: 'PUBLISHED', coverImageUrl: 'https://cdn.example/x.png' }, expect: 0 },
  { name: 'thumbnailUrl accepted as alias', item: { status: 'PUBLISHED', thumbnailUrl: 'https://cdn.example/x.png' }, expect: 0 },
  { name: 'draft owes nothing yet', item: { status: 'DRAFT' }, expect: 0 },
  { name: 'pending approval still owes a cover', item: { status: 'PENDING_APPROVAL' }, expect: 1 },
  { name: 'pending edit still owes a cover', item: { status: 'PENDING_EDIT' }, expect: 1 },
  { name: 'unpublished still owes a cover (creator + admin screens show it)', item: { status: 'UNPUBLISHED' }, expect: 1 },
  { name: 'no status field → treated as user-facing', item: { coverImageUrl: '' }, expect: 1 },
  { name: 'lowercase status is normalised', item: { status: 'published', coverImageUrl: null }, expect: 1 },
];

let failed = 0;
for (const c of cases) {
  const hits = rules.checkAsset(c.item);
  try {
    assert.strictEqual(hits.length, c.expect);
    if (hits.length) assert.strictEqual(hits[0].rule, 'missing-cover');
    console.log('PASS  ' + c.name);
  } catch (_) {
    failed++;
    console.log('FAIL  ' + c.name + ' -> got ' + hits.length + ' hit(s), want ' + c.expect);
  }
}

// coverUrlOf trims and prefers the first non-empty field
try {
  assert.strictEqual(rules.coverUrlOf({ coverImageUrl: ' https://a/x.png ' }), 'https://a/x.png');
  assert.strictEqual(rules.coverUrlOf({ coverImageUrl: '', thumbnailUrl: 'https://b/y.png' }), 'https://b/y.png');
  assert.strictEqual(rules.coverUrlOf({}), null);
  console.log('PASS  coverUrlOf resolves and trims');
} catch (_) { failed++; console.log('FAIL  coverUrlOf'); }

// a missing cover must never mask the name rules — both must fire on the same item
try {
  const it = { title: 'QA Test เนื้อหา', description: 'ทดสอบระบบ', status: 'PUBLISHED', coverImageUrl: null };
  const all = rules.checkItem(it).concat(rules.checkAsset(it));
  assert.ok(all.some((h) => h.rule === 'test-trace'));
  assert.ok(all.some((h) => h.rule === 'missing-cover'));
  console.log('PASS  name findings and cover findings coexist on one item');
} catch (_) { failed++; console.log('FAIL  combined findings'); }

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
