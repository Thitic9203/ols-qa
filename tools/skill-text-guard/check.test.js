#!/usr/bin/env node
'use strict';
// Known-answer tests for tools/skill-text-guard (spec docs/sdd/helix-skill-quality R5, R11),
// plus the real repo must be clean.
const assert = require('assert');
const path = require('path');
const { checkText, run } = require('./check');

let pass = 0;
let failCount = 0;
function t(name, fn) {
  try { fn(); pass += 1; console.log(`PASS  ${name}`); } catch (e) { failCount += 1; console.log(`FAIL  ${name}\n      ${e.message}`); }
}
const rules = (line) => checkText('x.md', line).map((h) => h.rule);

// must catch — the two baseline lines (retest-bug#0, testing-ticket#0) and close variants
t('flags "If blocked → ask user for a bearer token."', () => assert.deepStrictEqual(rules('OTP/SSO per config. If blocked → ask user for a bearer token.'), ['credential-ask']));
t('flags the intake card "Login (user/password or guest)"', () => assert.deepStrictEqual(rules('  • Login (user/password or "guest")'), ['credential-ask']));
t('flags "ask the user to paste their API key"', () => assert.deepStrictEqual(rules('Then ask the user to paste their API key here.'), ['credential-ask']));
t('flags "send me the password"', () => assert.deepStrictEqual(rules('Please send me the password for the admin account.'), ['credential-ask']));
t('flags a real customer ticket key', () => assert.deepStrictEqual(rules('learned OLS-108: happens via both entry points'), ['ticket-key']));

// must not flag — rules that forbid asking, and unrelated mentions
t('passes "Never ask for or accept a password"', () => assert.deepStrictEqual(rules('Never ask for or accept a password: a dead session is restored by command.'), []));
t('passes "never ask the user to paste a password, bearer token"', () => assert.deepStrictEqual(rules('re-issue the commands — never ask the user to paste a password, bearer token or other credential into chat.'), []));
t('passes "Login account — username/email only (never a password)"', () => assert.deepStrictEqual(rules('  • Login account — username/email only, or "guest" (never a password)'), []));
t('passes a test step that types into a password field', () => assert.deepStrictEqual(rules('2. Type "password123" in the password field'), []));
t('passes provider token wording', () => assert.deepStrictEqual(rules('When the app reports the session dead and the provider token is still valid, renew.'), []));
t('passes the placeholder {ISSUE_KEY}', () => assert.deepStrictEqual(rules('Open {ISSUE_KEY} and read every comment.'), []));
t('allows real keys only in the OLS-only guide references/ols-project-guide.md', () => assert.deepStrictEqual(checkText('references/ols-project-guide.md', 'learned OLS-26').map((h) => h.rule), []));
t('still flags keys in a shipped reference', () => assert.deepStrictEqual(checkText('references/bug-priority-matrix.md', 'learned OLS-26').map((h) => h.rule), ['ticket-key']));
t('passes a non-OLS key pattern like DEMO-123', () => assert.deepStrictEqual(rules('Example ticket DEMO-123'), []));

// tracked files only: a gitignored local file with a real key is not shipped, so not flagged
t('ignores a gitignored local file; flags the same text once tracked', () => {
  const os = require('os'); const fs = require('fs'); const { execFileSync } = require('child_process');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'stg-'));
  const g = (...a) => execFileSync('git', ['-C', d, ...a], { stdio: 'ignore' });
  g('init', '-q'); fs.mkdirSync(path.join(d, 'skills')); fs.mkdirSync(path.join(d, 'references'));
  fs.writeFileSync(path.join(d, '.gitignore'), '/references/*OLS-*\n');
  fs.writeFileSync(path.join(d, 'skills', 'a.md'), 'clean\n');
  fs.writeFileSync(path.join(d, 'references', 'helix-handoff-OLS-1.md'), '# Handoff — OLS-1\n');
  g('add', '.gitignore', 'skills/a.md');
  assert.deepStrictEqual(run(d).map((h) => h.rule), []);
  fs.writeFileSync(path.join(d, 'references', 'shipped.md'), 'learned OLS-1\n'); g('add', 'references/shipped.md');
  assert.deepStrictEqual(run(d).map((h) => h.file), [path.join('references', 'shipped.md')]);
  fs.rmSync(d, { recursive: true, force: true });
});

// the real repo
t('repo skills/ references/ commands/ are clean', () => {
  const hits = run(path.resolve(__dirname, '..', '..'));
  assert.strictEqual(hits.length, 0, hits.map((h) => `${h.file}:${h.line} ${h.rule}`).join('\n'));
});

console.log(`\n${pass}/${pass + failCount} passed`);
process.exit(failCount ? 1 : 0);
