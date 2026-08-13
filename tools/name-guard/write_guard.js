'use strict';
/* Write guard — the training environment is READ-ONLY, absolutely.
 *
 * WHY THIS EXISTS
 * The name-guard toolkit does not only report bad names any more, it fixes them
 * (rename / edit / unpublish / delete). Those same scripts take an environment as an
 * argument, so a single wrong `OLS_ENV=` — or a copy-pasted command — is enough to
 * rewrite content in the training environment, where REAL PEOPLE are working right now.
 * A wrong write there is not a QA artefact, it is damage to someone's live work.
 *
 * THE RULE: writes are allowed ONLY in the pre-prod environment. Everything else is
 * read-only, and the training environment is additionally denied by name and by host,
 * so removing any one check still leaves it protected.
 *
 * SEVEN INDEPENDENT LAYERS (each one alone is enough to stop a write):
 *   L1 allowlist       — only an env on WRITABLE_ENVS may ever be written to; unknown = deny
 *   L2 label denylist  — a label that looks like the training env is denied outright
 *   L3 host denylist   — the ORIGIN is checked too, so relabelling or OLS_ORIGIN= cannot slip past
 *   L4 script assert   — every mutating script calls assertWritable() before it logs in
 *   L5 network abort   — armContext() aborts every non-GET request to a protected origin,
 *                        which covers writes issued from inside page.evaluate()
 *   L6 runner refusal  — the shell wrapper refuses to spawn a mutator for a protected env
 *                        (see namecheck/run_fix.sh; nothing here can be reached to be bypassed)
 *   L7 audit + alert   — every refusal is written to a ledger and raised loudly; a block that
 *                        nobody hears about is how the next attempt gets made
 *
 * Everything fails CLOSED: a missing label, a missing origin, an unreadable rule, or an
 * unexpected error all mean "not writable".
 *
 * PUBLIC REPO: no real hostname appears here. The checks are token-shaped on purpose —
 * `preprod` and `training` are enough to tell the two apart, and neither is a secret.
 */

/** The ONLY environments that may ever be written to. Deny-by-default: adding an env here
 *  is a deliberate act, and nothing else in the toolkit can widen it. */
const WRITABLE_ENVS = ['preprod'];

/** Independent denylist. Even if someone adds a training env to the allowlist above by
 *  mistake, these still refuse it. Token-shaped so a renamed label (training70, obectraining…)
 *  is still caught. */
const PROTECTED_LABEL = /training/i;
const PROTECTED_HOST = /training/i;

/** Requests that cannot change anything. Everything else is a write. */
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

class WriteGuardError extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'WriteGuardError';
    this.detail = detail || {};
  }
}

function hostOf(origin) {
  if (!origin || typeof origin !== 'string') return '';
  try { return new URL(origin).hostname; } catch (_) { return ''; }
}

function isReadMethod(method) {
  return READ_METHODS.includes(String(method || '').toUpperCase());
}

/**
 * Decide whether an environment may be written to, and say why not.
 * Pure — no I/O, safe to unit test.
 *
 * @param {{key?:string,label?:string,origin?:string}} env
 * @returns {{writable:boolean, label:string, host:string, reasons:string[], layers:string[]}}
 */
function classifyEnv(env) {
  const e = env || {};
  const label = String(e.label || e.key || '').trim();
  const origin = String(e.origin || '').trim();
  const host = hostOf(origin);
  const reasons = [];
  const layers = [];

  // L1 — allowlist. No label, no origin, or an env nobody vouched for: deny.
  if (!label) { reasons.push('ไม่รู้ว่า env ไหน (ไม่มี label) — เขียนไม่ได้'); layers.push('L1'); }
  if (!origin || !host) { reasons.push('ไม่รู้ origin ของ env — เขียนไม่ได้'); layers.push('L1'); }
  if (label && !WRITABLE_ENVS.includes(label)) {
    reasons.push('env "' + label + '" ไม่อยู่ใน allowlist (เขียนได้เฉพาะ: ' + WRITABLE_ENVS.join(', ') + ')');
    layers.push('L1');
  }

  // L2 — label denylist, independent of the allowlist above.
  if (PROTECTED_LABEL.test(label)) {
    reasons.push('env "' + label + '" คือ training — ห้ามเขียนเด็ดขาด (มีผู้ใช้งานจริงอยู่)');
    layers.push('L2');
  }

  // L3 — host denylist. Catches a protected env reached under a different label,
  //      e.g. someone passing OLS_ORIGIN= by hand.
  if (PROTECTED_HOST.test(host)) {
    reasons.push('origin host "' + host + '" คือ training — ห้ามเขียนเด็ดขาด แม้ label จะเขียนว่าอย่างอื่น');
    layers.push('L3');
  }

  return { writable: reasons.length === 0, label, host, origin, reasons, layers: [...new Set(layers)] };
}

/**
 * L4 — the gate every mutating script calls before it logs in or touches anything.
 * Throws WriteGuardError when the environment is not writable. Never returns falsy.
 *
 * @param {object} env      the resolved environment ({key/label, origin})
 * @param {object} [opts]   { script, action, audit }  — audit(fn) is injected so the pure
 *                          module stays I/O-free; namecheck/guard_audit.js supplies the real one.
 */
function assertWritable(env, opts) {
  const o = opts || {};
  let verdict;
  try {
    verdict = classifyEnv(env);
  } catch (err) {
    // An error inside the classifier must never read as "allowed".
    verdict = { writable: false, label: '?', host: '?', reasons: ['guard error: ' + String(err && err.message || err)], layers: ['L1'] };
  }
  if (verdict.writable) return verdict;

  const detail = {
    script: o.script || 'unknown',
    action: o.action || 'write',
    label: verdict.label,
    host: verdict.host,
    layers: verdict.layers,
    reasons: verdict.reasons,
    at: o.now || new Date().toISOString(),
  };
  // L7 — a refusal is an event, not a silence.
  if (typeof o.audit === 'function') { try { o.audit(detail); } catch (_) { /* auditing must never unblock */ } }

  throw new WriteGuardError(
    'BLOCKED: ห้ามเขียนลง env นี้ — ' + verdict.reasons.join(' · '),
    detail
  );
}

/**
 * L5 — network-level backstop for Playwright.
 * Aborts every non-GET request to a protected origin, so a write issued from inside
 * page.evaluate() (which no Node-side check can see) still cannot leave the browser.
 * Applied to EVERY context, including read-only runs: on a writable env it is a no-op for
 * reads and only bites if the env turns out to be protected.
 *
 * @param {import('playwright').BrowserContext} ctx
 * @param {object} env
 * @param {object} [opts] { audit, script }
 * @returns {Promise<{armed:boolean, protectedEnv:boolean}>}
 */
async function armContext(ctx, env, opts) {
  const o = opts || {};
  const verdict = classifyEnv(env);
  const protectedEnv = !verdict.writable;

  await ctx.route('**/*', (route) => {
    const req = route.request();
    const method = req.method();
    if (isReadMethod(method)) return route.continue();

    const host = hostOf(req.url());
    const hostProtected = PROTECTED_HOST.test(host);
    // Block when the request itself targets a protected host, or when this whole run was
    // classified as read-only. Requests to unrelated third parties are left alone.
    if (!hostProtected && !protectedEnv) return route.continue();
    if (!hostProtected && protectedEnv && !host) return route.continue();

    const detail = {
      script: o.script || 'unknown',
      action: 'network-' + method,
      url: req.url().slice(0, 200),
      host,
      layers: ['L5'],
      reasons: [hostProtected
        ? 'ยิง ' + method + ' ไปที่ host training — ตัดที่ชั้น network'
        : 'env นี้เป็น read-only — ' + method + ' ถูกตัดที่ชั้น network'],
      at: new Date().toISOString(),
    };
    if (typeof o.audit === 'function') { try { o.audit(detail); } catch (_) {} }
    console.error('WRITE-GUARD L5 BLOCKED ' + method + ' ' + detail.url);
    return route.abort('blockedbyclient');
  });

  return { armed: true, protectedEnv };
}

/**
 * Is this environment hands-off entirely — not merely unwritable, but not to be touched at all?
 *
 * Writes were never the whole risk. A read still logs in as somebody, still consumes a real
 * session, and still ends with an alert about other people's live work. The owner's instruction
 * is broader than the write guard: training is not scanned, not probed, not alerted on. This is
 * the one predicate every read-only tool asks before it starts, so "hands-off" has a single
 * definition instead of one per script.
 *
 * @param {{key?:string,label?:string,origin?:string}} env
 * @returns {{protected:boolean, label:string, host:string, reasons:string[]}}
 */
function isProtectedEnv(env) {
  const e = env || {};
  const label = String(e.label || e.key || '').trim();
  const host = hostOf(String(e.origin || '').trim());
  const reasons = [];
  if (PROTECTED_LABEL.test(label)) reasons.push('env "' + label + '" คือ training — ห้ามแตะ (สแกน/โพรบ/แจ้งเตือน) เพราะมีผู้ใช้งานจริง');
  if (PROTECTED_HOST.test(host)) reasons.push('origin host "' + host + '" คือ training — ห้ามแตะ แม้ label จะเขียนว่าอย่างอื่น');
  return { protected: reasons.length > 0, label, host, reasons };
}

module.exports = {
  WRITABLE_ENVS,
  PROTECTED_LABEL,
  PROTECTED_HOST,
  READ_METHODS,
  WriteGuardError,
  classifyEnv,
  isProtectedEnv,
  assertWritable,
  armContext,
  isReadMethod,
  hostOf,
};
