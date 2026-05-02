#!/usr/bin/env node
/**
 * helix-report.mjs — generates a Playwright-style HTML report from normalized JSON
 *
 * Usage:
 *   node scripts/helix-report.mjs --input=test-results/results.json [--output=playwright-report] [--title="Unit Tests"]
 *
 * Input format (test-results/results.json):
 * {
 *   "title": "Unit Tests",
 *   "duration": 12345,           // total ms
 *   "stats": { "passed": 10, "failed": 2, "skipped": 1 },
 *   "suites": [
 *     {
 *       "title": "auth.test.ts",
 *       "tests": [
 *         { "title": "login success", "status": "passed", "duration": 45, "error": null },
 *         { "title": "bad password", "status": "failed",  "duration": 12, "error": "Expected 401, got 200" }
 *       ]
 *     }
 *   ]
 * }
 */

import fs   from 'fs';
import path from 'path';

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? 'true']; })
);

const inputFile  = args.input;
const outputDir  = args.output ?? 'playwright-report';
const titleArg   = args.title;

if (!inputFile || !fs.existsSync(inputFile)) {
  console.error('Usage: node scripts/helix-report.mjs --input=results.json [--output=playwright-report] [--title="..."]');
  process.exit(1);
}

const data   = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const title  = titleArg ?? data.title ?? 'Test Report';
const stats  = data.stats ?? { passed: 0, failed: 0, skipped: 0 };
stats.total  = (stats.passed ?? 0) + (stats.failed ?? 0) + (stats.skipped ?? 0);
const suites = data.suites ?? [];
const dur    = data.duration ? `${(data.duration / 1000).toFixed(2)}s` : '';
const ts     = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
const ok     = stats.failed === 0;

// ── helpers ──────────────────────────────────────────────────────────────────

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const icon = s => ({
  passed:  '<span class="ic pass">✓</span>',
  failed:  '<span class="ic fail">✕</span>',
  skipped: '<span class="ic skip">○</span>',
}[s] ?? '<span class="ic skip">○</span>');

const badge = (n, cls, label) =>
  `<span class="badge ${cls}">${n} ${label}</span>`;

const durFmt = ms => ms >= 1000 ? `${(ms/1000).toFixed(2)}s` : `${ms}ms`;

// ── HTML ──────────────────────────────────────────────────────────────────────

const suiteRows = suites.map((suite, si) => {
  const rows = (suite.tests ?? []).map((t, ti) => {
    const id = `t${si}-${ti}`;
    const err = t.error
      ? `<div class="err"><pre>${esc(t.error)}</pre></div>`
      : '';
    return `
      <div class="test ${t.status}" onclick="toggle('${id}')">
        <span class="test-icon">${icon(t.status)}</span>
        <span class="test-title">${esc(t.title)}</span>
        <span class="test-dur">${durFmt(t.duration ?? 0)}</span>
      </div>
      ${err ? `<div id="${id}" class="detail hidden">${err}</div>` : ''}`;
  }).join('');

  const suitePass   = (suite.tests ?? []).filter(t => t.status === 'passed').length;
  const suiteFail   = (suite.tests ?? []).filter(t => t.status === 'failed').length;
  const suiteStatus = suiteFail > 0 ? 'failed' : 'passed';

  return `
    <div class="suite">
      <div class="suite-header ${suiteStatus}" onclick="toggleSuite('s${si}')">
        ${icon(suiteStatus)}
        <span class="suite-title">${esc(suite.title)}</span>
        <span class="suite-stats">${suitePass}/${(suite.tests ?? []).length}</span>
      </div>
      <div id="s${si}" class="suite-body">${rows}</div>
    </div>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         font-size: 14px; background: #fff; color: #1a1a1a; }

  /* ─── top bar ─── */
  .topbar { display: flex; align-items: center; gap: 16px; padding: 12px 24px;
            background: #2b2d42; color: #fff; flex-wrap: wrap; }
  .topbar h1 { font-size: 16px; font-weight: 600; flex: 1; min-width: 200px; }
  .topbar-meta { font-size: 12px; color: #aaa; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
           border-radius: 12px; font-size: 12px; font-weight: 600; }
  .badge.p { background: #e8f5e9; color: #2e7d32; }
  .badge.f { background: #ffebee; color: #c62828; }
  .badge.s { background: #f5f5f5; color: #616161; }
  .badge.d { background: #e3f2fd; color: #1565c0; }

  /* ─── status banner ─── */
  .banner { padding: 10px 24px; font-size: 13px; font-weight: 500; }
  .banner.ok  { background: #e8f5e9; color: #2e7d32; border-bottom: 1px solid #c8e6c9; }
  .banner.err { background: #ffebee; color: #c62828; border-bottom: 1px solid #ffcdd2; }

  /* ─── filter bar ─── */
  .filters { display: flex; gap: 8px; padding: 12px 24px; border-bottom: 1px solid #e0e0e0;
             background: #fafafa; }
  .filter-btn { padding: 4px 12px; border: 1px solid #ddd; border-radius: 16px;
                background: #fff; cursor: pointer; font-size: 12px; color: #555; }
  .filter-btn.active { border-color: #2b2d42; background: #2b2d42; color: #fff; }
  .filter-btn:hover:not(.active) { background: #f0f0f0; }

  /* ─── suite ─── */
  .suites { padding: 16px 24px; }
  .suite { margin-bottom: 8px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
  .suite-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px;
                  cursor: pointer; background: #f6f6f6; user-select: none; }
  .suite-header:hover { background: #ebebeb; }
  .suite-header.failed { background: #fff3f3; }
  .suite-title { flex: 1; font-weight: 500; font-size: 13px; }
  .suite-stats { font-size: 12px; color: #888; }
  .suite-body { border-top: 1px solid #e0e0e0; }

  /* ─── test row ─── */
  .test { display: flex; align-items: center; gap: 8px; padding: 8px 14px 8px 24px;
          cursor: pointer; border-bottom: 1px solid #f0f0f0; }
  .test:last-child { border-bottom: none; }
  .test:hover { background: #fafafa; }
  .test.failed { background: #fff8f8; }
  .test.failed:hover { background: #fff3f3; }
  .test-icon { flex-shrink: 0; }
  .test-title { flex: 1; color: #333; }
  .test-dur { font-size: 11px; color: #999; flex-shrink: 0; }

  /* ─── icons ─── */
  .ic { font-size: 13px; font-weight: 700; }
  .ic.pass { color: #4caf50; }
  .ic.fail { color: #f44336; }
  .ic.skip { color: #9e9e9e; }

  /* ─── error detail ─── */
  .detail { padding: 12px 24px 12px 40px; background: #fff8f8;
            border-top: 1px dashed #f5c0c0; }
  .detail pre { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
               font-size: 12px; color: #c62828; white-space: pre-wrap; word-break: break-all; }
  .err { background: #fff; border-left: 3px solid #f44336; padding: 8px 12px;
         border-radius: 0 4px 4px 0; }

  /* ─── util ─── */
  .hidden { display: none; }
  .empty  { padding: 32px 24px; text-align: center; color: #999; }
</style>
</head>
<body>

<div class="topbar">
  <h1>◈ ${esc(title)}</h1>
  ${badge(stats.passed,  'p', 'passed')}
  ${badge(stats.failed,  'f', 'failed')}
  ${badge(stats.skipped, 's', 'skipped')}
  ${dur ? badge(dur, 'd', '') : ''}
  <span class="topbar-meta">${esc(ts)}</span>
</div>

<div class="banner ${ok ? 'ok' : 'err'}">
  ${ok
    ? `✓ ${stats.total} test${stats.total !== 1 ? 's' : ''} passed`
    : `✕ ${stats.failed} failed · ${stats.passed} passed · ${stats.total} total`}
</div>

<div class="filters">
  <button class="filter-btn active" onclick="filter('all', this)">All (${stats.total})</button>
  <button class="filter-btn" onclick="filter('failed', this)">Failed (${stats.failed})</button>
  <button class="filter-btn" onclick="filter('passed', this)">Passed (${stats.passed})</button>
  <button class="filter-btn" onclick="filter('skipped', this)">Skipped (${stats.skipped})</button>
</div>

<div class="suites" id="suites">
  ${suiteRows || '<div class="empty">No test results</div>'}
</div>

<script>
  function toggle(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
  }
  function toggleSuite(id) {
    const body = document.getElementById(id);
    if (body) body.classList.toggle('hidden');
  }
  function filter(status, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.suite').forEach(suite => {
      let visible = 0;
      suite.querySelectorAll('.test').forEach(t => {
        const show = status === 'all' || t.classList.contains(status);
        t.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      suite.style.display = visible > 0 ? '' : 'none';
    });
  }
  // auto-expand failed suites on load
  document.querySelectorAll('.suite-header.failed').forEach(h => {
    const id = h.nextElementSibling?.id;
    if (!id) return;
    const body = document.getElementById(id);
    if (body) body.classList.remove('hidden');
  });
  // collapse passed suites by default if there are failures
  if (${stats.failed} > 0) {
    document.querySelectorAll('.suite-header:not(.failed)').forEach(h => {
      const body = h.nextElementSibling;
      if (body) body.classList.add('hidden');
    });
  }
</script>
</body>
</html>`;

fs.mkdirSync(outputDir, { recursive: true });
const outFile = path.join(outputDir, 'index.html');
fs.writeFileSync(outFile, html);

const rel = path.relative(process.cwd(), outFile);
console.log(`\n  📊 Report: ${rel}`);
console.log(`  Open:   open ${rel}\n`);
