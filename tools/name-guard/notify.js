#!/usr/bin/env node
'use strict';
/* Send a name-guard report to the QA Discord channel (webhook only as a fallback). No DMs —
 * the owner asked for the team channel. Every value comes from the environment.
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
const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));

const trim = (v) => (v == null ? v : String(v).trim());
const BOT = trim(process.env.DISCORD_BOT_TOKEN);
const CHANNEL = trim(process.env.DISCORD_CHANNEL_ID);   // team channel takes priority over DM
const HOOK = trim(process.env.DISCORD_WEBHOOK);
const UA = 'ols-name-guard (+https://github.com/Thitic9203/ols-qa)';

const { build, esc } = require('./alert_format');

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
  if (report.ok && !report.findings.length && !FORCE) { console.log('clean — no alert sent'); return; }
  const content = build(report);
  // The QA team channel is the primary destination when configured; DM is the fallback so a
  // channel permission change never silences the guard.
  // The QA channel is the destination for this guard — no DMs (owner asked for channel only).
  if (BOT && CHANNEL) {
    const out = await post('https://discord.com/api/v10/channels/' + CHANNEL + '/messages',
      { content, allowed_mentions: { parse: [] } }, { Authorization: 'Bot ' + BOT });
    console.log('CHANNEL', out.status, out.text);
    if (out.status < 300) return;
    console.log('channel post failed — falling back to webhook');
  }
  if (HOOK) {
    const out = await post(HOOK, { content, allowed_mentions: { parse: [] } });
    console.log('WEBHOOK', out.status, out.text);
    if (out.status < 300) return;
  }
  console.error('NO DELIVERY CHANNEL — set DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID (or DISCORD_WEBHOOK)');
  console.error(content);
  process.exit(3);
})();
