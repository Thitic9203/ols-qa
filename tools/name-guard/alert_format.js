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
      q('FYI', 'ไม่มีข้อมูลเพิ่มเติมรอบนี้'),
    ].join('\n');
  }

  const findings = r.findings || [];
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

  const fyi = crossTitles.length
    ? 'เหลือชื่อพ้องข้ามผู้สร้าง ' + crossTitles.length + ' ชื่อ ('
      + crossTitles.slice(0, 3).map((x) => '`' + esc(x) + '`').join(' · ')
      + ') — เนื้อหาคนละชิ้น ระบบไม่อนุญาตให้แก้สื่อของผู้สร้างรายอื่น ต้องให้เจ้าของช่องปรับชื่อเอง'
    : 'ไม่มีเรื่องค้างอื่นรอบนี้';

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

  const solution = [];
  if (hard.length) {
    solution.push('เปลี่ยนชื่อ ' + hard.length + ' รายการให้ผู้เรียนอ่านแล้วเข้าใจ: '
      + hard.slice(0, 4).map((f) => '`' + esc(f.title) + '` (' + esc(nameHits(f).map((h) => RULE_TH[h.rule] || h.rule).join(', ')) + ')').join(' · ')
      + (hard.length > 4 ? ' และอีก ' + (hard.length - 4) + ' รายการ' : ''));
    solution.push('สื่อไลฟ์สดแก้ชื่อไม่ได้ เพราะ API แก้สื่อไม่รับประเภท LIVESTREAM จึงต้องลบอย่างเดียว');
  }
  if (noCover.length) {
    solution.push('อัปโหลดปกให้ ' + noCover.length + ' รายการที่ยังไม่มี — ชื่อไม่ต้องแก้ อ่านรู้เรื่องอยู่แล้ว: '
      + noCover.slice(0, 4).map((f) => '`' + esc(f.title) + '`').join(' · ')
      + (noCover.length > 4 ? ' และอีก ' + (noCover.length - 4) + ' รายการ' : ''));
    solution.push('การ์ดที่ไม่มีปกขึ้นเป็นช่องว่างบนหน้าจอผู้เรียน ต้องแก้ก่อนถึงจะถือว่าเผยแพร่เรียบร้อย');
  }
  if (dupTitles.length) {
    solution.push('ชื่อซ้ำของเจ้าของเดียวกัน ' + dupTitles.length + ' ชื่อ — เอารายการที่ซ้ำออกหรือตั้งชื่อให้ต่างกัน: '
      + dupTitles.slice(0, 4).map((t) => '`' + esc(t) + '`').join(' · ')
      + (dupTitles.length > 4 ? ' และอีก ' + (dupTitles.length - 4) + ' ชื่อ' : ''));
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
}

module.exports = { build, esc, mediaTypes, TYPE_TH, RULE_TH };
