#!/usr/bin/env node
'use strict';
/* Regression test for the test-trace rule's coverage of the E2E suite's own fixtures.
 *
 * On 2026-08-17 eighteen courses named `[E2E] คอร์สทดสอบอัตโนมัติ …` were found sitting PUBLISHED on
 * shared pre-prod: the automated suite seeds them, and its cleanup had been failing silently because
 * `DELETE /api/courses/{id}` answers 409 for anything that has ever been published. Those particular
 * names were catchable only by accident — the Thai word "ทดสอบ" in them matched — while the marker the
 * suite actually stamps, `[E2E]`, matched nothing at all. An English-only `[E2E] course` was invisible
 * to the scan, which is precisely the name a future fixture is most likely to carry.
 *
 * This pins both directions: the marker is caught on its own, and the rule does not fire on ordinary
 * course names that merely contain those letters inside a word.
 *
 *   node tools/name-guard/test_trace_rules.test.js
 */
const assert = require('assert');
const rules = require('./name_rules');

const hasTestTrace = (text) => rules.checkText(text, 'title').some((f) => f.rule === 'test-trace');

const cases = [
  // must be caught — the suite's own markers, with and without the Thai word that used to save us
  { name: 'the marker alone, English only', text: '[E2E] course', expect: true },
  { name: 'the marker with a real-looking Thai name', text: '[E2E] การเขียนโปรแกรมเบื้องต้น', expect: true },
  { name: 'the marker lowercase, no brackets', text: 'e2e seed course', expect: true },
  { name: 'the original leaked name (Thai word also matches)', text: '[E2E] คอร์สทดสอบอัตโนมัติ 1755403', expect: true },
  { name: 'existing QA markers still caught', text: 'QA_OLS33 ทดสอบ', expect: true },

  // must NOT be caught — ordinary content that happens to contain the letters
  { name: 'letters inside a word are not the marker', text: 'note2end การจดบันทึก', expect: false },
  { name: 'a normal Thai course name', text: 'การเขียนโปรแกรมเบื้องต้นด้วย Python', expect: false },
  { name: 'a normal English course name', text: 'Introduction to Data Analysis', expect: false },
];

let failed = 0;
for (const c of cases) {
  const got = hasTestTrace(c.text);
  try {
    assert.strictEqual(got, c.expect);
    console.log(`  ok   ${c.name}`);
  } catch {
    failed++;
    console.log(`  FAIL ${c.name} — expected test-trace=${c.expect}, got ${got} for ${JSON.stringify(c.text)}`);
  }
}

console.log(failed === 0 ? `\ntest-trace rules: ${cases.length} cases pass` : `\ntest-trace rules: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
