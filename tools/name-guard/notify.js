#!/usr/bin/env node
'use strict';
/* Send a name-guard report to the QA Discord channel (webhook only as a fallback). No DMs —
 * the owner asked for the team channel. Every value comes from the environment.
 *
 *   node notify.js report.json [--force]
 *
 * Sends nothing when the report is clean, unless --force. Alert text escapes Discord
 * markdown: content titles routinely contain _ and * and would otherwise render italic.
 *
 * Sends nothing when the findings have not CHANGED either — the scan runs every 30 minutes and
 * findings take longer than that to fix, so reposting the same list only teaches people to skip
 * the channel. See alert_dedup.js. `--force` overrides both.
 */
const fs = require('fs');
const path = require('path');
const dedup = require('./alert_dedup');
const gate = require('./alert_gate');

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

/* What was already said, from whichever source can answer.
 * The state file survives between local runs; the channel answers when there is no local state
 * (every CI run starts on a fresh machine). Neither is required — a miss just means the alert
 * goes out, which is the safe direction. */
const STATE = process.env.NAME_GUARD_STATE || (REPORT + '.alert-state.json');

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (_) { return {}; }
}
function writeState(fingerprint) {
  try {
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify({ fingerprint, at: new Date().toISOString() }, null, 2));
  } catch (e) { console.log('state not saved (' + String(e.message || e) + ') — next run may repeat the alert'); }
}

/** The most recent alert this guard posted for this environment, or null. */
async function lastChannelAlert(env) {
  if (!BOT || !CHANNEL) return null;
  try {
    const res = await fetch('https://discord.com/api/v10/channels/' + CHANNEL + '/messages?limit=25',
      { headers: { Authorization: 'Bot ' + BOT, 'User-Agent': UA } });
    if (!res.ok) return null;
    const msgs = await res.json();
    const mine = (Array.isArray(msgs) ? msgs : []).filter((m) => dedup.isOurAlert(m.content, env));
    return mine.length ? mine[0].content : null;      // Discord returns newest first
  } catch (_) { return null; }
}

(async () => {
  if (report.ok && !report.findings.length && !FORCE) { console.log('clean — no alert sent'); return; }
  const content = build(report);

  /* Seven checks on the exact outgoing string, before anything leaves. Fail-closed: a message
   * that does not match the accepted format is not sent at all. Reading the draft is not a
   * substitute — every past format defect looked right to whoever wrote it. */
  const checked = gate.verify(content);
  if (!checked.ok) {
    console.error('FORMAT GATE FAILED — nothing sent. Fix the generator, not the message:');
    for (const f of checked.failures) console.error('  · ' + f);
    console.error('--- the message that was blocked ---');
    console.error(content);
    process.exit(4);
  }

  const decision = dedup.decide({
    report,
    content,
    force: FORCE,
    lastFingerprint: readState().fingerprint,
    lastChannelContent: await lastChannelAlert(report.env),
  });
  if (!decision.send) {
    // Record it anyway: a channel-only match means the state file was missing or stale, and
    // writing it now keeps the next run from having to ask Discord again.
    writeState(decision.fingerprint);
    console.log('DUPLICATE — ' + decision.reason + ' (fingerprint ' + decision.fingerprint + ')');
    return;
  }
  // The QA team channel is the primary destination when configured; DM is the fallback so a
  // channel permission change never silences the guard.
  // The QA channel is the destination for this guard — no DMs (owner asked for channel only).
  if (BOT && CHANNEL) {
    const out = await post('https://discord.com/api/v10/channels/' + CHANNEL + '/messages',
      { content, allowed_mentions: { parse: [] } }, { Authorization: 'Bot ' + BOT });
    console.log('CHANNEL', out.status, out.text);
    if (out.status < 300) { writeState(decision.fingerprint); return; }
    console.log('channel post failed — falling back to webhook');
  }
  if (HOOK) {
    const out = await post(HOOK, { content, allowed_mentions: { parse: [] } });
    console.log('WEBHOOK', out.status, out.text);
    if (out.status < 300) { writeState(decision.fingerprint); return; }
  }
  console.error('NO DELIVERY CHANNEL — set DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID (or DISCORD_WEBHOOK)');
  console.error(content);
  process.exit(3);
})();
