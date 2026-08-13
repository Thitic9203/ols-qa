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

async function pageAll(call, urlBase) {
  const out = [];
  for (let page = 1; page <= 40; page++) {
    const r = await call('GET', urlBase + (urlBase.includes('?') ? '&' : '?') + 'limit=50&page=' + page);
    if (r.status !== 200) { out.__err = 'http ' + (r.status || r.error) + ' @page ' + page; break; }
    const j = r.json || {};
    const arr = j.data || j.items || (Array.isArray(j) ? j : []);
    out.push(...arr);
    const total = j.total != null ? j.total : arr.length;
    if (out.length >= total || arr.length === 0) break;
    await sleep(120);
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
    report.finishedAt = new Date().toISOString();
    report.ok = true;
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
