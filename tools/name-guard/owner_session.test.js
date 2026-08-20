/* Pins how the scanner logs in as each creator to read that creator's own library.
 *
 * Story, because the code alone does not tell it. The scheduled pre-prod run of
 * 2026-08-20 11:00 reported `own:carroll…: login failed` and failed the whole scan —
 * correctly, since a source that could not be read is not a source that is clean. But the
 * report said nothing else, and nothing else was recoverable afterwards: the same account
 * logged in fine by hand minutes later (auth API 201, browser session role CREATOR), the
 * other three creators in the same run were fine, and no VPN flap was logged. The cause of
 * that one blip is gone forever, because the own-account login was the ONE login path in the
 * scanner that captured no auth response, waited a fixed six seconds instead of waiting for
 * the session, and gave up after a single attempt.
 *
 * So this module exists to make that path answerable: wait for the session rather than
 * guessing at a duration, try again once, and when it still fails, say what the auth backend
 * actually replied.
 *
 * What must NOT change:
 *   · failure is still failure — a creator we could not read fails the run (fail-closed)
 *   · the retry is bounded — an outage must not turn into a long hang
 *   · nothing here writes: reading a creator's own library is read-only by construction
 *
 *   node tools/name-guard/owner_session.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { establishOwnerSession } = require('./owner_session.js');

let failed = 0;
function t(name, fn) {
  const done = (e) => { if (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); } else console.log('  ok   ' + name); };
  let r;
  try { r = fn(); } catch (e) { done(e); return Promise.resolve(); }
  return Promise.resolve(r).then(() => done(), done);
}

// A fake login/session pair. `sessionAfter` = how many polls before a user appears
// (Infinity = never), `failLogins` = how many login attempts produce no session at all.
function fake({ sessionAfter = 1, authErrors = [], loginThrows = 0 } = {}) {
  const state = { logins: 0, polls: 0, slept: 0 };
  return {
    state,
    login: async () => {
      state.logins++;
      state.polls = 0;
      if (state.logins <= loginThrows) throw new Error('submit blew up');
    },
    session: async () => {
      state.polls++;
      const reach = typeof sessionAfter === 'function' ? sessionAfter(state) : sessionAfter;
      return state.polls >= reach ? { user: { role: 'CREATOR' } } : null;
    },
    authErrors: () => authErrors,
    sleep: async (ms) => { state.slept += ms; },
  };
}

(async () => {
  console.log('own-account session');

  await t('returns the session once it appears, without waiting a fixed duration', async () => {
    const f = fake({ sessionAfter: 3 });
    const r = await establishOwnerSession(f);
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    assert.strictEqual(r.session.user.role, 'CREATOR');
    assert.strictEqual(f.state.logins, 1, 'one login was enough');
    assert.ok(f.state.slept < 6000,
      'waited ' + f.state.slept + 'ms for a session that was ready earlier — this path used to '
      + 'sleep a flat 6000ms whether or not the session was up');
  });

  await t('a first attempt that never lands is retried', async () => {
    // no session on the first login, session on the second
    const f = fake({ sessionAfter: (s) => (s.logins === 1 ? Infinity : 2) });
    const r = await establishOwnerSession(f);
    assert.strictEqual(r.ok, true, 'the 2026-08-20 blip should have been survivable: ' + JSON.stringify(r));
    assert.strictEqual(f.state.logins, 2);
  });

  await t('gives up after a bounded number of attempts', async () => {
    const f = fake({ sessionAfter: Infinity });
    const r = await establishOwnerSession(f);
    assert.strictEqual(r.ok, false, 'a creator we cannot read must fail, never pass quietly');
    assert.ok(f.state.logins >= 2, 'one attempt reproduces the original flake');
    assert.ok(f.state.logins <= 3, 'attempted ' + f.state.logins + ' times — an outage would hang the run');
  });

  await t('says what the auth backend replied, instead of a bare "login failed"', async () => {
    const f = fake({ sessionAfter: Infinity, authErrors: ['401 login-with-email: bad credentials'] });
    const r = await establishOwnerSession(f);
    assert.strictEqual(r.ok, false);
    assert.ok(/401 login-with-email: bad credentials/.test(r.error),
      'the reason must reach the report, otherwise the next blip is unanswerable again: ' + r.error);
  });

  await t('still reports usefully when the backend said nothing at all', async () => {
    const f = fake({ sessionAfter: Infinity });
    const r = await establishOwnerSession(f);
    assert.ok(/no session/i.test(r.error) && /\d/.test(r.error),
      'expected a reason naming the attempts, got: ' + r.error);
  });

  await t('a login that throws is reported, not propagated', async () => {
    const f = fake({ sessionAfter: Infinity, loginThrows: 3 });
    const r = await establishOwnerSession(f);
    assert.strictEqual(r.ok, false);
    assert.ok(/submit blew up/.test(r.error), r.error);
  });

  await t('the wait is bounded even when the session never comes', async () => {
    const f = fake({ sessionAfter: Infinity });
    await establishOwnerSession(f);
    assert.ok(f.state.slept <= 90000,
      'slept ' + f.state.slept + 'ms across all attempts — a stuck creator must not eat the run');
  });

  await t('the error is one line, so the alert gate can carry it', async () => {
    const f = fake({ sessionAfter: Infinity, authErrors: ['500 login-with-email: boom\nstack\nmore'] });
    const r = await establishOwnerSession(f);
    assert.ok(!/\n/.test(r.error), 'multi-line error would be split across alert lines: ' + JSON.stringify(r.error));
  });

  console.log();
  console.log('the scanner uses it for every creator');

  const scanSrc = fs.readFileSync(path.join(__dirname, 'scan.js'), 'utf8');

  await t('the own-account loop goes through the helper', () => {
    assert.ok(/establishOwnerSession/.test(scanSrc),
      'the creator loop must use the shared helper, not its own fixed-sleep login');
  });

  await t('no bare "login failed" is written into the report any more', () => {
    assert.ok(!/error:\s*'login failed'/.test(scanSrc),
      'a bare "login failed" is exactly the string that made 2026-08-20 unanswerable');
  });

  await t('the creator login captures what the auth backend answered', () => {
    const loop = scanSrc.slice(scanSrc.indexOf('for (const email of ownEmails)'));
    assert.ok(/on\('response'/.test(loop),
      'the creator context must listen to auth responses, like ssoLogin() already does');
  });

  console.log();
  if (failed) { console.log(failed + ' FAILED'); process.exit(1); }
  console.log('all green');
})();
