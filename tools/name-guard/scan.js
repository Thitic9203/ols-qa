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
 * Exit codes: 0 = clean · 1 = findings · 2 = scan could not run (login/network/etc).
 */
const ORIGIN = process.env.OLS_ORIGIN;
const SSO = process.env.OLS_SSO;
const EMAIL = process.env.OLS_EMAIL;
const PW = process.env.OLS_PW;
const LABEL = process.env.OLS_ENV_LABEL;
for (const [k, v] of [['OLS_ORIGIN', ORIGIN], ['OLS_SSO', SSO], ['OLS_EMAIL', EMAIL], ['OLS_PW', PW], ['OLS_ENV_LABEL', LABEL]]) {
  if (!v) { console.error('missing env ' + k); process.exit(2); }
}

/* OLS_ENV_LABEL used to fall back to the string 'ols' when the variable was unset.
 * That default was the hole, not a convenience: a caller who forgot to pass the label did not
 * fail — the scan ran anyway, mislabelled 'ols', against whatever OLS_ORIGIN it happened to be
 * given. isProtectedEnv() below only ever matches the *label or host* against /training/i, so a
 * forgotten label was never refused on its own — it just made the report say the wrong thing
 * about which environment ran. There is no default any more: a missing label fails loudly in the
 * loop above, exactly like the other four required variables.
 *
 * A second, narrower guard: LABEL=prod is refused outright when OLS_ORIGIN still looks like a
 * lower environment. This cannot check against the literal production host — this repo is
 * public, that host is not committed here, and as of this change it has not even been decided
 * yet — but it can catch the exact mistake this fix exists to prevent: the label changed to
 * 'prod' while OLS_ORIGIN is still a copy-pasted pre-prod or training value. Token-shaped, same
 * style as write_guard's PROTECTED_HOST — not a secret, not a guess at the real prod host. It is
 * purely additive: it only ever fires when LABEL is exactly 'prod', so it changes nothing about
 * how every other label (including how training is detected below) behaves.
 */
if (LABEL === 'prod' && /preprod|training/i.test(ORIGIN)) {
  console.error('REFUSED — OLS_ENV_LABEL=prod แต่ OLS_ORIGIN ยังดูเหมือน pre-prod/training: ' + ORIGIN);
  console.error('          ตรวจ OLS_ORIGIN อีกที ห้ามเดา prod host เอง — resolve จาก secrets store ด้วยคีย์ของ prod โดยเฉพาะ');
  process.exit(2);
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

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
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
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
    const authErrors = await ssoLogin(ctx);
    const page = await ctx.newPage();
    await gotoApp(page);
    await sleep(2500);
    const liveOrigin = await page.evaluate(() => location.origin);
    if (liveOrigin !== ORIGIN) throw new Error('origin mismatch after login');
    const call = apiCall(page, ORIGIN);
    const s = (await call('GET', '/api/auth/get-session')).json;
    report.session = s && s.user ? { role: s.user.role } : null;   // never log the account itself
    if (!report.session) {
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
