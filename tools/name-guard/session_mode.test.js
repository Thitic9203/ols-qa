/* Pins that scan.js can run from a saved Playwright storageState, and that a bad session is
 * REFUSED rather than quietly replaced by a password login.
 *
 * Why this exists. The scanner had exactly one way to authenticate: ssoLogin() typing
 * OLS_EMAIL/OLS_PW into the sign-in form. That made an otherwise read-only tool (every API call
 * in scan.js is a GET) unusable by an agent, because an agent may never type a password — for
 * any account, and no instruction from anyone overrides that. The rest of the QA toolkit had
 * already solved this: capture/session_capture.js writes a state_<tag>.json that a PERSON logs
 * in for once, and capture/session_verify.js / session_refresh.js consume it with
 * `newContext({ storageState: file })`. Session mode reuses that file format; it invents nothing.
 *
 * The dangerous failure is not "the session is bad" — it is "the session is bad AND the tool
 * helpfully logs in with a password instead". docs/post-mortem/ carries four reports (#0002,
 * #0003, #0005, #0006) that are all one bug: a guard whose failure landed on the permissive
 * side. So the checks below care less about the happy path than about every way the session can
 * be wrong, and assert on the MESSAGE as well as the exit code — report #0002 was found only
 * because a gate exited 1 for the wrong reason with an empty message column.
 *
 *   node tools/name-guard/session_mode.test.js
 *
 * No password appears anywhere in this file and no network call is made. Every session used
 * here is a synthetic fixture written to a temp dir; the cookie names are the real auth-cookie
 * names (they are not secret — they are the same list capture/session_status.js pins), the
 * hosts are all *.example.test, and no real host, account or state file is touched.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const scanSrc = fs.readFileSync(path.join(__dirname, 'scan.js'), 'utf8');

let failed = 0;
let ran = 0;
function t(name, fn) {
  ran++;
  try { fn(); console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

/* Spawn scan.js with a controlled environment.
 *
 * Safe without playwright installed (this repo has no dependencies): every guard under test
 * sits ABOVE `require('playwright')` in scan.js, so a run meant to be refused exits before
 * reaching it. The cases that are meant to CLEAR every guard would reach that require and die
 * on it — so those assert on the absence of a refusal and the presence of the session banner,
 * both of which hold whether the require throws (today) or succeeds (after a future install).
 * The timeout means a later `npm install playwright` can never turn this into a network hang.
 */
function runScan(env, args) {
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'scan.js')].concat(args || []), {
      env: Object.assign({ PATH: process.env.PATH, HOME: TMP }, env),
      stdio: 'pipe',
      timeout: 8000,
    });
    return { code: 0, out: String(out), err: '' };
  } catch (e) {
    return { code: e.status, out: String(e.stdout || ''), err: String(e.stderr || '') };
  }
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'scanjs-session-'));
const HOST = 'ols-app.example.test';
const ORIGIN = 'https://' + HOST;

/* The five names scan.js treats as auth cookies. Deliberately the same list as
 * capture/session_status.js: a state file also carries analytics cookies, and judging expiry
 * across ALL of them reports a healthy 24h session as expired — measured, not theoretical.
 * Microsoft Clarity's ANONCHK is in every fixture below precisely to pin that. */
const EXPIRED_ANALYTICS = { name: 'ANONCHK', domain: '.c.clarity.ms', expires: nowSec() - 9999 };

function nowSec() { return Math.floor(Date.now() / 1000); }

function writeState(name, cookies) {
  const f = path.join(TMP, name);
  fs.writeFileSync(f, JSON.stringify({ cookies, origins: [] }));
  return f;
}

const liveCookies = (domain) => ([
  { name: 'access_token', domain: domain || '.example.test', expires: nowSec() + 86400 },
  { name: 'refresh_token', domain: domain || '.example.test', expires: nowSec() + 86400 },
  { name: 'session_id', domain: domain || '.example.test', expires: nowSec() + 86400 },
  EXPIRED_ANALYTICS,
]);

const GOOD = writeState('good.json', liveCookies());
const EXPIRED = writeState('expired.json', [
  { name: 'access_token', domain: '.example.test', expires: nowSec() - 3600 },
  { name: 'session_id', domain: '.example.test', expires: nowSec() - 3600 },
]);
const NO_AUTH = writeState('noauth.json', [EXPIRED_ANALYTICS,
  { name: '_ga', domain: '.example.test', expires: nowSec() + 86400 }]);
const NO_EXPIRY = writeState('noexpiry.json', [{ name: 'access_token', domain: '.example.test', expires: -1 }]);
const OTHER_HOST = writeState('otherhost.json', liveCookies('.somewhere-else.test'));
const NOT_A_STATE = writeState('notastate.json', undefined); // {"origins":[]} with no cookies array
const CORRUPT = path.join(TMP, 'corrupt.json');
fs.writeFileSync(CORRUPT, '{ this is not json');
const MISSING = path.join(TMP, 'does-not-exist.json');

// Session mode deliberately does NOT require OLS_SSO / OLS_EMAIL / OLS_PW. That absence is the
// whole point, so the base environment here carries none of them.
const SESSION_ENV = { OLS_ORIGIN: ORIGIN, OLS_ENV_LABEL: 'preprod' };
// Password mode's environment, unchanged from what the scheduled job has always passed.
const PW_ENV = {
  OLS_ORIGIN: ORIGIN,
  OLS_ENV_LABEL: 'preprod',
  OLS_SSO: 'https://sso.example.test/sign-in/embed',
  OLS_EMAIL: 'qa@example.test',
  OLS_PW: 'fixture-not-a-real-credential',
};

console.log('(a) a valid saved session runs, and no login is attempted');

t('a valid session clears every guard without OLS_EMAIL/OLS_PW existing at all', () => {
  const r = runScan(SESSION_ENV, ['--session', GOOD]);
  assert.ok(!/REFUSED/.test(r.err), 'a live session must not be refused: ' + r.err);
  assert.ok(!/missing env OLS_(EMAIL|PW|SSO)/.test(r.err),
    'session mode must not demand credentials — that is the entire point: ' + r.err);
});

t('it says out loud that it is using a saved session and typing no password', () => {
  const r = runScan(SESSION_ENV, ['--session', GOOD]);
  assert.ok(/session mode/.test(r.err), 'the run must announce the mode it is in: ' + r.err);
  assert.ok(/ไม่มีการล็อกอินด้วยรหัสผ่าน/.test(r.err), 'the banner must state no password login: ' + r.err);
});

t('OLS_SESSION_STATE is honoured as well as the flag', () => {
  const r = runScan(Object.assign({ OLS_SESSION_STATE: GOOD }, SESSION_ENV), []);
  assert.ok(/session mode/.test(r.err), 'the env var must work like the flag: ' + r.err);
  assert.ok(!/missing env OLS_EMAIL/.test(r.err), r.err);
});

t('an expired analytics cookie does not make a live session look dead', () => {
  // Every fixture above carries an ANONCHK that expired long ago. If expiry were judged across
  // all cookies rather than the auth set, this run would be refused as expired — which is
  // exactly what happened once to a perfectly healthy 24h session.
  const r = runScan(SESSION_ENV, ['--session', GOOD]);
  assert.ok(!/หมดอายุแล้ว/.test(r.err),
    'expiry must be judged on auth cookies only, not on analytics cookies: ' + r.err);
});

t('the call site cannot call ssoLogin when a session is supplied', () => {
  assert.ok(/SESSION_FILE \? \[\] : await ssoLogin\(ctx\)/.test(scanSrc),
    'the login call must be skipped in session mode at the call site');
  assert.ok(/storageState: SESSION_FILE/.test(scanSrc),
    'the saved cookies must actually be loaded into the browser context');
});

t('ssoLogin itself refuses to run in session mode — the layer that survives a bad edit', () => {
  const body = scanSrc.slice(scanSrc.indexOf('async function ssoLogin'));
  const head = body.slice(0, body.indexOf('const page = await ctx.newPage()'));
  assert.ok(/if \(SESSION_FILE\)/.test(head) && /throw new Error/.test(head),
    'ssoLogin must throw immediately when a session is in use, before it touches a page — '
    + 'without it, one careless edit at the call site silently restores password typing');
});

console.log();
console.log('(b) a bad session REFUSES loudly — it never falls back to a password');

const BAD = [
  ['a missing file', MISSING, /เปิดไฟล์ session ไม่ได้/],
  ['a corrupt file', CORRUPT, /ไม่ใช่ JSON ที่อ่านได้/],
  ['a file with no cookies array', NOT_A_STATE, /ไม่มี array "cookies"/],
  ['a file with no auth cookie', NO_AUTH, /ไม่มี auth cookie/],
  ['an auth cookie with no readable expiry', NO_EXPIRY, /ไม่มีวันหมดอายุที่อ่านได้/],
  ['an expired session', EXPIRED, /หมดอายุแล้ว/],
  ['a session captured against another host', OTHER_HOST, /ไม่ได้เป็นของ host ที่กำลังจะสแกน/],
];

for (const [what, file, pattern] of BAD) {
  t(what + ' is refused with exit 2 and a message that names the problem', () => {
    const r = runScan(SESSION_ENV, ['--session', file]);
    assert.strictEqual(r.code, 2,
      'expected exit 2 (could not run), got ' + r.code + ' — stderr: ' + r.err);
    assert.ok(pattern.test(r.err),
      'the refusal must say what is actually wrong, not just fail: ' + r.err);
  });

  t(what + ' never falls back to a password login', () => {
    const r = runScan(SESSION_ENV, ['--session', file]);
    assert.ok(/ไม่ fallback ไปล็อกอินด้วยรหัสผ่าน/.test(r.err),
      'every session refusal must state that it is not falling back: ' + r.err);
    assert.ok(!/missing env OLS_(EMAIL|PW)/.test(r.err),
      'a bad session must NOT degrade into asking for credentials — that is the fallback this '
      + 'whole change exists to make impossible: ' + r.err);
    assert.ok(!/sign-in|login-with-email/.test(r.out),
      'nothing about a login may be attempted: ' + r.out);
  });
}

t('a refusal is exit 2, never exit 0 — "could not run" is not "clean"', () => {
  for (const [, file] of BAD) {
    const r = runScan(SESSION_ENV, ['--session', file]);
    assert.notStrictEqual(r.code, 0,
      'exit 0 on ' + path.basename(file) + ' would be indistinguishable from a clean scan');
  }
});

t('the session guard sits ABOVE require(playwright) — that placement is what makes it structural', () => {
  const guardAt = scanSrc.indexOf('if (SESSION_FILE) {');
  // Anchor on the real statement, not on the string "require('playwright')" — prose above the
  // guard mentions it too, and matching that made this check compare the guard against a
  // COMMENT. It failed the first time it ran for exactly that reason, which is the only kind of
  // self-test worth having: it measured the wrong thing and said so instead of going green.
  const pwAt = scanSrc.indexOf("const { chromium } = require('playwright');");
  assert.ok(guardAt > 0 && pwAt > 0, 'both markers must exist');
  assert.ok(guardAt < pwAt,
    'the validation must run before a browser can be created; below the require, a bad session '
    + 'would already have opened a browser and the refusal becomes a cleanup problem');
});

t('a session pointed at a hands-off environment is still refused — the fix did not erode that', () => {
  const r = runScan({ OLS_ORIGIN: 'https://training69-ols.example.test', OLS_ENV_LABEL: 'training69' },
    ['--session', GOOD]);
  assert.strictEqual(r.code, 2, 'training must stay refused in session mode too, got ' + r.code);
  assert.ok(/ไม่สแกน environment นี้/.test(r.err), r.err);
});

t('--session with OLS_OWN_EMAILS is refused, not silently scanned with fewer sources', () => {
  const r = runScan(Object.assign({ OLS_OWN_EMAILS: 'someone@example.test' }, SESSION_ENV),
    ['--session', GOOD]);
  assert.strictEqual(r.code, 2, 'expected exit 2, got ' + r.code + ' — ' + r.err);
  assert.ok(/OLS_OWN_EMAILS/.test(r.err), r.err);
  // The creator sweep needs a password per creator. Dropping those sources quietly would let the
  // run report a clean scan over less than it claims to cover — report #0002's exact shape.
});

console.log();
console.log('(c) with no session argument the original path is untouched');

t('the five original env vars are still required when no session is given', () => {
  for (const missing of ['OLS_ORIGIN', 'OLS_ENV_LABEL', 'OLS_SSO', 'OLS_EMAIL', 'OLS_PW']) {
    const env = Object.assign({}, PW_ENV);
    delete env[missing];
    const r = runScan(env, []);
    assert.strictEqual(r.code, 2, missing + ' missing should still exit 2, got ' + r.code);
    assert.ok(new RegExp('missing env ' + missing).test(r.err),
      'password mode must still demand ' + missing + ': ' + r.err);
  }
});

t('a full password-mode environment still clears every guard, exactly as before', () => {
  const r = runScan(PW_ENV, []);
  assert.ok(!/REFUSED/.test(r.err), 'the scheduled job must be unaffected: ' + r.err);
  assert.ok(!/missing env/.test(r.err), r.err);
  assert.ok(!/session mode/.test(r.err),
    'a run with no --session must not enter session mode: ' + r.err);
});

t('a bare --session with no path is not silently treated as session mode', () => {
  // `--session` swallowing the next flag (or nothing) would produce a run that thinks it has a
  // session, finds none, and is refused for a confusing reason. It must simply not be session
  // mode, which means the ordinary credential requirement applies.
  const r = runScan({ OLS_ORIGIN: ORIGIN, OLS_ENV_LABEL: 'preprod' }, ['--session', '--quiet']);
  assert.strictEqual(r.code, 2, 'expected exit 2, got ' + r.code);
  assert.ok(/missing env OLS_(SSO|EMAIL|PW)/.test(r.err),
    'with no usable session path it must fall back to the ORIGINAL requirements, not pretend '
    + 'a session exists: ' + r.err);
});

t('the scanner is still read-only — session mode introduced no write verb', () => {
  // Loading a storageState is a read. Saving one back (context.storageState({path})) would be a
  // write, and renewal is session_refresh.js's job, not this scanner's.
  assert.ok(!/storageState\(\s*\{/.test(scanSrc),
    'scan.js must never write a state file back — that belongs to capture/session_refresh.js');
  for (const verb of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.ok(!new RegExp("'" + verb + "'").test(scanSrc),
      'scan.js must stay read-only; found a ' + verb + ' method literal');
  }
});

console.log();
/* Report what was measured, and refuse on zero.
 *
 * A harness that prints "all green" without saying how many checks it ran can go green having
 * run none — that is report #0010, found in this very toolkit: 42 tests renamed out of
 * existence and the runner still exited 0 with an "all green" banner. The count is the evidence.
 */
if (!ran) {
  console.log('REFUSED — 0 checks ran. A suite that measured nothing is not a pass.');
  process.exit(1);
}
console.log(failed
  ? failed + ' FAILED of ' + ran + ' checks'
  : 'all green — ' + ran + ' checks');
process.exit(failed ? 1 : 0);
