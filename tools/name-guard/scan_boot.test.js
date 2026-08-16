/* Pins how the scanner lands on the app after login, and that a failed scan can still be
 * reported to the QA channel.
 *
 * Story, because the code alone does not tell it. On 2026-08-15 both scheduled pre-prod runs
 * died with `page.goto: Timeout 60000ms exceeded` navigating to ORIGIN + '/'. With session
 * cookies present that path 307-redirects to a role-dependent, server-rendered page, and that
 * page is sometimes slower than the timeout — while the unauthenticated curl probe in
 * run_guard.sh, which never follows the redirect, reported the site perfectly reachable.
 *
 * The obvious fix — boot from an API path instead of a rendered page — was tried against
 * pre-prod on 2026-08-16 and MEASURABLY BREAKS THE SCAN: the session is only established by
 * loading a real app page, so the API-only variant reported `session null` and scanned nothing,
 * while the unchanged code on the same account minutes later returned ADMIN_CONTENT and 9
 * sources. That negative result is the reason for the first test below; without it the next
 * person makes the same "optimisation".
 *
 * Then the alert that should have announced the failure was itself rejected, because the
 * Playwright error is multi-line and the alert is validated line by line.
 *
 *   node tools/name-guard/scan_boot.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const scanSrc = fs.readFileSync(path.join(__dirname, 'scan.js'), 'utf8');
const { build } = require('./alert_format.js');
const { verify } = require('./alert_gate.js');

let failed = 0;
function t(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

console.log('scanner boot navigation');

t('boots from the app root, never from an API path', () => {
  assert.ok(/page\.goto\(ORIGIN \+ '\/'/.test(scanSrc),
    'the scan must load a real app page — an API-path boot returns a null session '
    + '(measured against pre-prod 2026-08-16), i.e. it scans nothing while looking fine');
  assert.ok(!/\.goto\(\s*ORIGIN\s*\+\s*BOOT_PATH/.test(scanSrc),
    'do not reintroduce an API-path boot');
});

t('both entry points go through the retrying helper', () => {
  const helper = (scanSrc.match(/await gotoApp\(/g) || []).length;
  assert.strictEqual(helper, 2,
    'expected the main scan and the own-account loop to use gotoApp(), found ' + helper);
  // The helper itself holds the only raw navigation; nothing outside it may navigate directly.
  const outside = scanSrc.replace(/async function gotoApp\([\s\S]*?\n}\n/, '');
  const raw = (outside.match(/await \w+\.goto\(ORIGIN \+ '\/'/g) || []).length;
  assert.strictEqual(raw, 0, 'a navigation outside gotoApp() bypasses the retry');
});

t('the navigation is retried, and only a bounded number of times', () => {
  const m = scanSrc.match(/attempt <= (\d+)/);
  assert.ok(m, 'gotoApp must loop over a bounded number of attempts');
  const attempts = Number(m[1]);
  assert.ok(attempts >= 2, 'a single attempt reproduces the 2026-08-15 failure');
  assert.ok(attempts <= 3, 'retrying more than a few times turns a real outage into a long hang');
});

t('a persistent failure still throws', () => {
  assert.ok(/throw last/.test(scanSrc),
    'if every attempt fails the scan must fail loudly — a swallowed navigation error would '
    + 'let the run report a clean scan of nothing');
});

t('the timeout was not simply raised', () => {
  for (const r of scanSrc.match(/timeout:\s*(\d+)/g) || []) {
    const ms = Number(r.replace(/\D/g, ''));
    assert.ok(ms <= 60000, 'timeout raised to ' + ms + ' — that hides the slow page, not fixes it');
  }
});

console.log('scan-failure alert survives a multi-line error');

const MULTILINE = 'page.goto: Timeout 60000ms exceeded.\nCall log:\n  - navigating to '
  + '"https://example.invalid/", waiting until "domcontentloaded"\n';

t('a multi-line scan error still produces a gate-valid alert', () => {
  const res = verify(build({ ok: false, env: 'preprod', error: MULTILINE }));
  assert.deepStrictEqual(res.failures, [],
    'the alert reporting a failed scan was itself rejected: ' + JSON.stringify(res.failures));
  assert.strictEqual(res.ok, true);
});

t('the reason is kept, not dropped', () => {
  const msg = build({ ok: false, env: 'preprod', error: MULTILINE });
  assert.ok(/Timeout 60000ms exceeded/.test(msg), 'the cause must survive flattening');
});

t('the flattened error occupies exactly one line', () => {
  const msg = build({ ok: false, env: 'preprod', error: MULTILINE });
  const lines = msg.split('\n').filter((l) => /Timeout 60000ms/.test(l));
  assert.strictEqual(lines.length, 1, 'error text spread across ' + lines.length + ' lines');
  assert.ok(!/Call log:\n/.test(msg), 'raw multi-line block leaked into the alert');
});

t('an absent error still reads sensibly', () => {
  assert.ok(/ไม่ทราบสาเหตุ/.test(build({ ok: false, env: 'preprod', error: '' })));
});

t('a very long error is truncated rather than rejected', () => {
  const res = verify(build({ ok: false, env: 'preprod', error: 'x'.repeat(5000) }));
  assert.deepStrictEqual(res.failures, [], JSON.stringify(res.failures));
});

console.log();
if (failed) { console.log(failed + ' FAILED'); process.exit(1); }
console.log('all green');
