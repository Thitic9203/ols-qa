#!/usr/bin/env node
'use strict';
/* Send a name-guard report to Discord. DM to the owner when a bot token + user id are
 * available (the SFD channel), otherwise a webhook. Every value comes from the environment.
 *
 *   node notify.js report.json [--force]
 *
 * Sends nothing when the report is clean, unless --force. Alert text escapes Discord
 * markdown: content titles routinely contain _ and * and would otherwise render italic.
 */
const fs = require('fs');

const REPORT = process.argv[2];
const FORCE = process.argv.includes('--force');
if (!REPORT) { console.error('usage: node notify.js report.json [--force]'); process.exit(2); }
const r = JSON.parse(fs.readFileSync(REPORT, 'utf8'));

const trim = (v) => (v == null ? v : String(v).trim());
const BOT = trim(process.env.DISCORD_BOT_TOKEN);
const USER = trim(process.env.DISCORD_USER_ID);
const HOOK = trim(process.env.DISCORD_WEBHOOK);
const UA = 'ols-name-guard (+https://github.com/Thitic9203/ols-qa)';

/** Discord renders _italic_, *bold*, ~~strike~~, `code`, ||spoiler|| inside plain text. */
function esc(s) {
  return String(s == null ? '' : s).replace(/([\\`*_~|>])/g, '\\$1');
}

function build() {
  if (!r.ok) {
    return '🛑 **OLS name guard — สแกนไม่สำเร็จ** (`' + esc(r.env) + '`)\n'
      + 'เหตุผล: ' + esc(r.error) + '\n'
      + 'สแกนไม่ผ่าน = ยังไม่รู้ว่ามีชื่อผิดกฎหรือไม่ ต้องเข้าไปดู';
  }
  if (!r.findings.length) {
    return '✅ **OLS name guard — ผ่าน** (`' + esc(r.env) + '`) · ตรวจ '
      + Object.entries(r.sources).map(([k, v]) => k + ' ' + v.count).join(' · ')
      + ' · ไม่พบชื่อผิดกฎ';
  }
  const hard = r.findings.filter((f) => f.hits.some((h) => h.rule !== 'duplicate-name'));
  const dupItems = r.findings.filter((f) => !hard.includes(f));
  const lines = hard.slice(0, 12).map((f) => '• [' + esc(f.source) + '] `' + esc(f.title) + '` — '
    + esc(f.hits.filter((h) => h.rule !== 'duplicate-name').map((h) => h.why).join(' / ')));
  if (hard.length > 12) lines.push('• …อีก ' + (hard.length - 12) + ' รายการ');
  // When only duplicates remain, name the duplicated titles — a bare count is not actionable.
  if (!hard.length) {
    const titles = [...new Set(dupItems.map((f) => f.title))];
    lines.push(...titles.slice(0, 10).map((t) => '• ชื่อซ้ำ: `' + esc(t) + '`'));
    if (titles.length > 10) lines.push('• …อีก ' + (titles.length - 10) + ' ชื่อ');
  }
  const head = hard.length ? '🔔 **OLS name guard — เจอชื่อไม่เหมาะสม**' : '🟡 **OLS name guard — เจอชื่อซ้ำ**';
  return head + ' (`' + esc(r.env) + '`)\n'
    + '**' + hard.length + ' รายการผิดกฎ' + (dupItems.length ? ' · ' + dupItems.length + ' รายการชื่อซ้ำ' : '') + '**\n'
    + (lines.join('\n') || '—');
}

async function post(url, body, headers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json', 'User-Agent': UA }, headers || {}),
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => '');
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  // keep the parsed body separate from the truncated log text — truncating first would
  // break every caller that needs a field out of the response
  return { status: res.status, json, text: text.slice(0, 200) };
}

(async () => {
  if (r.ok && !r.findings.length && !FORCE) { console.log('clean — no alert sent'); return; }
  const content = build();
  if (BOT && USER) {
    const ch = await post('https://discord.com/api/v10/users/@me/channels', { recipient_id: USER },
      { Authorization: 'Bot ' + BOT });
    const id = ch.json && ch.json.id;
    if (id) {
      const out = await post('https://discord.com/api/v10/channels/' + id + '/messages', { content },
        { Authorization: 'Bot ' + BOT });
      console.log('DM', out.status, out.text);
      if (out.status < 300) return;
    }
    console.log('DM failed (create-dm http ' + ch.status + ' ' + ch.text + ') — falling back to webhook');
  }
  if (HOOK) {
    const out = await post(HOOK, { content, allowed_mentions: { parse: [] } });
    console.log('WEBHOOK', out.status, out.text);
    if (out.status < 300) return;
  }
  console.error('NO DELIVERY CHANNEL — set DISCORD_BOT_TOKEN+DISCORD_USER_ID or DISCORD_WEBHOOK');
  console.error(content);
  process.exit(3);
})();
