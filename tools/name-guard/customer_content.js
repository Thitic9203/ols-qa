'use strict';
/* Customer-owned content — recognised, reported, and NEVER touched.
 *
 * WHY THIS EXISTS
 * The pre-prod catalogue is shared. Some of the content on it is not ours: HI (the customer's
 * QA) keep their own test fixtures there, marked `[RGS]` in the title. On 2026-08-25 the
 * 11:00 scan reported 68 findings and asked, in the QA channel, for 40 renames — 24 of those
 * rows were HI's `[RGS]` fixtures. Nothing in the toolkit knew the difference: the scanner
 * flagged them, the alert put them on a fix list, and the standing "Needs fix = คิวงาน" rule
 * points the next agent straight at that list. Renaming or deleting another team's fixtures
 * mid-test destroys their run, and it is not recoverable by us.
 *
 * THE RULE (owner, 2026-08-25): ถ้ามี RGS ไม่ต้องยุ่งเด็ดขาด เพราะเป็นของลูกค้า.
 * Not "deprioritise", not "ask first" — never touch, in any flow, forever.
 *
 * WHAT THIS MODULE IS
 * The single place that decides what "customer-owned" means. The scanner, the alert builder,
 * the notifier, the write guard and the shell runner all import from here, so the definition
 * cannot drift into four slightly different regexes.
 *
 * TWO DIRECTIONS, DELIBERATELY DIFFERENT
 *   · reporting  — isCustomerOwned() answers only on a real marker match. An item we cannot
 *     read is NOT silently reclassified as the customer's; that would hide our own defects.
 *   · writing    — assertNotCustomerContent() fails closed: a marker match OR an unreadable
 *     input both refuse. When in doubt, do not write.
 *
 * PUBLIC REPO: `RGS` is a fixture prefix the customer types into titles themselves, not a
 * credential, a host, or an internal id. Nothing secret appears here.
 */

/** Fixture prefixes that mark content belonging to the customer's own QA.
 *  Extend by adding one entry — every layer picks it up, because every layer reads this list. */
const CUSTOMER_MARKERS = [
  { token: 'RGS', owner: 'HI', why: 'ข้อมูลทดสอบของ HI' },
];

/* Token-shaped on purpose. `[RGS]`, `[Beer][RGS]`, `RGS - …` and `[BT] RGS - …` all match;
 * an English word that merely contains the letters (orgs, forgs) does not, because the token
 * must not be flanked by another letter. */
function markerRe(token) {
  return new RegExp('(?<![A-Za-z])' + token + '(?![A-Za-z])', 'i');
}

/* Compare on normalised text, never on the raw bytes.
 *
 * A plain regex over the raw string is defeated by things that look identical on screen:
 * `[ＲＧＳ]` in fullwidth letters, or a zero-width space wedged between the R and the GS.
 * Neither is exotic — a title pasted out of a spreadsheet or a chat client can carry either
 * by accident, and a marker that a human reads as `[RGS]` while the guard reads as clean is
 * the worst of both worlds. NFKC folds the width variants together; the strip removes the
 * invisible characters. Neither step can invent a marker that was not there: no combination
 * of them turns `orgs` into the token. */
const INVISIBLE = /[\u00AD\u200B-\u200F\u2060\u2066-\u2069\uFEFF]/g;
function normalise(text) {
  return String(text).normalize('NFKC').replace(INVISIBLE, '');
}

/** The marker that claims this text, or null. Reporting-side: a real match only. */
function customerMarkerOf(text) {
  if (typeof text !== 'string') return null;
  const t = normalise(text);
  for (const m of CUSTOMER_MARKERS) if (markerRe(m.token).test(t)) return m;
  return null;
}

/** True when this text carries a customer marker. */
function isCustomerOwned(text) {
  return customerMarkerOf(text) !== null;
}

/** True when any field of a content item / finding claims customer ownership.
 *  Title and description both count — a clean title over an `[RGS]` description is still theirs. */
function itemIsCustomerOwned(item) {
  if (!item || typeof item !== 'object') return false;
  const fields = [item.title, item.name, item.description];
  for (const h of Array.isArray(item.hits) ? item.hits : []) fields.push(h && h.value);
  return fields.some((f) => isCustomerOwned(f));
}

class CustomerContentError extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'CustomerContentError';
    this.detail = detail || {};
  }
}

/** Write-side gate. Throws on a marker match AND on anything it cannot read — fail closed.
 *  Independent of the environment write guard on purpose: if writes are ever re-enabled for
 *  some environment, customer content stays refused by this, on its own. */
function assertNotCustomerContent(subject, context) {
  const where = context || {};
  const texts = [];
  if (typeof subject === 'string') texts.push(subject);
  else if (subject && typeof subject === 'object') {
    for (const k of ['title', 'name', 'description']) if (subject[k] != null) texts.push(String(subject[k]));
  } else {
    throw new CustomerContentError(
      'REFUSED — ตรวจไม่ได้ว่าเป็นของลูกค้าหรือไม่ จึงไม่เขียน (fail closed)',
      Object.assign({ reason: 'unreadable-subject' }, where));
  }
  if (!texts.length || texts.every((t) => !t.trim())) {
    throw new CustomerContentError(
      'REFUSED — ไม่มีชื่อให้ตรวจ จึงไม่เขียน (fail closed)',
      Object.assign({ reason: 'no-text' }, where));
  }
  for (const t of texts) {
    const m = customerMarkerOf(t);
    if (m) {
      throw new CustomerContentError(
        'REFUSED — เนื้อหานี้เป็นของลูกค้า (' + m.token + ' = ' + m.why + ') ห้ามแก้/ลบ/เปลี่ยนชื่อเด็ดขาด',
        Object.assign({ reason: 'customer-owned', marker: m.token, owner: m.owner, text: t.slice(0, 80) }, where));
    }
  }
  return true;
}

/** Split findings into ours and the customer's. Order is preserved in both lists. */
function partitionFindings(findings) {
  const mine = [];
  const customer = [];
  for (const f of Array.isArray(findings) ? findings : []) {
    (itemIsCustomerOwned(f) ? customer : mine).push(f);
  }
  return { mine, customer };
}

/* The line that must appear in EVERY alert, forever (owner, 2026-08-25: "เพิ่มเสมอตลอดไป").
 * It is unconditional — printed on a clean round too — because its job is to tell the reader
 * that customer fixtures are outside the scan's remit at all times, not to describe one round. */
const CUSTOMER_REMARK =
  'ไม่ได้แก้รายการที่มี RGS เพราะเป็นข้อมูลทดสอบของ HI — ไม่แตะ ไม่เปลี่ยนชื่อ ไม่ลบ ไม่นับเป็นงานค้างของเรา';

/* The Prevention bullet that states the standing rule. Lives here, not in the alert builder,
 * because the notifier has to recognise it as sanctioned text — two copies of one sentence in
 * two files is how the notifier ends up refusing the very message it is meant to allow. */
const CUSTOMER_PREVENTION =
  'เนื้อหาของลูกค้าไม่แตะทุกกรณี — รายการที่มี RGS เป็นข้อมูลทดสอบของ HI ไม่เปลี่ยนชื่อ ไม่ลบ ไม่ขึ้นเป็นงานให้แก้';

/** The remark, with this round's count appended when there is one to report. */
function customerRemark(count) {
  const n = Number(count);
  return Number.isFinite(n) && n > 0
    ? CUSTOMER_REMARK + ' (รอบนี้ข้ามไป ' + n + ' รายการ)'
    : CUSTOMER_REMARK;
}

module.exports = {
  CUSTOMER_MARKERS,
  CUSTOMER_PREVENTION,
  CUSTOMER_REMARK,
  CustomerContentError,
  assertNotCustomerContent,
  customerMarkerOf,
  customerRemark,
  isCustomerOwned,
  itemIsCustomerOwned,
  markerRe,
  normalise,
  partitionFindings,
};
