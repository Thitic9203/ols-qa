'use strict';
/* Log in as one creator and wait until that creator actually has a session.
 *
 * Why this is not inline in scan.js any more: the own-account login was the one login path
 * in the scanner with no evidence and no second chance. It submitted the form, slept a flat
 * six seconds, asked once whether there was a session, and on `null` wrote the string
 * "login failed" into the report. On 2026-08-20 11:00 that is exactly what happened to one of
 * four creators; every later check (auth API, browser session, the other three creators, the
 * VPN log) said the account and the environment were fine, and the cause of the blip was
 * unrecoverable — because nothing had been recorded.
 *
 * So: wait for the session instead of guessing at a duration, try once more if it never
 * arrives, and when it still does not, report what the auth backend actually answered.
 *
 * What deliberately did NOT change: a creator that cannot be read still fails the run. The
 * scan is a guard; "could not read" is never "nothing to report". The retry is bounded for
 * the same reason the navigation retry is — a real outage must fail loudly and quickly, not
 * hang.
 *
 * Read-only by construction: this module only submits credentials and reads a session.
 */

const DEFAULTS = {
  attempts: 2,      // one retry — enough for a blip, short enough that an outage still fails fast
  pollMs: 500,
  budgetMs: 20000,  // per attempt; a session that needs longer than this is a real problem
};

const oneLine = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

async function establishOwnerSession(io) {
  const attempts = io.attempts || DEFAULTS.attempts;
  const pollMs = io.pollMs || DEFAULTS.pollMs;
  const budgetMs = io.budgetMs || DEFAULTS.budgetMs;
  const thrown = [];

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await io.login();
    } catch (e) {
      thrown.push(oneLine((e && e.message) || e));
    }
    // Poll rather than sleep a fixed span: the session was measured landing anywhere between
    // 0.8s and 5.8s on the four pre-prod creators, so any single constant is either wasteful
    // or wrong.
    for (let waited = 0; waited <= budgetMs; waited += pollMs) {
      let s = null;
      try { s = await io.session(); } catch (e) { thrown.push(oneLine((e && e.message) || e)); }
      if (s && s.user) return { ok: true, session: s, attempts: attempt };
      await io.sleep(pollMs);
    }
  }

  // Whatever the auth backend said is the useful part; the attempt count is the fallback.
  const replies = (io.authErrors ? io.authErrors() : []) || [];
  const seen = [...new Set(replies.concat(thrown).map(oneLine).filter(Boolean))];
  const why = seen.length
    ? seen.join(' | ')
    : 'no session after ' + attempts + ' login attempts (' + Math.round(budgetMs / 1000) + 's each)';
  return { ok: false, attempts, error: oneLine(why).slice(0, 160) };
}

module.exports = { establishOwnerSession, DEFAULTS };
