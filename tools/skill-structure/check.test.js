#!/usr/bin/env node
'use strict';
// Known-answer tests for tools/skill-structure + the real repo must pass (mirrors helix CI).
const assert = require('assert');
const path = require('path');
const { checkText, run } = require('./check');
let pass = 0; let fail = 0;
const t = (n, f) => { try { f(); pass++; console.log(`PASS  ${n}`); } catch (e) { fail++; console.log(`FAIL  ${n}\n      ${e.message}`); } };
const good = `---\nname: x\ndescription: |\n  Does x.\n  Do NOT use for y.\nmetadata:\n  proactive_triggers:\n    - do x\n---\n## Refusal-first (precondition gate)\n## QA closing\n`;
t('a complete SKILL.md passes', () => assert.deepStrictEqual(checkText('x', good), []));
t('missing Refusal-first is caught (helix 2026-10-25 sync failure)', () => assert.deepStrictEqual(checkText('x', good.replace('## Refusal-first (precondition gate)\n', '## Scope\n')), ['x: missing Refusal-first section']));
t('missing QA closing is caught', () => assert.deepStrictEqual(checkText('x', good.replace('## QA closing\n', '')), ['x: missing ## QA closing section']));
t('top-level proactive_triggers is caught', () => assert.deepStrictEqual(checkText('x', good.replace('metadata:\n  proactive_triggers:\n    - do x', 'proactive_triggers:\n  - do x')), ['x: proactive_triggers must be listed under metadata:']));
t('no "Do NOT use" in the first 20 lines is caught', () => assert.deepStrictEqual(checkText('x', good.replace('  Do NOT use for y.\n', '')), ['x: description must include Do NOT use (negative case) in the first 20 lines']));
t('skill-routing.md marks the 4 ols-qa-only skills as not shipped', () => { const s = require('./check').localOnly(path.resolve(__dirname, '..', '..')); ['content-takedown-workflow', 'review-result-workflow', 'smoke-test-workflow', 'test-data-prep-workflow'].forEach((n) => assert.ok(s.has(n), n)); assert.ok(!s.has('helix')); });
t('repo skills pass the helix structure rules', () => { const v = run(path.resolve(__dirname, '..', '..')); assert.strictEqual(v.length, 0, v.join('\n')); });
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
