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
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const rules = require('./name_rules');

const ORIGIN = process.env.OLS_ORIGIN;
const SSO = process.env.OLS_SSO;
const EMAIL = process.env.OLS_EMAIL;
const PW = process.env.OLS_PW;
const LABEL = process.env.OLS_ENV_LABEL || 'ols';
for (const [k, v] of [['OLS_ORIGIN', ORIGIN], ['OLS_SSO', SSO], ['OLS_EMAIL', EMAIL], ['OLS_PW', PW]]) {
  if (!v) { console.error('missing env ' + k); process.exit(2); }
}
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
  await page.close();
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

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const report = { env: LABEL, startedAt: new Date().toISOString(), sources: {}, findings: [] };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
    await ssoLogin(ctx);
    const page = await ctx.newPage();
    await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2500);
    const liveOrigin = await page.evaluate(() => location.origin);
    if (liveOrigin !== ORIGIN) throw new Error('origin mismatch after login');
    const call = apiCall(page, ORIGIN);
    const s = (await call('GET', '/api/auth/get-session')).json;
    report.session = s && s.user ? { role: s.user.role } : null;   // never log the account itself
    if (!report.session) throw new Error('not authenticated after SSO login');

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
        const hits = rules.checkItem({ title: it.title, description: it.description });
        if (hits.length) push(src, it, hits);
      }
      for (const d of rules.findDuplicates(items)) push(src, d.item, [d.hit]);
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
      try {
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
        await sleep(6000); await op.close();

        const opg = await octx.newPage();
        await opg.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await sleep(2500);
        const ocall = apiCall(opg, ORIGIN);
        const who = (await ocall('GET', '/api/auth/get-session')).json;
        if (!who || !who.user) { report.sources[key] = { count: 0, error: 'login failed' }; await octx.close(); continue; }
        const mine = await pageAll(ocall, '/api/media/me');
        const items = mine.map((it) => Object.assign({}, it, { title: it.title || it.name }));
        report.sources[key] = { count: items.length, error: mine.__err || null };
        const src = { key, label: 'สื่อของ ' + key };
        for (const it of items) {
          const hits = rules.checkItem({ title: it.title, description: it.description });
          if (hits.length) push(src, it, hits);
        }
        // Duplicate titles only matter for what a learner can actually see. Inside one
        // creator's own library the same title legitimately exists across workflow states
        // (draft + pending edit + unpublished copies), so restrict the check to PUBLISHED.
        for (const d of rules.findDuplicates(items.filter((x) => x.status === 'PUBLISHED'))) push(src, d.item, [d.hit]);
      } catch (e) {
        report.sources[key] = { count: 0, error: String(e.message || e).slice(0, 120) };
      } finally { await octx.close().catch(() => {}); }
    }

    report.finishedAt = new Date().toISOString();
    // A source we could not read in full means the scan did not cover the catalogue. Report
    // that as "could not run", never as a pass.
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
    console.log('FINDINGS', report.findings.length);
    for (const f of report.findings) {
      console.log('- [' + f.source + '/' + (f.status || '-') + '] ' + f.id + '  "' + f.title + '"');
      for (const h of f.hits) console.log('    · ' + h.field + ' · ' + h.rule + ' · ' + h.why);
    }
  }
  process.exit(report.ok ? (report.findings.length ? 1 : 0) : 2);
})();
