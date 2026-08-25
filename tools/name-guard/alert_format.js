'use strict';
/* How a name-guard alert looks on Discord.
 *
 * CONTRACT — the format the owner accepted, reproduced on EVERY send, whatever the outcome.
 * No field is skipped when it has nothing to say, none is added, none is reordered:
 *
 *   **Inappropriate content:** [Content Naming][<env>] <headline>
 *   > **Environment:** …
 *   > **Media Type:** …
 *   > **Status:** …
 *   > **Solution:**
 *   > • …
 *   > **Prevention:**
 *   > • …
 *   > **FYI:** …
 *
 * A field with nothing to report still appears, saying so ("ไม่มี"). A reader who has to work
 * out whether a section was omitted or was empty cannot trust the next message either.
 * Destination is the QA channel, never a DM. Body text is Thai; the labels stay English, as do
 * terms that read worse translated (API, LIVESTREAM, ticket, VPN, LaTeX).
 *
 * Enforced by alert_gate.js (7 checks, fail-closed) and pinned by alert_format.test.js.
 */

const customer = require('./customer_content');

/** Discord renders _italic_, *bold*, ~~strike~~, `code`, ||spoiler|| inside plain text. */
function esc(s) {
  return String(s == null ? '' : s).replace(/([\\`*_~|>])/g, '\\$1');
}

/* Flatten a value that may arrive with newlines into something a one-line bullet can hold.
 *
 * The alert is validated line by line (alert_gate.js), so a multi-line value does not merely
 * look untidy — its extra lines are read as stray lines and the whole alert is refused. A
 * Playwright failure is exactly that shape:
 *
 *   page.goto: Timeout 60000ms exceeded.
 *   Call log:
 *     - navigating to "https://…", waiting until "domcontentloaded"
 *
 * On 2026-08-15 that cost the QA channel both of the day's failure alerts: the gate rejected
 * them and nothing was posted. (The SFD DM backstop still fired, so it was not silent — but
 * the channel alert is the deliverable, and it never arrived.) Collapse rather than reject:
 * the reason belongs in the message, on one line.
 */
/* Discord refuses anything longer; alert_gate.js enforces the same number on the way out. */
const MAX_MSG = 2000;

/* A quoted content title, capped.
 *
 * Titles are user data and one pre-prod media item is a ~280-character paragraph of Lorem
 * Ipsum. Quoted verbatim, four of those are the whole message budget — which is how a real
 * finding set ended up unsendable. Cap the title, keep the ellipsis visible so nobody reads
 * the shortened form as the actual name, and escape AFTER cutting so a trailing backslash
 * cannot survive the cut. */
function title(s, max = 60) {
  const flat = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return esc(flat.length > max ? flat.slice(0, max - 1) + '…' : flat);
}

function oneLine(s, max = 300) {
  const flat = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
}

// Thai names for what the reader sees on screen, in a stable order.
const TYPE_TH = {
  LIVESTREAM: 'สื่อไลฟ์สด',
  ARTICLE: 'บทความ',
  VIDEO: 'สื่อวิดีโอ',
  DOCUMENT: 'ไฟล์เอกสาร',
  EBOOK: 'หนังสือดิจิทัล',
  achievements: 'เหรียญรางวัล',
  courses: 'คอร์สเรียน',
  'learning-paths': 'เส้นทางการเรียนรู้',
  media: 'สื่อการเรียนรู้',
};
const TYPE_ORDER = ['สื่อไลฟ์สด', 'บทความ', 'สื่อวิดีโอ', 'ไฟล์เอกสาร', 'หนังสือดิจิทัล',
  'สื่อการเรียนรู้', 'เหรียญรางวัล', 'คอร์สเรียน', 'เส้นทางการเรียนรู้'];

const RULE_TH = {
  'test-trace': 'มีคำที่สื่อถึงการทดสอบ',
  'ticket-ref': 'มีรหัส ticket',
  'status-paren': 'มีวงเล็บสถานะ',
  gibberish: 'อ่านไม่รู้เรื่อง',
  'no-words': 'เป็นตัวเลข/สัญลักษณ์ล้วน',
  'too-short': 'ชื่อสั้นเกินไป',
  profanity: 'คำไม่สุภาพ',
  empty: 'ไม่มีชื่อ',
  custom: 'ติดคำต้องห้าม',
};
const ASSET_RULES = new Set(['missing-cover', 'cover-broken']);

/** Which media types a set of findings touches, named the way the reader sees them. */
function mediaTypes(findings) {
  const out = new Set();
  for (const f of findings) {
    const src = String(f.source || '').replace(/^own:.*/, 'media');
    if (src === 'media') out.add(TYPE_TH[f.type] || TYPE_TH.media);
    else if (TYPE_TH[src]) out.add(TYPE_TH[src]);
  }
  return TYPE_ORDER.filter((t) => out.has(t));
}

/** The standing guard, described as it actually runs. Kept truthful, not aspirational. */
function preventionBullets() {
  return [
    'ตรวจชื่ออัตโนมัติบน pre-prod วันละ 2 รอบ เวลา 11:00 และ 17:00 (งานตั้งเวลาบนเครื่อง QA ที่ต่อ VPN) — เครื่องไม่เปิดก็ข้ามรอบนั้นไป ไม่แจ้งเตือนให้รก',
    'training ไม่แตะทุกกรณี — ไม่สแกน ไม่แจ้งเตือน และเขียนข้อมูลไม่ได้ เพราะมีผู้ใช้งานจริงทำงานอยู่',
    'เนื้อหาของลูกค้าไม่แตะทุกกรณี — รายการที่มี RGS เป็นข้อมูลทดสอบของ HI ไม่เปลี่ยนชื่อ ไม่ลบ ไม่ขึ้นเป็นงานให้แก้',
    'ตรวจครอบคลุมสื่อ · คอร์สเรียน · เส้นทางการเรียนรู้ · เหรียญรางวัล และคลังของ creator ทุกบัญชี รวมงานที่ยังไม่เผยแพร่ · ดูทั้งชื่อ คำอธิบาย และปกที่หายไป',
    'จับคำที่สื่อถึงการทดสอบ · รหัส ticket · วงเล็บสถานะ · คำอ่านไม่รู้เรื่อง · ชื่อที่เป็นตัวเลขล้วน · คำหยาบ · ชื่อซ้ำของเจ้าของเดียวกัน',
    'เรื่องเดิมที่ยังรอแก้จะไม่แจ้งซ้ำ แจ้งครั้งเดียวจนกว่าผลจะเปลี่ยน และถ้าสแกนไม่สำเร็จจะรายงานว่าล้มเหลว ไม่นับว่าผ่าน',
  ];
}

function build(r) {
  const q = (label, value) => '> **' + label + ':** ' + value;
  const blockLabel = (label) => '> **' + label + ':**';
  const bullet = (s) => '> • ' + s;
  const env = esc(r.env);

  // ---- a scan that could not run ----------------------------------------------------
  if (!r.ok) {
    return ['**Inappropriate content:** [Content Naming][' + env + '] สแกนไม่สำเร็จ — ยังไม่รู้ผล',
      q('Environment', env),
      q('Media Type', 'ยังไม่ทราบ — สแกนไม่สำเร็จ'),
      q('Status', 'Failed'),
      blockLabel('Solution'),
      bullet('เข้าไปตรวจว่าทำไมสแกนไม่ผ่าน แล้วรันใหม่: ' + esc(oneLine(r.error) || 'ไม่ทราบสาเหตุ')),
      bullet('รอบนี้ยังไม่รู้ว่ามีชื่อไม่เหมาะสมหรือไม่ — สแกนไม่ครบไม่นับว่าผ่าน'),
      blockLabel('Prevention'),
      ...preventionBullets().map(bullet),
      q('FYI', esc(customer.customerRemark(0))),
    ].join('\n');
  }

  /* L3 — the customer's content is filtered again, here, on purpose.
   *
   * The scanner already moved it out of `findings` (L2). This repeats the check because the
   * builder also runs on reports it did not produce: an older report file, one hand-built by a
   * fixer, one from a copy of this toolkit whose scanner predates the rule. A fix list is the
   * thing a person acts on, so the last step before writing one checks for itself. */
  const split = customer.partitionFindings(r.findings || []);
  const findings = split.mine;
  const skippedCustomer = [...new Set(
    (Array.isArray(r.customerOwned) ? r.customerOwned : []).concat(split.customer).map((f) => f && f.id),
  )].filter(Boolean).length;

  // One content item can surface twice (public list + its creator's library) — report it once.
  const seenId = new Set();
  const uniq = findings.filter((f) => (seenId.has(f.id) ? false : seenId.add(f.id)));

  const isCross = (f) => f.hits.every((h) => h.rule === 'duplicate-name-cross-creator');
  const crossTitles = [...new Set(uniq.filter(isCross).map((f) => f.title))];
  const rest = uniq.filter((f) => !isCross(f));

  // A missing cover is not a bad name. Counted and asked for separately, so a readable title is
  // never sent back for renaming just because its cover is missing.
  const nameHits = (f) => f.hits.filter((h) => h.rule !== 'duplicate-name' && !ASSET_RULES.has(h.rule));
  const hard = rest.filter((f) => nameHits(f).length);
  const noCover = rest.filter((f) => !nameHits(f).length && f.hits.some((h) => ASSET_RULES.has(h.rule)));
  const dupes = rest.filter((f) => !hard.includes(f) && !noCover.includes(f));
  const dupTitles = [...new Set(dupes.map((f) => f.title))];

  /* L4 — the customer-content remark rides on EVERY alert, forever (owner, 2026-08-25).
   * Unconditional: a clean round says it too, because the point is that those rows are outside
   * the scan's remit at all times, not that this particular round happened to skip some. */
  const fyi = [
    crossTitles.length
      ? 'เหลือชื่อพ้องข้ามผู้สร้าง ' + crossTitles.length + ' ชื่อ ('
        + crossTitles.slice(0, 3).map((x) => '`' + esc(x) + '`').join(' · ')
        + ') — เนื้อหาคนละชิ้น ระบบไม่อนุญาตให้แก้สื่อของผู้สร้างรายอื่น ต้องให้เจ้าของช่องปรับชื่อเอง'
      : '',
    esc(customer.customerRemark(skippedCustomer)),
  ].filter(Boolean).join(' · ');

  // ---- nothing to fix ---------------------------------------------------------------
  if (!hard.length && !noCover.length && !dupTitles.length) {
    return ['**Inappropriate content:** [Content Naming][' + env + '] ไม่พบชื่อหรือปกที่ต้องแก้',
      q('Environment', env),
      q('Media Type', mediaTypes(uniq).join(' · ') || 'สื่อการเรียนรู้ · คอร์สเรียน · เส้นทางการเรียนรู้ · เหรียญรางวัล'),
      q('Status', crossTitles.length ? 'Fixed' : 'Clean'),
      blockLabel('Solution'),
      bullet('ไม่ต้องแก้อะไรรอบนี้ — ชื่อและปกที่ผู้เรียนเห็นผ่านครบทุกรายการ'),
      blockLabel('Prevention'),
      ...preventionBullets().map(bullet),
      q('FYI', fyi),
    ].join('\n');
  }

  // ---- something to fix -------------------------------------------------------------
  const headline = [
    hard.length ? 'พบชื่อไม่เหมาะสม ' + hard.length + ' รายการ' : '',
    noCover.length ? 'ไม่มีปก ' + noCover.length + ' รายการ' : '',
    dupTitles.length ? 'ชื่อซ้ำ ' + dupTitles.length + ' ชื่อ' : '',
  ].filter(Boolean).join(' · ');

  /* Assemble at a given example budget, so the caller can shrink until it fits.
   *
   * `shown` is how many examples each list quotes; whatever is dropped is still counted in the
   * "และอีก N" tail, so a shorter message never means a smaller problem. */
  const assemble = (shown) => {
    const more = (total, unit) => (total > shown ? ' และอีก ' + (total - shown) + ' ' + unit : '');
    const solution = [];
    if (hard.length) {
      solution.push('เปลี่ยนชื่อ ' + hard.length + ' รายการให้ผู้เรียนอ่านแล้วเข้าใจ: '
        + hard.slice(0, shown).map((f) => '`' + title(f.title) + '` (' + esc(nameHits(f).map((h) => RULE_TH[h.rule] || h.rule).join(', ')) + ')').join(' · ')
        + more(hard.length, 'รายการ'));
      solution.push('สื่อไลฟ์สดแก้ชื่อไม่ได้ เพราะ API แก้สื่อไม่รับประเภท LIVESTREAM จึงต้องลบอย่างเดียว');
    }
    if (noCover.length) {
      solution.push('อัปโหลดปกให้ ' + noCover.length + ' รายการที่ยังไม่มี — ชื่อไม่ต้องแก้ อ่านรู้เรื่องอยู่แล้ว: '
        + noCover.slice(0, shown).map((f) => '`' + title(f.title) + '`').join(' · ')
        + more(noCover.length, 'รายการ'));
      solution.push('การ์ดที่ไม่มีปกขึ้นเป็นช่องว่างบนหน้าจอผู้เรียน ต้องแก้ก่อนถึงจะถือว่าเผยแพร่เรียบร้อย');
    }
    if (dupTitles.length) {
      solution.push('ชื่อซ้ำของเจ้าของเดียวกัน ' + dupTitles.length + ' ชื่อ — เอารายการที่ซ้ำออกหรือตั้งชื่อให้ต่างกัน: '
        + dupTitles.slice(0, shown).map((t) => '`' + title(t) + '`').join(' · ')
        + more(dupTitles.length, 'ชื่อ'));
    }
    return ['**Inappropriate content:** [Content Naming][' + env + '] ' + headline,
      q('Environment', env),
      q('Media Type', mediaTypes(rest).join(' · ') || 'สื่อการเรียนรู้'),
      q('Status', 'Needs fix'),
      blockLabel('Solution'),
      ...solution.map(bullet),
      blockLabel('Prevention'),
      ...preventionBullets().map(bullet),
      q('FYI', fyi),
    ].join('\n');
  };

  /* Fit by construction rather than by luck.
   *
   * A blocked alert is silence about real findings — that happened on 2026-08-18, and again
   * (2481 chars) once a creator library that had never been readable came into coverage. The
   * Prevention block and the counts are fixed cost; the examples are the only elastic part, so
   * they are what gives. One example is the floor: below that the reader has nothing concrete. */
  for (let shown = 4; shown > 1; shown--) {
    const out = assemble(shown);
    if (out.length <= MAX_MSG) return out;
  }
  return assemble(1);
}

module.exports = { build, esc, mediaTypes, TYPE_TH, RULE_TH };
