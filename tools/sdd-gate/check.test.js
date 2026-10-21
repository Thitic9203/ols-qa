// Spec: docs/sdd/sdd-commit-gate R5 — the known-answer self-test runs with every suite run.
'use strict';
const assert = require('assert');
const { selfTest, specSlug } = require('./check.js');

assert.deepStrictEqual(selfTest(), [], 'self-test must match every known answer');
assert.strictEqual(specSlug('x\n\nSpec: docs/sdd/abc R1 R2'), 'abc');
assert.strictEqual(specSlug('x\n\nspec: abc-def R3'), 'abc-def');
assert.strictEqual(specSlug('x\n\nSpec: R4'), null);
assert.strictEqual(specSlug('x\n\nSpec: none'), null);
assert.strictEqual(specSlug('x'), null);
console.log('[sdd-gate] ✓ check.test.js — self-test + 5 slug cases');
