'use strict';
/* How a name-guard alert looks on Discord. Extracted so the shape can be regression-tested —
 * it drifted twice by hand before this existed.
 *
 * CONTRACT (do not change without the QA owner asking):
 *   line 1  : **<bold headline>**
 *   line 2+ : a blockquote ("> ") of **English field labels** with Thai body text
 *   destination is the QA channel, never a DM
 */

/** Discord renders _italic_, *bold*, ~~strike~~, `code`, ||spoiler|| inside plain text. */
function esc(s) {
  return String(s == null ? '' : s).replace(/([\\`*_~|>])/g, '\\$1');
}

/* Alert shape = the one the QA channel already uses: a bold headline line, then a blockquote
 * of bold English field labels. The body text is Thai (owner's call) — English is kept only
 * for terms that read worse translated: API, LIVESTREAM, ticket, GitHub Actions, VPN, LaTeX.
 * Same shape for failures, findings and clean runs so the channel stays readable. */
function build(r) {
  const q = (label, value) => '> **' + label + ':** ' + value;
  // Creator libraries are listed as one total: naming each account makes the line unreadable
  // and adds nothing the reader can act on.
  const own = Object.entries(r.sources).filter(([k]) => k.startsWith('own'));
  const scope = Object.entries(r.sources).filter(([k]) => !k.startsWith('own'))
    .map(([k, v]) => k + ' ' + v.count)
    .concat(own.length ? ['คลัง creator ' + own.length + ' บัญชี ' + own.reduce((n, [, v]) => n + v.count, 0)] : [])
    .join(' · ');

  if (!r.ok) {
    return '**Name guard:** [Content Naming][' + esc(r.env) + '] สแกนไม่สำเร็จ\n'
      + q('Environment', esc(r.env)) + '\n'
      + q('Status', 'Failed') + '\n'
      + q('Reason', esc(r.error)) + '\n'
      + q('Impact', 'รอบนี้ยังไม่รู้ว่ามีชื่อไม่เหมาะสมหรือไม่ — สแกนไม่ครบไม่นับว่าผ่าน ต้องเข้าไปตรวจแล้วรันใหม่');
  }
  if (!r.findings.length) {
    return '**Name guard:** [Content Naming][' + esc(r.env) + '] ไม่พบชื่อไม่เหมาะสม\n'
      + q('Environment', esc(r.env)) + '\n'
      + q('Status', 'Clean') + '\n'
      + q('Scope', esc(scope));
  }

  // One content item can surface twice (public list + its creator's library) — report it once.
  const seenId = new Set();
  const uniq = r.findings.filter((f) => (seenId.has(f.id) ? false : seenId.add(f.id)));
  const isCross = (f) => f.hits.every((h) => h.rule === 'duplicate-name-cross-creator');
  const crossTitles = [...new Set(uniq.filter(isCross).map((f) => f.title))];
  const rest = uniq.filter((f) => !isCross(f));
  const hard = rest.filter((f) => f.hits.some((h) => h.rule !== 'duplicate-name'));
  const dupTitles = [...new Set(rest.filter((f) => !hard.includes(f)).map((f) => f.title))];
  if (!hard.length && !dupTitles.length) {
    return '**Name guard:** [Content Naming][' + esc(r.env) + '] ไม่พบชื่อที่ต้องแก้\n'
      + q('Environment', esc(r.env)) + '\n'
      + q('Status', 'Fixed') + '\n'
      + q('Scope', esc(scope)) + '\n'
      + q('FYI', 'ชื่อพ้องข้ามผู้สร้าง ' + crossTitles.length + ' ชื่อ — เนื้อหาคนละชิ้น แก้แทนเจ้าของไม่ได้: '
        + crossTitles.slice(0, 4).map((x) => '`' + esc(x) + '`').join(' · '));
  }
  const bullet = (s) => '> • ' + s;

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
  const th = (rule) => RULE_TH[rule] || rule;

  const out = ['**Inappropriate content:** [Content Naming][' + esc(r.env) + '] '
    + (hard.length ? 'พบชื่อไม่เหมาะสม ' + hard.length + ' รายการ' : 'พบชื่อซ้ำ ' + dupTitles.length + ' ชื่อ'),
  q('Environment', esc(r.env)),
  q('Status', 'Needs fix'),
  q('Scope', esc(scope))];

  if (hard.length) {
    out.push('> **Items:**');
    out.push(...hard.slice(0, 8).map((f) => bullet('`' + esc(f.title) + '` — ' + esc(f.source) + ' · '
      + esc(f.hits.filter((h) => h.rule !== 'duplicate-name').map((h) => th(h.rule)).join(', ')))));
    if (hard.length > 8) out.push(bullet('และอีก ' + (hard.length - 8) + ' รายการ'));
  }
  if (dupTitles.length) {
    out.push('> **Duplicate titles:**');
    out.push(...dupTitles.slice(0, 6).map((t) => bullet('`' + esc(t) + '`')));
    if (dupTitles.length > 6) out.push(bullet('และอีก ' + (dupTitles.length - 6) + ' ชื่อ'));
  }
  if (crossTitles.length) {
    out.push(q('FYI', 'ชื่อพ้องข้ามผู้สร้าง ' + crossTitles.length + ' ชื่อ (เนื้อหาคนละชิ้น ต้องให้เจ้าของปรับเอง)'));
  }
  out.push('> **Action:**');
  out.push(bullet('เปลี่ยนเป็นชื่อที่ผู้เรียนเห็นแล้วเข้าใจ หรือเอารายการที่ซ้ำออก'));
  out.push(bullet('สื่อไลฟ์สดแก้ชื่อไม่ได้ ต้องลบอย่างเดียว'));
  return out.join('\n');
}


module.exports = { build, esc };
