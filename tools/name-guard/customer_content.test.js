'use strict';
/* The ten layers that keep HI's `[RGS]` fixtures untouched — pinned, so none of them can quietly
 * stop working.
 *
 * WHY EACH LAYER IS TESTED SEPARATELY
 * Any one of these on its own is enough to prevent the 2026-08-25 incident, in which the guard's
 * own alert asked, in the QA channel, for 24 of the customer's rows to be renamed or deleted.
 * Testing only the end result would let nine of them rot unnoticed behind the tenth. Several
 * assertions read the source text of a file rather than calling it: a check that has been moved
 * below the thing it protects still passes a behavioural test on the day it is moved.
 *
 *   run: node customer_content.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const customer = require('./customer_content');
const guard = require('./write_guard');
const { build } = require('./alert_format');
const { verify } = require('./alert_gate');

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed++; console.log('FAIL  ' + name + ' — ' + e.message); }
};
const src = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

/* The titles below are copied verbatim out of the 2026-08-25 pre-prod scan. Invented examples
 * would pin an invented rule; these pin the one that actually escaped. */
const REAL_CUSTOMER_TITLES = [
  '[RGS] - ทดสอบ live',
  '[Beer][RGS] - ทดสอบ liveทดสอบ liveทดสอบ live',
  '[RGS] ฟังเพลง',
  '[RGS] Hedgehog is so cuuuute',
  'RGS - ความรู้เรื่องสัตว์เลี้ยง',
  'RGS - บทความทดสอบ',
  '[BT] RGS - สร้างคอร์สเรียน 003',
  '[RGS][Beer]-ทดสอบวิดีโอ youtube',
  'RGS - ทดสอบไฟล์เอกสาร [Edited][lastest ++]',
];

/* Real titles from the same scan that are OURS to fix. If the matcher ever widens, these are
 * what it starts swallowing — and a finding we silently stop reporting is worse than one we
 * report twice. */
const REAL_OURS = [
  'SKL ช้าง',
  'ทะเลมหัศจรรย์',
  'เทคนิคนำเสนอแบบมืออาชีพ: พูดอย่างไรให้คนฟังจำได้',
  'พื้นฐานกายวิภาคศาสตร์สำหรับผู้สนใจสายสุขภาพ',
  'การจัดการองค์กรและ orgs สมัยใหม่',   // contains the letters, is not the marker
  'Forgs and frogs: a spelling lesson',
];

// ── L1 — one definition of "the customer's", in one file ────────────────────────────────
check('L1 · every real customer title is recognised', () => {
  for (const t of REAL_CUSTOMER_TITLES) {
    assert.ok(customer.isCustomerOwned(t), 'missed: ' + t);
  }
});

check('L1 · our own titles are never claimed as the customer\'s', () => {
  for (const t of REAL_OURS) {
    assert.ok(!customer.isCustomerOwned(t), 'false positive: ' + t);
  }
});

check('L1 · the marker is a token, not a substring', () => {
  assert.ok(!customer.isCustomerOwned('orgs'), 'orgs must not match');
  assert.ok(!customer.isCustomerOwned('BORGS'), 'BORGS must not match');
  assert.ok(customer.isCustomerOwned('rgs - บทเรียน'), 'lowercase standalone must match');
  assert.ok(customer.isCustomerOwned('(RGS)'), 'punctuation-flanked must match');
});

/* Both of these were live holes on 2026-08-25, found by attacking the guard rather than by
 * testing it. A title that a human reads as `[RGS]` while the guard reads as clean is the
 * worst of both worlds, so the comparison is done on normalised text. */
check('L1 · a zero-width space inside the marker does not hide it', () => {
  assert.ok(customer.isCustomerOwned('[R\u200bGS] - ทดสอบ live'), 'zero-width space evaded the marker');
  assert.ok(customer.isCustomerOwned('R\ufeffGS - บทความ'), 'BOM evaded the marker');
});

check('L1 · fullwidth letters do not hide it either', () => {
  assert.ok(customer.isCustomerOwned('[ＲＧＳ] - ทดสอบ'), 'fullwidth ＲＧＳ evaded the marker');
});

check('L1 · normalising never invents a marker that was not there', () => {
  for (const t of REAL_OURS) {
    assert.ok(!customer.isCustomerOwned(customer.normalise(t)), 'normalising created a false positive: ' + t);
  }
});

check('L1 · a description carries ownership even when the title is clean', () => {
  assert.ok(customer.itemIsCustomerOwned({ title: 'ฟังเพลงคลายเครียด', description: '[RGS] fixture' }));
});

// ── L2 — the scanner takes them out of `findings` entirely ──────────────────────────────
check('L2 · partitionFindings separates them, losing nothing', () => {
  const findings = [
    { id: 'a', title: '[RGS] - ทดสอบ live', hits: [] },
    { id: 'b', title: 'ทะเลมหัศจรรย์', hits: [] },
    { id: 'c', title: 'สื่อของเรา', hits: [{ value: '[RGS] ในคำอธิบาย' }] },
  ];
  const { mine, customer: theirs } = customer.partitionFindings(findings);
  assert.deepStrictEqual(mine.map((f) => f.id), ['b']);
  assert.deepStrictEqual(theirs.map((f) => f.id), ['a', 'c']);
  assert.strictEqual(mine.length + theirs.length, findings.length, 'nothing may vanish');
});

check('L2 · scan.js partitions BEFORE it counts actionable work', () => {
  const s = src('scan.js');
  assert.ok(/require\('\.\/customer_content'\)/.test(s), 'scan.js must import the classifier');
  const cut = s.indexOf('partitionFindings');
  const count = s.indexOf('report.actionable =');
  assert.ok(cut > -1, 'scan.js must partition the findings');
  assert.ok(count > -1 && cut < count,
    'the split must happen before actionable is computed, or the customer rows are counted as our work');
});

// ── L3 — the alert builder filters again, on its own ────────────────────────────────────
const customerHeavy = {
  env: 'preprod', ok: true, sources: { media: { count: 40 } },
  findings: REAL_CUSTOMER_TITLES.map((t, i) => ({
    id: 'x' + i, source: 'media', type: 'ARTICLE', title: t,
    hits: [{ field: 'title', rule: 'test-trace', why: 'ทดสอบ' }],
  })),
};

check('L3 · a report full of customer rows produces no fix list at all', () => {
  const m = build(customerHeavy);
  assert.ok(!/Needs fix/.test(m), 'must not ask anyone to fix the customer\'s content:\n' + m);
  assert.ok(/\*\*Status:\*\* Clean/.test(m), 'with nothing of ours left, the round is clean:\n' + m);
});

check('L3 · no Solution bullet ever names the marker', () => {
  const mixed = {
    env: 'preprod', ok: true, sources: { media: { count: 40 } },
    findings: customerHeavy.findings.concat([
      { id: 'ours', source: 'media', type: 'ARTICLE', title: 'บทความทดสอบระบบเสียง',
        hits: [{ field: 'title', rule: 'test-trace', why: 'ทดสอบ' }] },
    ]),
  };
  const m = build(mixed);
  // Same scoping as notify.js: the Solution block ends at the next `> **Label:**` line.
  // Prevention and FYI name the marker on purpose — only the fix list must be clean.
  const solution = [];
  let inSolution = false;
  for (const ln of m.split('\n')) {
    if (/^> \*\*Solution:\*\*/.test(ln)) { inSolution = true; continue; }
    if (/^> \*\*[A-Za-z ]+:\*\*/.test(ln)) { inSolution = false; continue; }
    if (inSolution && /^> • /.test(ln)) solution.push(ln);
  }
  assert.ok(solution.length, 'expected a fix list for our own row');
  for (const line of solution) {
    assert.ok(!customer.isCustomerOwned(line), 'customer content reached the fix list: ' + line);
  }
  assert.ok(/บทความทดสอบระบบเสียง/.test(m), 'our own finding must still be reported');
});

// ── L4 — the remark rides on every message, forever ─────────────────────────────────────
check('L4 · the remark appears on a needs-fix round', () => {
  const m = build({ env: 'preprod', ok: true, sources: { media: { count: 2 } },
    findings: [{ id: 'o', source: 'media', type: 'ARTICLE', title: 'บทความทดสอบระบบเสียง',
      hits: [{ field: 'title', rule: 'test-trace', why: 'ทดสอบ' }] }] });
  assert.ok(m.includes(customer.CUSTOMER_REMARK), 'missing on needs-fix:\n' + m);
});

check('L4 · the remark appears on a clean round too', () => {
  const m = build({ env: 'preprod', ok: true, sources: { media: { count: 2 } }, findings: [] });
  assert.ok(m.includes(customer.CUSTOMER_REMARK), 'missing on clean:\n' + m);
});

check('L4 · the remark appears even when the scan failed', () => {
  const m = build({ env: 'preprod', ok: false, error: 'VPN down', findings: [] });
  assert.ok(m.includes(customer.CUSTOMER_REMARK), 'missing on failed:\n' + m);
});

check('L4 · the remark says both what is skipped and whose it is', () => {
  assert.ok(/RGS/.test(customer.CUSTOMER_REMARK), 'must name the marker');
  assert.ok(/HI/.test(customer.CUSTOMER_REMARK), 'must name the owner');
});

check('L4 · every message still passes the seven format checks', () => {
  for (const rep of [customerHeavy,
    { env: 'preprod', ok: true, sources: {}, findings: [] },
    { env: 'preprod', ok: false, error: 'VPN down', findings: [] }]) {
    const res = verify(build(rep));
    assert.ok(res.ok, 'format gate failed: ' + JSON.stringify(res.failures));
  }
});

// ── L5 / L6 — the notifier refuses to post either mistake ───────────────────────────────
check('L5 · notify.js refuses a message whose fix list names the customer', () => {
  const s = src('notify.js');
  assert.ok(/customerContentReason/.test(s), 'notify.js must carry the customer check');
  assert.ok(/process\.exit\(6\)/.test(s), 'the refusal must exit non-zero');
  const fn = s.slice(s.indexOf('function customerContentReason'), s.indexOf('(async () =>'));
  assert.ok(/customerMarkerOf/.test(fn), 'it must use the shared classifier, not its own regex');
  assert.ok(!/FORCE/.test(fn), '--force must not be able to override a boundary');
});

check('L6 · notify.js refuses a message with no remark', () => {
  const s = src('notify.js');
  assert.ok(/CUSTOMER_REMARK/.test(s), 'notify.js must assert the remark is present');
});

check('L5 · the gate is an allowlist, so a renamed field cannot make it pass vacuously', () => {
  const src2 = src('notify.js');
  const fn = src2.slice(src2.indexOf('function customerContentReason'), src2.indexOf('(async () =>'));
  const reason = new Function('customer', 'return ' + fn.replace('function customerContentReason', 'function'))(customer);

  // The Solution label is not `Solution` any more — a translation, a format tweak, anything.
  const drifted = '**x**\n> **แนวทางแก้ไข:**\n> • เปลี่ยนชื่อ `[RGS] - ทดสอบ live`\n> **FYI:** ' + customer.CUSTOMER_REMARK;
  assert.ok(reason(drifted), 'a fix list under an unrecognised label must still refuse');

  // A real, correct message must still go out — the two sanctioned mentions are allowed.
  const good = build({ env: 'preprod', ok: true, sources: { media: { count: 2 } },
    findings: [{ id: 'o', source: 'media', type: 'ARTICLE', title: 'บทความทดสอบระบบเสียง',
      hits: [{ field: 'title', rule: 'test-trace', why: 'ทดสอบ' }] }] });
  assert.strictEqual(reason(good), null, 'a correct message must not be blocked: ' + good);
  assert.ok(reason('**x** no remark here'), 'a message with no remark must refuse');
});

check('L5 · the sanctioned sentences have ONE definition, shared by both files', () => {
  assert.ok(/customer\.CUSTOMER_PREVENTION/.test(src('alert_format.js')),
    'the alert must emit the shared sentence, not its own copy');
  assert.ok(/CUSTOMER_PREVENTION/.test(src('notify.js')),
    'the notifier must recognise the same shared sentence');
});

// ── L7 — the write guard refuses the item itself ────────────────────────────────────────
check('L7 · assertNotCustomerContent throws on every real customer title', () => {
  for (const t of REAL_CUSTOMER_TITLES) {
    assert.throws(() => guard.assertNotCustomerContent(t, { script: 'test' }),
      /REFUSED/, 'did not refuse: ' + t);
  }
});

check('L7 · it lets our own content through', () => {
  for (const t of REAL_OURS) {
    assert.strictEqual(guard.assertNotCustomerContent(t, { script: 'test' }), true, 'blocked ours: ' + t);
  }
});

check('L7 · it fails closed on anything it cannot read', () => {
  for (const bad of [null, undefined, 42, {}, { title: '   ' }]) {
    assert.throws(() => guard.assertNotCustomerContent(bad, { script: 'test' }), /REFUSED/,
      'unreadable subject must refuse, not pass: ' + JSON.stringify(bad));
  }
});

check('L7 · it does not depend on the environment guard', () => {
  const s = src('write_guard.js');
  const fn = s.slice(s.indexOf('function assertNotCustomerContent'), s.indexOf('function armContext'));
  assert.ok(!/WRITES_DISABLED|WRITABLE_ENVS|classifyEnv/.test(fn),
    'the customer check must stand alone — re-enabling writes must not re-enable this');
});

check('L7 · a refusal is audited, never silent', () => {
  const seen = [];
  assert.throws(() => guard.assertNotCustomerContent('[RGS] - ทดสอบ live',
    { script: 'fix_names.js', audit: (d) => seen.push(d) }), /REFUSED/);
  assert.strictEqual(seen.length, 1, 'the refusal must reach the ledger');
  assert.ok(seen[0].layers.includes('C1'), 'the audit row must say which layer refused');
});

// ── L8 — the network backstop ───────────────────────────────────────────────────────────
check('L8 · a non-GET whose body names the customer is aborted', async () => {
  const routed = [];
  const ctx = { route: (_pat, handler) => { ctx._h = handler; } };
  const p = guard.armContext(ctx, { label: 'preprod', origin: 'https://example.invalid' },
    { script: 'test', audit: (d) => routed.push(d) });
  const mk = (method, url, body) => ({
    request: () => ({ method: () => method, url: () => url, postData: () => body }),
    continue: () => routed.push({ verdict: 'continue' }),
    abort: () => routed.push({ verdict: 'abort' }),
  });
  return p.then(() => {
    const r = mk('PUT', 'https://example.invalid/api/media/1', JSON.stringify({ title: '[RGS] - ทดสอบ live' }));
    ctx._h(r);
    assert.ok(routed.some((x) => x.verdict === 'abort'), 'the write must be aborted at the network layer');
    assert.ok(routed.some((x) => (x.layers || []).includes('C2')), 'and audited as the customer layer');
  });
});

check('L8 · a plain read is never aborted by this layer', () => {
  const s = src('write_guard.js');
  const fn = s.slice(s.indexOf('async function armContext'));
  const readGuard = fn.indexOf('isReadMethod(method)');
  const customerCheck = fn.indexOf('customerContent.isCustomerOwned');
  assert.ok(readGuard > -1 && customerCheck > readGuard,
    'GET/HEAD must be released before the customer check, or every read is blocked too');
});

// ── L9 — the shell runner refuses before node starts ────────────────────────────────────
check('L9 · the mutator wrapper refuses customer content, off-repo', () => {
  const wrapper = path.join(require('os').homedir(), 'ols-qa-testing-bot', 'namecheck', 'run_fix.sh');
  if (!fs.existsSync(wrapper)) {
    console.log('      (skipped — the off-repo toolkit is not on this machine)');
    return;
  }
  const s = fs.readFileSync(wrapper, 'utf8');
  assert.ok(/CUSTOMER_MARKER/.test(s), 'run_fix.sh must carry the marker refusal');
  assert.ok(/exit 4/.test(s), 'and refuse with a distinct non-zero status');
  const marker = s.indexOf('CUSTOMER_MARKER');
  const kill = s.indexOf('WRITES_DISABLED=1');
  assert.ok(marker < kill,
    'the customer refusal must sit ahead of the write kill-switch, so it survives writes being re-enabled');
});

check('L9 · the shim every mutator imports carries the per-item gate too', () => {
  const shim = path.join(require('os').homedir(), 'ols-qa-testing-bot', 'namecheck', 'guard.js');
  if (!fs.existsSync(shim)) {
    console.log('      (skipped — the off-repo toolkit is not on this machine)');
    return;
  }
  const s = fs.readFileSync(shim, 'utf8');
  assert.ok(/assertNotCustomerContent/.test(s),
    'the ten mutators reach the guard through this one shim — the gate must be available there');
  // The stub used when the rules file cannot be loaded must refuse too, not quietly pass.
  const stub = s.slice(s.indexOf('} catch (e) {'), s.indexOf('/** Gate a mutating script'));
  assert.ok(/assertNotCustomerContent/.test(stub),
    'a guard that cannot load must refuse, never read as allowed');
});

// ── L10 — this file is itself the tenth layer; keep it honest ───────────────────────────
check('L10 · the marker list is non-empty and every entry names an owner', () => {
  assert.ok(customer.CUSTOMER_MARKERS.length > 0, 'an empty list protects nothing');
  for (const m of customer.CUSTOMER_MARKERS) {
    assert.ok(m.token && m.owner && m.why, 'each marker must say what it is and whose: ' + JSON.stringify(m));
  }
});

setTimeout(() => {
  console.log();
  if (failed) { console.log(failed + ' failing'); process.exit(1); }
  console.log('all green');
}, 50);
