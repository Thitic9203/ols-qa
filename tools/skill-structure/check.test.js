#!/usr/bin/env node
'use strict';
// Known-answer tests for tools/skill-structure + the real repo must pass (mirrors helix CI).
const assert = require('assert');
const path = require('path');
const { checkText, run } = require('./check');
let pass = 0; let fail = 0;
const t = (n, f) => { try { f(); pass++; console.log(`PASS  ${n}`); } catch (e) { fail++; console.log(`FAIL  ${n}\n      ${e.message}`); } };
const good = `---\nname: x\ndescription: |\n  Does x.\n  Do NOT use for y.\n---\n## Refusal-first (precondition gate)\n## QA closing\n`;
t('a complete SKILL.md passes', () => assert.deepStrictEqual(checkText('x', good), []));
t('missing Refusal-first is caught (helix 2026-10-25 sync failure)', () => assert.deepStrictEqual(checkText('x', good.replace('## Refusal-first (precondition gate)\n', '## Scope\n')), ['x: missing Refusal-first section']));
t('missing QA closing is caught', () => assert.deepStrictEqual(checkText('x', good.replace('## QA closing\n', '')), ['x: missing ## QA closing section']));
const bad = 'x: frontmatter still has proactive_triggers (removed; put trigger phrases in description)';
t('proactive_triggers under metadata: is caught', () => assert.deepStrictEqual(checkText('x', good.replace('\n---\n## Ref', '\nmetadata:\n  proactive_triggers:\n    - do x\n---\n## Ref')), [bad]));
t('top-level proactive_triggers is caught', () => assert.deepStrictEqual(checkText('x', good.replace('\n---\n## Ref', '\nproactive_triggers:\n  - do x\n---\n## Ref')), [bad]));
t('proactive_triggers in the body (not frontmatter) is allowed', () => assert.deepStrictEqual(checkText('x', good + 'proactive_triggers: removed\n'), []));
t('no "Do NOT use" in the first 20 lines is caught', () => assert.deepStrictEqual(checkText('x', good.replace('  Do NOT use for y.\n', '')), ['x: description must include Do NOT use (negative case) in the first 20 lines']));
// Owner Q3 (11/Nov/2026, docs/sdd/r11-skill-fixes-g2 R15): review-result and test-data-prep ship in helix, so only 2 stay local.
t('skill-routing.md marks only content-takedown and smoke-test as ols-qa-only; review-result and test-data-prep ship', () => { const s = require('./check').localOnly(path.resolve(__dirname, '..', '..')); ['content-takedown-workflow', 'smoke-test-workflow'].forEach((n) => assert.ok(s.has(n), `${n} must be ols-qa-only`)); ['review-result-workflow', 'test-data-prep-workflow', 'helix'].forEach((n) => assert.ok(!s.has(n), `${n} must not be ols-qa-only`)); });
t('repo skills pass the helix structure rules', () => { const v = run(path.resolve(__dirname, '..', '..')); assert.strictEqual(v.length, 0, v.join('\n')); });
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
