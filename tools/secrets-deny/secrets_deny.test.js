#!/usr/bin/env node
'use strict';
/**
 * Pins docs/sdd/deny-ols-secrets R1, R3: .claude/settings.json denies the OLS worker the credential
 * folder ~/.ols-qa-secrets (owner decision D26, ols-real R4 in Thitic9203/pluton-ai-agent).
 *
 *   node tools/secrets-deny/secrets_deny.test.js
 *
 * Exit 0 only if tests ran AND all passed. Zero tests run is a refusal, not a pass.
 */
const fs = require('fs');
const path = require('path');

const SETTINGS = path.resolve(__dirname, '..', '..', '.claude', 'settings.json');
const REQUIRED = [
  'Read(~/.ols-qa-secrets/**)',
  'Edit(~/.ols-qa-secrets/**)',
  'Bash(*ols-qa-secrets*)',
];

let ran = 0;
let failed = 0;
function test(name, fn) {
  ran++;
  try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
}

let settings;
test('settings.json parses', () => { settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); });
test('permissions.deny holds every R1 entry', () => {
  const deny = settings?.permissions?.deny;
  if (!Array.isArray(deny)) throw new Error('permissions.deny is not a list');
  const missing = REQUIRED.filter((r) => !deny.includes(r));
  if (missing.length) throw new Error(`missing: ${missing.join(', ')}`);
});
test('no allow entry re-opens the folder', () => {
  const allow = settings?.permissions?.allow ?? [];
  const open = allow.filter((a) => a.includes('ols-qa-secrets'));
  if (open.length) throw new Error(`allow names the folder: ${open.join(', ')}`);
});

console.log(`\n${ran} ran, ${failed} failed`);
process.exit(ran > 0 && failed === 0 ? 0 : 1);
