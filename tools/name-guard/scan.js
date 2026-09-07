#!/usr/bin/env node
'use strict';
/* OLS name guard — READ-ONLY scan of customer-facing content names.
 *
 * Every environment value comes from the environment, never from this file: this repo is
 * public, so hosts/accounts live in CI secrets (or ~/.ols-qa-secrets locally) only.
 *
 *   OLS_ORIGIN=https://<app-host>  OLS_SSO=https://<sso-host>/sign-in/embed \
 *   OLS_EMAIL=... OLS_PW=... node scan.js [--json report.json] [--own] [--quiet]
 *
 * Or with a session captured earlier by a person, so no password is ever typed — the only mode
 * an agent may use (see capture/session_capture.js in the QA toolkit for how the file is made):
 *
 *   OLS_ORIGIN=https://<app-host> OLS_ENV_LABEL=preprod \
 *   node scan.js --session /path/to/state_<tag>.json [--json report.json] [--own] [--quiet]
 *
 *   ...or set OLS_SESSION_STATE=/path/to/state_<tag>.json instead of the flag.
 *   In session mode OLS_EMAIL/OLS_PW/OLS_SSO are not required and are never read; a session
 *   that is missing, unreadable, expired or captured against another host is REFUSED (exit 2),
 *   never quietly replaced by a password login.
 *
 * Exit codes: 0 = clean · 1 = findings · 2 = scan could not run (login/network/etc).
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

/* A saved Playwright storageState may stand in for the password login.
 *
 * Why this exists: typing a password is something an agent is never allowed to do, for any
 * account, and no instruction from anyone overrides that. Until this flag the scanner had
 * exactly one way in — ssoLogin() typing OLS_EMAIL/OLS_PW — which made a read-only tool
 * (every API call in this file is a GET) unusable by the very sessions that most need it.
 * The rest of this toolkit already solved the problem: capture/session_capture.js writes a
 * state_<tag>.json that a person logs in for ONCE, and capture/session_verify.js +
 * session_refresh.js consume it with `newContext({ storageState: file })`. This reuses that
 * file format exactly; it does not invent a second one.
 *
 * Read from argv here rather than at the argv block further down because the answer decides
 * whether OLS_EMAIL/OLS_PW are required at all — in session mode they must NOT be, since the
 * whole point is that no password exists to supply.
 */
const SESSION_FILE = (() => {
  const a = process.argv.slice(2);
  const i = a.indexOf('--session');
  const v = i >= 0 ? a[i + 1] : process.env.OLS_SESSION_STATE;
  return v && !String(v).startsWith('--') ? String(v) : null;
})();

const ORIGIN = process.env.OLS_ORIGIN;
const SSO = process.env.OLS_SSO;
const EMAIL = process.env.OLS_EMAIL;
const PW = process.env.OLS_PW;
const RAW_LABEL = process.env.OLS_ENV_LABEL;
/* OLS_EMAIL/OLS_PW are required ONLY when there is no saved session to use. Everything else
 * stays required in both modes, so a run with no --session behaves exactly as it always has —
 * which is what the twice-daily scheduled job does. */
const REQUIRED_VARS = [['OLS_ORIGIN', ORIGIN], ['OLS_ENV_LABEL', RAW_LABEL]]
  .concat(SESSION_FILE ? [] : [['OLS_SSO', SSO], ['OLS_EMAIL', EMAIL], ['OLS_PW', PW]]);
for (const [k, v] of REQUIRED_VARS) {
  if (!v) { console.error('missing env ' + k); process.exit(2); }
}
// Every comparison below is case-insensitive on purpose (review round 1: `LABEL === 'prod'` let
// `OLS_ENV_LABEL=PROD` sail past every guard, since nothing in this file ever compared it against
// anything). LABEL keeps this normalised form from here on; the original casing is never needed
// again — the report already carries RAW_LABEL-derived text nowhere, only this.
const LABEL = RAW_LABEL.toLowerCase();

/* OLS_ENV_LABEL used to fall back to the string 'ols' when the variable was unset.
 * That default was the hole, not a convenience: a caller who forgot to pass the label did not
 * fail — the scan ran anyway, mislabelled 'ols', against whatever OLS_ORIGIN it happened to be
 * given. isProtectedEnv() below only ever matches the *label or host* against /training/i, so a
 * forgotten label was never refused on its own — it just made the report say the wrong thing
 * about which environment ran. There is no default any more: a missing label fails loudly in the
 * loop above, exactly like the other four required variables.
 *
 * An unknown label must also throw — P0-12's own clause, added here after review round 1 found
 * `OLS_ENV_LABEL=banana` cleared every guard and reached the browser. "Known" is deliberately
 * token-shaped, not an exact enum: run_guard.sh passes whatever suffix a `~/.ols-qa-secrets/
 * name-guard-<label>.env` file exists for (today, verified, that is exactly ONE file —
 * name-guard-preprod.env — so 'preprod'/'pre-prod' is the only label actually used in
 * production), and write_guard.js already recognises training-shaped labels with arbitrary
 * suffixes (training69, obectraining69, …) via a bare substring match. 'ols' — the removed
 * default — is deliberately NOT included: it was never an intentionally chosen label (no
 * name-guard-ols.env exists), and keeping it "known" would preserve exactly the hole this
 * whole fix removes.
 */
function isKnownLabelShape(label) {
  return /training/i.test(label)        // any training variant, arbitrary suffix
    || /^dev$/i.test(label)
    || /^prod$/i.test(label)
    || /^pre-?prod\d*$/i.test(label);   // preprod, pre-prod, preprod2, ...
}
if (!isKnownLabelShape(LABEL)) {
  console.error('REFUSED — OLS_ENV_LABEL "' + RAW_LABEL + '" ไม่รู้จัก (ไม่ตรง dev/prod/preprod/training pattern ใดเลย)');
  console.error('          ถ้านี่คือ env ใหม่จริง ให้เพิ่ม pattern ให้ isKnownLabelShape() รู้จักก่อน อย่าปล่อยผ่านเงียบๆ');
  process.exit(2);
}

/* Resolve <PROD_HOST> from the local, off-repo secrets store — this repo is public, so the VALUE
 * is never written here, only the key NAME (same pattern as capture/env_hosts.js). Used only for
 * the prod/origin cross-check directly below; every other host in this file still comes straight
 * from the environment, unchanged.
 */
function prodHostFromSecrets() {
  const secretsFile = path.join(os.homedir(), '.ols-qa-secrets', 'ols-secrets.md');
  let md;
  try { md = fs.readFileSync(secretsFile, 'utf8'); }
  catch (e) { return null; }
  const m = md.match(/\|\s*`<PROD_HOST>`\s*\|\s*`([^`]+)`/);
  return m ? m[1].trim() : null;
}

/* LABEL=prod used to be refused only when OLS_ORIGIN matched a two-token DENYLIST
 * (/preprod|training/i) — which means a dev origin, or any origin that simply doesn't happen to
 * contain those two words, sailed straight through unrefused. Review round 1 caught this and
 * asked for the logic inverted: an ALLOWLIST against the real resolved production host, not a
 * blocklist of two known-lower ones. Fails closed both ways — no <PROD_HOST> resolvable, or a
 * mismatch, both refuse; nothing here guesses at what the real prod host looks like.
 */
if (/^prod$/i.test(LABEL)) {
  const prodHost = prodHostFromSecrets();
  if (!prodHost) {
    console.error('REFUSED — OLS_ENV_LABEL=prod แต่ resolve <PROD_HOST> จาก ~/.ols-qa-secrets/ols-secrets.md ไม่ได้');
    process.exit(2);
  }
  let originHost = '';
  try { originHost = new URL(ORIGIN).hostname; } catch (e) { /* falls through to the mismatch check below */ }
  if (originHost.toLowerCase() !== prodHost.toLowerCase()) {
    console.error('REFUSED — OLS_ENV_LABEL=prod แต่ OLS_ORIGIN host ("' + originHost + '") ไม่ตรงกับ <PROD_HOST> จริง ("' + prodHost + '")');
    console.error('          ตรวจ OLS_ORIGIN อีกที ห้ามเดา prod host เอง — ต้องตรงกับ secrets store เป๊ะ');
    process.exit(2);
  }
  /* P0-12 also requires OLS_EMAIL/OLS_PW to be genuine production accounts, never a stale
   * pre-prod one left over in the environment. Unlike the host check just above, this cannot be
   * verified mechanically from here: preflight_roles.js can refuse on this because it owns
   * capture/accounts.json (an explicit per-row `env` field to check against); this scanner takes
   * OLS_EMAIL/OLS_PW as bare strings with no registry to compare them to, and it must not reach
   * into a private repo's account file to get one (this file is public and portable on its own).
   * So the guard here is the loudest thing actually available: an unmissable reminder printed on
   * every prod run, not a hard refusal — deliberately inconsistent with preflight_roles.js's hard
   * refusal, and this comment is that inconsistency stated in the file, per review round 1.
   */
  console.error('*** OLS_ENV_LABEL=prod — ยืนยันว่า OLS_EMAIL/OLS_PW เป็นบัญชี production จริงจากแท็บ "Account on Prod" ***');
  console.error('*** ห้ามเป็นบัญชี pre-prod ที่ค้างอยู่ใน secrets — สแกนนี้ตรวจให้ไม่ได้ (ไม่มี account registry ให้เทียบ) ***');
}

/* Hands-off environments are refused HERE, before a browser is even loaded.
 *
 * run_guard.sh already refuses a training label, but that only covers the scheduled path. A
 * scan started by hand — or by an agent that sourced the wrong env file — used to sail straight
 * through, log in as a real person, and end in an alert about other people's live work. That is
 * exactly what happened once. The refusal belongs in the tool, not only in its wrapper.
 *
 * Exit 2, not 0: this scan did not run. A 0 here would be indistinguishable from "scanned and
 * found nothing", which is the one wrong conclusion nobody could see. There is no override flag
 * on purpose — an override that exists is an override that eventually gets used.
 */
const guard = require('./write_guard');
const handsOff = guard.isProtectedEnv({ label: LABEL, origin: ORIGIN });
if (handsOff.protected) {
  console.error('REFUSED — ไม่สแกน environment นี้: ' + handsOff.reasons.join(' · '));
  console.error('          ตัวสแกนนี้ดูแลเฉพาะ pre-prod. ไม่ได้รัน = ไม่ใช่ผลว่า "สะอาด".');
  process.exit(2);
}

/* ── Saved-session mode: validated HERE, before a browser exists ───────────────────────────
 *
 * Placement is the point. Every check below sits ABOVE `require('playwright')`, so a session
 * that is missing, unreadable, malformed, expired, or captured against a different host is
 * refused before the scanner can open a browser at all. That is what makes "never fall back
 * to typing a password" structural rather than a branch someone can fall through: in session
 * mode OLS_EMAIL/OLS_PW are not even required (see the top of this file), so by the time any
 * login code could run there is nothing to type — and ssoLogin() additionally refuses to run
 * outright (third layer, at its own definition).
 *
 * Exit 2, never 0 — same contract as every other refusal in this file. "Could not run" is not
 * "scanned and found nothing"; reports #0002, #0003, #0005 and #0006 in docs/post-mortem/ are
 * all the same bug, a guard whose failure landed on the permissive side.
 */
const AUTH_COOKIE_NAMES = new Set(['access_token', 'refresh_token', 'user_proof_token',
  'session_id', '__Host-ols-auth.session_token']);

function refuseSession(msg, hint) {
  console.error('REFUSED — ' + msg);
  if (hint) console.error('          ' + hint);
  console.error('          ไม่ fallback ไปล็อกอินด้วยรหัสผ่านเด็ดขาด — agent พิมพ์รหัสผ่านไม่ได้ทุกกรณี');
  console.error('          ไม่ได้รัน = ไม่ใช่ผลว่า "สะอาด".');
  process.exit(2);
}

if (SESSION_FILE) {
  /* A creator sweep needs a password per creator, which session mode does not have. Refusing is
   * the honest answer; silently dropping the creators would let the run report a clean scan over
   * fewer sources than it claims to cover — the exact shape of report #0002. */
  if ((process.env.OLS_OWN_EMAILS || '').trim()) {
    refuseSession('ใช้ --session พร้อม OLS_OWN_EMAILS ไม่ได้',
      'creator sweep ต้องล็อกอินแยกรายบัญชีด้วยรหัสผ่าน — เก็บ session ของแต่ละ creator แล้วรันทีละใบแทน');
  }

  let raw;
  try { raw = fs.readFileSync(SESSION_FILE, 'utf8'); }
  catch (e) {
    refuseSession('เปิดไฟล์ session ไม่ได้: ' + SESSION_FILE,
      String((e && e.message) || e).split('\n')[0]);
  }

  let state;
  try { state = JSON.parse(raw); }
  catch (e) {
    refuseSession('ไฟล์ session ไม่ใช่ JSON ที่อ่านได้: ' + SESSION_FILE,
      String((e && e.message) || e).split('\n')[0]);
  }

  const cookies = state && Array.isArray(state.cookies) ? state.cookies : null;
  if (!cookies) {
    refuseSession('ไฟล์ session ไม่มี array "cookies": ' + SESSION_FILE,
      'ต้องเป็น Playwright storageState จาก capture/session_capture.js');
  }

  /* Judge life by the AUTH cookies ONLY — the lesson session_status.js already paid for. A state
   * file also carries analytics cookies, and Microsoft Clarity's ANONCHK expires ~30 minutes out;
   * taking the minimum across everything reports a perfectly healthy 24h session as expired.
   * Verified again on a live pre-prod state file while writing this: 5 auth cookies with 14.3h
   * left sitting beside an ANONCHK that was already 9.5h past its expiry. */
  const auth = cookies.filter((c) => c && AUTH_COOKIE_NAMES.has(c.name));
  if (!auth.length) {
    refuseSession('ไฟล์ session ไม่มี auth cookie สักตัว: ' + SESSION_FILE,
      'คาดหวังอย่างน้อยหนึ่งใน: ' + [...AUTH_COOKIE_NAMES].join(', '));
  }

  const exps = auth.map((c) => c.expires).filter((e) => typeof e === 'number' && e > 0);
  const soonest = exps.length ? Math.min(...exps) : null;
  if (soonest === null) {
    refuseSession('auth cookie ในไฟล์ session ไม่มีวันหมดอายุที่อ่านได้: ' + SESSION_FILE,
      'อ่านอายุไม่ได้ = ตรวจไม่ได้ = ปฏิเสธ ไม่ใช่เดาว่ายังใช้ได้');
  }
  const hoursLeft = (soonest * 1000 - Date.now()) / 3600000;
  if (hoursLeft <= 0) {
    refuseSession('session หมดอายุแล้ว (' + Math.abs(hoursLeft).toFixed(1) + ' ชม.ที่แล้ว): ' + SESSION_FILE,
      'ต่ออายุด้วย: node capture/session_refresh.js — ถ้าต่อไม่ได้ ต้องให้คนล็อกอินใหม่');
  }

  /* The saved session must belong to the host being scanned. Without this a state file captured
   * against one environment, pointed at another, produces a puzzling "not authenticated" failure
   * halfway through instead of a clear refusal at the door. Cookies land on the shared parent
   * domain, so the match is a domain-suffix test, not equality. */
  let originHost = '';
  try { originHost = new URL(ORIGIN).hostname.toLowerCase(); } catch (e) { /* refused just below */ }
  const applies = auth.some((c) => {
    const d = String(c.domain || '').toLowerCase().replace(/^\./, '');
    return d && (originHost === d || originHost.endsWith('.' + d));
  });
  if (!applies) {
    refuseSession('session นี้ไม่ได้เป็นของ host ที่กำลังจะสแกน ("' + originHost + '"): ' + SESSION_FILE,
      'คุกกี้ในไฟล์เป็นของโดเมนอื่น — เก็บ session ของ env นี้ก่อน อย่าเอาของ env อื่นมาใช้ข้าม');
  }

  console.error('session mode — ใช้ storageState ที่บันทึกไว้ ไม่มีการล็อกอินด้วยรหัสผ่าน (auth cookie '
    + auth.length + ' ตัว · เหลืออายุ ' + hoursLeft.toFixed(1) + ' ชม.)');
}

const { chromium } = require('playwright');
const rules = require('./name_rules');
const customer = require('./customer_content');
const { establishOwnerSession } = require('./owner_session');
const argv = process.argv.slice(2);
const JSON_OUT = (() => { const i = argv.indexOf('--json'); return i >= 0 ? argv[i + 1] : null; })();
const QUIET = argv.includes('--quiet');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PUBLIC_SOURCES = [
  { key: 'media', urlBase: '/api/media', label: 'สื่อ' },
  { key: 'courses', urlBase: '/api/courses', label: 'คอร์ส' },
  { key: 'learning-paths', urlBase: '/api/learning-paths', label: 'เส้นทางการเรียนรู้' },
  { key: 'achievements', urlBase: '/api/achievements', label: 'เหรียญรางวัล' },
];
// --own additionally covers this account's own content in every status (draft / flagged /
// unpublished) — invisible in the public lists but visible on creator + admin screens.
const OWN_SOURCES = [{ key: 'media-own', urlBase: '/api/media/me', label: 'สื่อของฉัน (ทุกสถานะ)' }];
const SOURCES = PUBLIC_SOURCES.concat(argv.includes('--own') ? OWN_SOURCES : []);

async function ssoLogin(ctx) {
  /* Third layer, and it must stay even though it looks unreachable.
   *
   * In session mode the call site below never calls this, and OLS_EMAIL/OLS_PW are not even
   * required — so this throw is a "cannot happen" that fails CLOSED if some future edit makes
   * it happen anyway. An agent is never permitted to type a password, so the one outcome that
   * must be impossible is a silent fallback from a bad session into this function. A guard that
   * only exists on the happy path is the shape of report #0005: the helper broke, and the guard
   * answered "nothing found" instead of "cannot check".
   */
  if (SESSION_FILE) {
    throw new Error('ssoLogin() reached while a saved session is in use — refusing to type a '
      + 'password. This is a bug in the caller: session mode must never fall back to a login.');
  }
  const page = await ctx.newPage();
  /* Capture what the auth backend actually answered. Without this a backend outage is
     reported as "not authenticated after SSO login", which reads like our bug — the real
     message ("Oracle server refused connection") is what makes the alert actionable. */
  const authReplies = [];
  page.on('response', async (res) => {
    if (!/\/auth\/(login-with-email|session)/.test(res.url())) return;
    let body = ''; try { body = await res.text(); } catch (_) {}
    let msg = body.replace(/\s+/g, ' ').slice(0, 160);
    try { const j = JSON.parse(body); if (j && j.message) msg = j.message; } catch (_) {}
    authReplies.push(res.status() + ' ' + res.url().split('/').slice(-1)[0] + ': ' + msg);
  });
  await page.goto(SSO, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500);
  const r = await page.evaluate(async ({ email, pw }) => {
    const setNative = (el, v) => {
      const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
      d.set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const e = document.querySelector('#email') || document.querySelector('input[type=email]');
    const p = document.querySelector('#password') || document.querySelector('input[type=password]');
    if (!e || !p) return { err: 'no login inputs on sign-in page' };
    setNative(e, email); setNative(p, pw);
    await new Promise((x) => setTimeout(x, 300));
    const f = e.closest('form');
    if (!f) return { err: 'no form around inputs' };
    f.requestSubmit();
    return { ok: true };
  }, { email: EMAIL, pw: PW });
  if (r.err) throw new Error('SSO login failed: ' + r.err);
  await sleep(6000);
  // the SPA retries the login, so the same failure arrives more than once — report it once
  const failed = [...new Set(authReplies.filter((x) => !/^2\d\d /.test(x)))];
  await page.close();
  return failed;
}

/* Land on the app after logging in, retrying once.
 *
 * Once the SSO cookies exist, ORIGIN + '/' 307-redirects to a role-dependent, server-rendered
 * page (for an ADMIN_CONTENT account, the pending-review queue). That page is usually a few
 * seconds and occasionally slower than the 60s timeout: both scheduled pre-prod runs on
 * 2026-08-15 died with `page.goto: Timeout 60000ms exceeded` while the unauthenticated curl
 * probe in run_guard.sh — which never follows that redirect — reported the site perfectly
 * reachable. The stall is intermittent: a failed navigation and a 5-second one were observed
 * minutes apart on the same account.
 *
 * Two things NOT to do here, both measured rather than assumed:
 *   · Do not point this at an API path to skip the render. The session is only established by
 *     loading a real app page; an /api/auth/get-session boot returns a null session. Verified
 *     A/B against pre-prod on 2026-08-16 — the API-only variant scanned nothing.
 *   · Do not raise the timeout. That hides a page that can stall for minutes behind a scanner
 *     with no business loading it.
 *
 * So: retry once. If both attempts time out the scan still fails loudly, which is the honest
 * outcome — pre-prod really was unusable for two solid minutes.
 */
async function gotoApp(page) {
  let last = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (attempt > 1) console.error('nav ok on attempt ' + attempt);
      return;
    } catch (e) {
      last = e;
      console.error('nav attempt ' + attempt + ' failed: '
        + String((e && e.message) || e).split('\n')[0]);
      await sleep(3000);
    }
  }
  throw last;
}

function apiCall(page, expectOrigin) {
  return async (method, urlPath) => page.evaluate(async ({ method, urlPath, expectOrigin }) => {
    if (location.origin !== expectOrigin) return { __originViolation: location.origin };
    try {
      const r = await fetch(urlPath, { method, credentials: 'include' });
      let j = null; try { j = await r.json(); } catch (_) {}
      return { status: r.status, json: j };
    } catch (e) { return { error: String(e).slice(0, 160) }; }
  }, { method, urlPath, expectOrigin });
}

/* Pages a list endpoint.
 * This API sometimes answers 200 with `data: []` while `total` is non-zero (observed on
 * /api/courses and /api/learning-paths). Treating that as "nothing to check" would report a
 * clean scan without having scanned anything — the exact silent failure this guard exists to
 * prevent. So: retry an empty-but-nonzero page, and if the collected count still falls short
 * of `total`, mark the source short and let the caller fail the run.
 */
async function pageAll(call, urlBase) {
  const out = [];
  let expected = null;
  for (let page = 1; page <= 40; page++) {
    let arr = null; let j = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await call('GET', urlBase + (urlBase.includes('?') ? '&' : '?') + 'limit=50&page=' + page);
      if (r.status !== 200) { out.__err = 'http ' + (r.status || r.error) + ' @page ' + page; return out; }
      j = r.json || {};
      arr = j.data || j.items || (Array.isArray(j) ? j : []);
      if (page === 1 && expected === null) expected = j.total != null ? j.total : arr.length;
      if (arr.length || !expected) break;
      await sleep(3000);
    }
    out.push(...arr);
    if (!arr.length || out.length >= (expected || 0)) break;
    await sleep(120);
  }
  if (expected != null && out.length < expected) {
    out.__err = 'short read: got ' + out.length + ' of ' + expected + ' (endpoint returned fewer items than it reported)';
  }
  return out;
}

/* A cover URL that 404s renders the same blank tile as no cover at all, so having the field is
 * not proof. Fetch each distinct cover once per run and confirm it really is an image. Runs in
 * the page so it reuses the session and the browser's own network stack; failures here never
 * abort the scan. */
async function checkCoversLoad(page, items) {
  const byUrl = new Map();
  for (const it of items) {
    const u = rules.coverUrlOf(it);
    if (u && !byUrl.has(u)) byUrl.set(u, it);
  }
  if (!byUrl.size) return [];
  let verdicts = {};
  try {
    verdicts = await page.evaluate(async (urls) => {
      const out = {};
      const one = async (u) => {
        try {
          const r = await fetch(u, { method: 'GET', cache: 'no-store' });
          if (!r.ok) return 'http ' + r.status;
          const ct = r.headers.get('content-type') || '';
          const b = await r.blob();
          if (!/^image\//i.test(ct)) return 'ไม่ใช่ไฟล์รูป (' + (ct || 'no content-type') + ')';
          if (!b.size) return 'ไฟล์ว่าง 0 ไบต์';
          return 'ok';
        } catch (e) { return 'โหลดไม่ได้: ' + String(e && e.message || e).slice(0, 60); }
      };
      for (let i = 0; i < urls.length; i += 5) {                 // small batches — never a flood
        const slice = urls.slice(i, i + 5);
        const res = await Promise.all(slice.map(one));
        slice.forEach((u, k) => { out[u] = res[k]; });
      }
      return out;
    }, [...byUrl.keys()]);
  } catch (e) {
    return [];                                                    // verification unavailable — field check still stands
  }
  const bad = [];
  for (const [u, verdict] of Object.entries(verdicts)) {
    if (verdict === 'ok') continue;
    bad.push({ item: byUrl.get(u), hit: { field: 'coverImageUrl', rule: 'cover-broken', value: u.slice(0, 120),
      why: 'ปกมี URL แต่เปิดไม่ได้ — ' + verdict + ' (การ์ดขึ้นว่างเหมือนไม่มีปก)' } });
  }
  return bad;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const report = { env: LABEL, startedAt: new Date().toISOString(), sources: {}, findings: [] };
  try {
    /* Session mode loads the saved cookies straight into the context — the same one line
     * capture/session_verify.js and session_refresh.js use — and then never logs in. Password
     * mode is byte-for-byte what it always was. */
    const ctx = await browser.newContext(Object.assign(
      { viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true },
      SESSION_FILE ? { storageState: SESSION_FILE } : {}));
    const authErrors = SESSION_FILE ? [] : await ssoLogin(ctx);
    const page = await ctx.newPage();
    await gotoApp(page);
    await sleep(2500);
    const liveOrigin = await page.evaluate(() => location.origin);
    if (liveOrigin !== ORIGIN) throw new Error('origin mismatch after login');
    const call = apiCall(page, ORIGIN);
    const s = (await call('GET', '/api/auth/get-session')).json;
    report.session = s && s.user ? { role: s.user.role } : null;   // never log the account itself
    if (!report.session) {
      /* A saved session can be revoked server-side while its cookies still look unexpired, so
       * the boot check cannot be the only one. This is where that shows up — and it FAILS, it
       * does not quietly log in instead. The message says which mode was in play, because
       * "not authenticated after SSO login" would be a plain lie about a run that never
       * attempted an SSO login. */
      if (SESSION_FILE) {
        throw new Error('saved session is not live — the cookies loaded but the app returned no '
          + 'session (revoked, or renewed elsewhere and this file left holding a rotated token). '
          + 'Refresh it with capture/session_refresh.js, or have a person capture it again. '
          + 'Not falling back to a password login.');
      }
      throw new Error('not authenticated after SSO login'
        + (authErrors && authErrors.length ? ' — auth backend replied: ' + authErrors.join(' | ') : ''));
    }

    const push = (src, it, hits) => {
      const found = report.findings.find((f) => f.id === it.id && f.source === src.key);
      if (found) { found.hits.push(...hits); return; }
      report.findings.push({ source: src.key, label: src.label, id: it.id, title: it.title,
        status: it.status, type: it.type, hits });
    };
    for (const src of SOURCES) {
      const raw = await pageAll(call, src.urlBase);
      const items = raw.map((it) => Object.assign({}, it, { title: it.title || it.name }));
      report.sources[src.key] = { count: items.length, error: raw.__err || null };
      for (const it of items) {
        const hits = rules.checkItem({ title: it.title, description: it.description })
          .concat(rules.checkAsset(it));
        if (hits.length) push(src, it, hits);
      }
      for (const d of rules.findDuplicates(items)) push(src, d.item, [d.hit]);
      for (const bad of await checkCoversLoad(page, items)) push(src, bad.item, [bad.hit]);
    }
    /* Creator-side sweep.
     * Draft / flagged / unpublished content never appears in the public lists, and
     * /api/media/me only ever returns the CALLER's own library — so junk sitting on another
     * creator's account is invisible to a single-account scan. That gap already let a batch of
     * "ทดสอบ" / "กหฟกหฟ" livestream recordings survive a clean-looking run. Each address in
     * OLS_OWN_EMAILS gets its own session and its own source entry.
     */
    const ownEmails = (process.env.OLS_OWN_EMAILS || '').split(',').map((x) => x.trim()).filter(Boolean);
    for (const email of ownEmails) {
      const key = 'own:' + email.split('@')[0];
      const octx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
      /* Keep what the auth backend answered for this creator.
       *
       * ssoLogin() has done this for the admin account for a while; the creator loop did not,
       * and on 2026-08-20 that cost the only copy of the reason one creator's session never
       * appeared. A blip with no evidence is a blip nobody can answer. */
      const oAuthErrors = [];
      octx.on('response', async (res) => {
        if (!/\/auth\/(login-with-email|session)/.test(res.url())) return;
        if (res.status() < 400) return;
        let body = ''; try { body = await res.text(); } catch (_) {}
        let msg = body.replace(/\s+/g, ' ').slice(0, 120);
        try { const j = JSON.parse(body); if (j && j.message) msg = j.message; } catch (_) {}
        oAuthErrors.push(res.status() + ' ' + res.url().split('/').slice(-1)[0] + ': ' + msg);
      });
      try {
        let opg = null;
        const sess = await establishOwnerSession({
          login: async () => {
            const op = await octx.newPage();
            await op.goto(SSO, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await sleep(2500);
            await op.evaluate(async ({ email, pw }) => {
              const setNative = (el, v) => {
                const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
                d.set.call(el, v);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              };
              const e = document.querySelector('#email'), p = document.querySelector('#password');
              if (!e || !p) return;
              setNative(e, email); setNative(p, pw);
              await new Promise((x) => setTimeout(x, 300));
              const f = e.closest('form'); if (f) f.requestSubmit();
            }, { email, pw: PW });
            /* Wait for the auth cookies before closing the login page.
             *
             * The form submit is a request made BY this page; closing it straight away
             * cancels the login in flight. The old code got away with it only because it slept
             * a flat six seconds first — remove the sleep without replacing it and three of
             * four creators stop logging in (measured against pre-prod while writing this).
             * So wait for the actual signal instead: the SSO cookies landing on the shared
             * parent domain, observed at ~0.5s on all four creators. */
            for (let i = 0; i < 30; i++) {
              const cs = await octx.cookies();
              if (cs.some((c) => /^(access_token|session_id|user_proof_token)$/.test(c.name))) break;
              await sleep(500);
            }
            await op.close();
            // The session only becomes real on a rendered app page (measured 2026-08-16), so
            // the poll below has to look from one.
            if (opg) await opg.close().catch(() => {});
            opg = await octx.newPage();
            await gotoApp(opg);
          },
          session: async () => (opg ? (await apiCall(opg, ORIGIN)('GET', '/api/auth/get-session')).json : null),
          authErrors: () => oAuthErrors,
          sleep,
        });
        if (!sess.ok) {
          report.sources[key] = { count: 0, error: sess.error };
          await octx.close();
          continue;
        }
        const ocall = apiCall(opg, ORIGIN);
        const mine = await pageAll(ocall, '/api/media/me');
        const items = mine.map((it) => Object.assign({}, it, { title: it.title || it.name }));
        report.sources[key] = { count: items.length, error: mine.__err || null };
        const src = { key, label: 'สื่อของ ' + key };
        for (const it of items) {
          const hits = rules.checkItem({ title: it.title, description: it.description })
            .concat(rules.checkAsset(it));
          if (hits.length) push(src, it, hits);
        }
        for (const bad of await checkCoversLoad(opg, items)) push(src, bad.item, [bad.hit]);
        // Duplicate titles only matter for what a learner can actually see. Inside one
        // creator's own library the same title legitimately exists across workflow states
        // (draft + pending edit + unpublished copies), so restrict the check to PUBLISHED.
        for (const d of rules.findDuplicates(items.filter((x) => x.status === 'PUBLISHED'))) push(src, d.item, [d.hit]);
      } catch (e) {
        report.sources[key] = { count: 0, error: String(e.message || e).slice(0, 120) };
      } finally { await octx.close().catch(() => {}); }
    }

    report.finishedAt = new Date().toISOString();

    /* L2 — the customer's own fixtures leave `findings` entirely.
     *
     * They are not deleted from the report (a reader should still be able to see what was
     * skipped and why), they are moved to their own list. Downstream code that iterates
     * `report.findings` — the alert builder, any fixer, any future consumer — therefore cannot
     * put them on a fix list even if it has never heard of this rule. That is structural,
     * not a filter someone has to remember to apply. */
    {
      const split = customer.partitionFindings(report.findings);
      report.findings = split.mine;
      report.customerOwned = split.customer.map((f) => Object.assign({}, f, { customerOwned: true }));
      report.customerOwnedCount = report.customerOwned.length;
    }

    // A source we could not read in full means the scan did not cover the catalogue. Report
    // that as "could not run", never as a pass.
    // cross-creator name clashes are reported, not counted as work we owe
    report.actionable = report.findings.filter((f) => f.hits.some((h) => h.rule !== 'duplicate-name-cross-creator')).length;
    const broken = Object.entries(report.sources).filter(([, v]) => v.error);
    if (broken.length) {
      report.ok = false;
      report.error = 'incomplete coverage — ' + broken.map(([k, v]) => k + ': ' + v.error).join(' | ');
    } else {
      report.ok = true;
    }
    await ctx.close().catch(() => {});
  } catch (e) {
    report.ok = false;
    report.error = String(e.message || e);
  } finally { await browser.close(); }

  if (JSON_OUT) {
    fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true });
    fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));
  }
  if (!QUIET) {
    console.log('ENV', report.env, '| session', JSON.stringify(report.session));
    console.log('SOURCES', JSON.stringify(report.sources));
    if (!report.ok) console.log('SCAN_ERROR', report.error);
    console.log('FINDINGS', report.findings.length, '| actionable', report.actionable);
    for (const f of report.findings) {
      console.log('- [' + f.source + '/' + (f.status || '-') + '] ' + f.id + '  "' + f.title + '"');
      for (const h of f.hits) console.log('    · ' + h.field + ' · ' + h.rule + ' · ' + h.why);
    }
  }
  process.exit(report.ok ? (report.actionable ? 1 : 0) : 2);
})();
