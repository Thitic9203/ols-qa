'use strict';
/* Say the same thing once.
 *
 * The scan runs every 30 minutes. Findings take longer than 30 minutes to fix, so the old
 * notifier posted the identical alert on every run — the same 34 items arrived three times in
 * the QA channel and the reader has to diff two screens to see there is nothing new. A repeated
 * alert is worse than no alert: it trains people to scroll past the channel.
 *
 * Rule: post when the FINDINGS CHANGE, not when the scan runs. Same set → stay quiet.
 *
 * Two independent ways to know what was already said, because each covers a gap in the other:
 *   - fingerprint + state file  — works with a webhook-only setup, and when the channel is
 *                                 unreadable. Local runs (launchd) keep the file between runs.
 *   - last message in the channel — works with no local state at all, which is the CI case
 *                                 where every run starts on a fresh machine.
 * Either one saying "already said" is enough to stay quiet.
 *
 * `--force` always sends: a human asking for the current state is not a duplicate.
 */
const crypto = require('crypto');

/** Everything the alert is ABOUT, with nothing that drifts on its own.
 *  Catalogue counts move as content is added, so they must not make an unchanged set look new. */
function fingerprint(report) {
  const r = report || {};
  if (!r.ok) return 'err:' + sha(String(r.env) + '|' + String(r.error || 'unknown'));
  const keys = [];
  for (const f of r.findings || []) {
    for (const h of f.hits || []) keys.push(f.id + '|' + h.rule + '|' + (h.field || ''));
  }
  keys.sort();
  return 'ok:' + sha(String(r.env) + '|' + keys.join(','));
}

function sha(s) { return crypto.createHash('sha1').update(s, 'utf8').digest('hex').slice(0, 16); }

/** The Scope line carries live catalogue counts; it is context, not the finding. Two alerts that
 *  differ only there are the same alert. */
function stripVolatile(content) {
  return String(content || '')
    .split('\n')
    .filter((l) => !/^>\s*\*\*Scope:\*\*/.test(l))
    .join('\n')
    .trim();
}

/** Does this channel message look like a previous alert from this guard, for this environment? */
function isOurAlert(content, env) {
  const c = String(content || '');
  const tag = '[Content Naming][' + String(env) + ']';
  return c.includes(tag) && (c.startsWith('**Inappropriate content:**') || c.startsWith('**Name guard:**'));
}

/**
 * @param {object} a  { report, content, force, lastFingerprint, lastChannelContent }
 * @returns {{send:boolean, reason:string, fingerprint:string}}
 */
function decide(a) {
  const fp = fingerprint(a.report);
  if (a.force) return { send: true, reason: 'forced', fingerprint: fp };
  if (a.lastFingerprint && a.lastFingerprint === fp) {
    return { send: false, reason: 'ผลเหมือนรอบก่อน (fingerprint ตรงกัน) — ไม่โพสต์ซ้ำ', fingerprint: fp };
  }
  if (a.lastChannelContent && stripVolatile(a.lastChannelContent) === stripVolatile(a.content)) {
    return { send: false, reason: 'ข้อความเดิมยังอยู่ในห้องแล้ว — ไม่โพสต์ซ้ำ', fingerprint: fp };
  }
  return { send: true, reason: 'ผลเปลี่ยนจากรอบก่อน', fingerprint: fp };
}

module.exports = { fingerprint, stripVolatile, isOurAlert, decide };
