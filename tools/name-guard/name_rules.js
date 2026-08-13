'use strict';
/* Shared name/description quality rules for OLS customer-facing content.
 * Source of truth for "ชื่อไม่เหมาะสม" per ols-qa CLAUDE.md (test traces, status-in-parens,
 * gibberish, ticket refs, profanity). Pure functions — no I/O, reusable by scanner + fixer + cron.
 */

// 1) QA / test traces
const TEST_PATTERNS = [
  /\bqa[\s_\-]*test\b/i,
  /\bqa[_\-]?ols\b/i,
  /\[\s*qa[^\]]*\]/i,
  /\btest(ing|est|case|s)?\b/i,
  /\btc[_\-]?\d+\b/i,
  /ทดสอบ/,
  /ทดลองระบบ/,
  /สำหรับการตรวจรับ/,
  /\bdummy\b/i,
  /\bplaceholder\b/i,
  /\bsample\b/i,
  /\bmock\b/i,
  /\btbc\b/i,
  /\bdemo\b/i,
  /\blorem\s+ipsum\b/i,
  /\bfoo\b|\bbar\b|\bbaz\b/i,
  /\basdf+\b/i,
  /\baaa+\b/i,
];

// 2) ticket / issue references leaking into user-visible names
const TICKET_PATTERNS = [/\bOLS[\s_\-]?\d{1,4}\b/i, /\b[A-Z]{2,6}-\d{1,5}\b/];

// 3) status / editing / duplicate markers wrapped in parentheses
const STATUS_PAREN = /[(（]\s*(เผยแพร่|ยกเลิกการเผยแพร่|ยกเลิกเผยแพร่|ร่าง|แบบร่าง|รอแก้ไข|รออนุมัติ|ไม่อนุมัติ|ถูกรายงาน|แก้ไข|แก้แล้ว|สำเนา|ใหม่|ก๊อป|copy|edited?|new|draft|published|unpublished|pending|rejected|flagged|\d+)\s*[)）]/i;

// 4) profanity / clearly-inappropriate (kept short + explicit; extend via extraBadWords)
const PROFANITY = [
  /เหี้ย/, /สัส/, /ควย/, /หี\b/, /เย็ด/, /ไอ้สัตว์/, /อีดอก/, /แม่ง/, /ชิบหาย/,
  /\bfuck/i, /\bshit\b/i, /\bbitch\b/i, /\bdick\b/i, /\bporn\b/i, /\bsex\b/i,
];

const THAI_RE = /[฀-๿]/;

// 5) gibberish heuristics for latin tokens (e.g. "mx;smclsnvlcsmv;cxc[lc")
// Real brand/tech words are vowel-poor too (Python, ChatGPT, HTML, SQL) — never flag those.
const LATIN_ALLOW = new Set([
  'chatgpt', 'python', 'html', 'css', 'sql', 'nosql', 'javascript', 'typescript', 'json', 'xml',
  'github', 'gitlab', 'linux', 'windows', 'macos', 'android', 'ios', 'aws', 'gcp', 'api', 'apis',
  'ai', 'ml', 'llm', 'gpt', 'nlp', 'ocr', 'pdf', 'excel', 'word', 'powerpoint', 'canva', 'figma',
  'photoshop', 'wordpress', 'kpi', 'okr', 'crm', 'erp', 'hr', 'ux', 'ui', 'qr', 'stem', 'steam',
  'obec', 'ndlp', 'ols', 'cms', 'lms', 'vpn', 'https', 'http', 'url', 'usb', 'pc', 'cpu', 'gpu',
]);
function latinTokenIsGibberish(tok) {
  const t = tok.trim().replace(/^[\s"'“”‘’(\[]+|[\s"'“”‘’)\].,!?:;]+$/g, '');
  if (t.length < 5) return false;
  if (!/^[\x20-\x7E]+$/.test(t)) return false;           // ascii only
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (LATIN_ALLOW.has(letters.toLowerCase())) return false;
  // word-like blob with punctuation/symbols mixed inside → strong signal
  const symbolCount = (t.match(/[;:\[\]{}|\\<>~`^*+=_@#$%&]/g) || []).length;
  if (symbolCount >= 2 && /[A-Za-z]/.test(t)) return true;
  if (letters.length < 5) return false;
  const vowels = (letters.match(/[aeiouyAEIOUY]/g) || []).length;  // y counts as a vowel
  if (vowels === 0) return true;                          // no vowel at all
  if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{5,}/.test(letters)) return true; // long consonant run
  if (/(.)\1{3,}/i.test(letters)) return true;            // aaaa / ddddd
  return false;
}

// Thai gibberish: long run of Thai consonants with no vowel/tone marks at all.
// The threshold stays high on purpose — plenty of real Thai words carry no vowel mark
// (ทดลอง, ผลกระทบ), so a lower bound here would flag valid names.
function thaiIsGibberish(s) {
  const thaiOnly = s.replace(/[^฀-๿]/g, '');
  if (thaiOnly.length < 8) return false;
  const marks = (thaiOnly.match(/[ะ-๎]/g) || []).length; // vowels + tones
  return marks === 0;
}

/* Keyboard-mash names are usually a short unit typed twice — "กหฟกหฟ", "dsdsds", "อิอิอิ".
 * Catching the repeat is precise where a vowel/consonant heuristic is not: real words do not
 * consist solely of the same 2-4 character unit repeated. Thai reduplication is written with
 * ๆ, so it does not trip this. */
function isRepeatedUnit(tok) {
  const t = String(tok || '').trim();
  if (t.length < 4 || /ๆ/.test(t)) return false;
  for (let unit = 1; unit <= Math.floor(t.length / 2); unit++) {
    if (t.length % unit) continue;
    const head = t.slice(0, unit);
    if (t === head.repeat(t.length / unit)) return unit <= 4;   // "abcabc" yes, long phrase no
  }
  return false;
}

function checkText(text, opts) {
  const o = opts || {};
  const s = String(text == null ? '' : text);
  const findings = [];
  if (!s.trim()) { findings.push({ rule: 'empty', why: 'ว่างเปล่า' }); return findings; }

  for (const re of TEST_PATTERNS) if (re.test(s)) { findings.push({ rule: 'test-trace', why: 'มีร่องรอยเทส: ' + (s.match(re) || [''])[0].trim() }); break; }
  for (const re of TICKET_PATTERNS) if (re.test(s)) { findings.push({ rule: 'ticket-ref', why: 'อ้าง ticket: ' + (s.match(re) || [''])[0] }); break; }
  if (STATUS_PAREN.test(s)) findings.push({ rule: 'status-paren', why: 'มีวงเล็บสถานะ: ' + (s.match(STATUS_PAREN) || [''])[0] });
  for (const re of PROFANITY) if (re.test(s)) { findings.push({ rule: 'profanity', why: 'คำไม่สุภาพ' }); break; }
  for (const re of (o.extraBadWords || [])) if (re.test(s)) { findings.push({ rule: 'custom', why: 'ติด denylist เพิ่มเติม' }); break; }

  for (const tok of s.split(/\s+/)) {
    if (isRepeatedUnit(tok)) { findings.push({ rule: 'gibberish', why: 'คำซ้ำหน่วยเดิม (พิมพ์มั่ว): ' + tok.slice(0, 30) }); break; }
  }
  if (thaiIsGibberish(s)) findings.push({ rule: 'gibberish', why: 'ไทยไม่มีสระ/วรรณยุกต์เลย = อ่านไม่รู้เรื่อง' });
  else {
    for (const tok of s.split(/\s+/)) {
      if (THAI_RE.test(tok)) continue;
      if (latinTokenIsGibberish(tok)) { findings.push({ rule: 'gibberish', why: 'คำอ่านไม่รู้เรื่อง: ' + tok.slice(0, 40) }); break; }
    }
  }
  if (o.isTitle && s.trim().length < 4) findings.push({ rule: 'too-short', why: 'ชื่อสั้นเกินไป (<4 ตัว)' });
  if (o.isTitle && !/[A-Za-z฀-๿]/.test(s)) findings.push({ rule: 'no-words', why: 'ชื่อไม่มีตัวอักษรเลย (ตัวเลข/สัญลักษณ์ล้วน)' });
  return findings;
}

/** Duplicate titles inside one source list.
 *
 *  Two cases, deliberately separated — they need different actions:
 *   - same owner  → `duplicate-name`: the same creator published the title twice. Ours to fix
 *     (rename or unpublish the extra).
 *   - different owners → `duplicate-name-cross-creator`: two creators independently chose the
 *     same title for different content. We cannot edit another creator's media (the API answers
 *     403 media.not_owner even to a SYSTEM_ADMIN), and their content is legitimate — so this is
 *     reported for the owners' attention, not counted as something we failed to fix.
 *
 *  items: [{id,title,userId?,ownerId?,channelName?}] → [{item, hit}] per offending item.
 */
function findDuplicates(items) {
  const byName = new Map();
  for (const it of items) {
    const k = String(it.title == null ? '' : it.title).trim().toLowerCase();
    if (!k) continue;
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(it);
  }
  const ownerOf = (it) => String(it.userId || it.ownerId || '');
  const out = [];
  for (const [, group] of byName) {
    if (group.length < 2) continue;
    const owners = new Set(group.map(ownerOf));
    const cross = owners.size > 1;
    const channels = [...new Set(group.map((g) => g.channelName).filter(Boolean))];
    for (const it of group) {
      out.push({
        item: it,
        hit: {
          field: 'title',
          rule: cross ? 'duplicate-name-cross-creator' : 'duplicate-name',
          value: it.title,
          why: cross
            ? 'ชื่อพ้องกับผู้สร้างรายอื่น' + (channels.length ? ' (' + channels.join(' / ') + ')' : '') + ' — เนื้อหาคนละชิ้น แก้แทนเจ้าของไม่ได้ ต้องแจ้งให้เจ้าของปรับชื่อ'
            : 'ชื่อซ้ำกับอีก ' + (group.length - 1) + ' รายการของเจ้าของเดียวกัน (' + group.map((g) => String(g.id).slice(0, 8)).join(', ') + ')',
        },
      });
    }
  }
  return out;
}

/* Cover / thumbnail completeness.
 *
 * A published item with no cover is as visible a defect as a bad name — the card renders a
 * blank tile to every real user — but it is invisible to a name-only scan. Two learning paths
 * shipped that way in training69 (2026-08-12) and were only noticed by eye weeks later, so the
 * check is mechanical from here on.
 *
 * The field is `coverImageUrl` on media, courses and learning paths alike; `thumbnailUrl` is
 * accepted as an alias so a future endpoint rename does not silently turn this into a no-op.
 * DRAFT items are exempt: a cover is only owed once the content faces a user.
 */
const COVER_FIELDS = ['coverImageUrl', 'thumbnailUrl'];
const USER_FACING_STATUS = new Set(['PUBLISHED', 'PENDING_APPROVAL', 'PENDING_EDIT', 'FLAGGED', 'UNPUBLISHED']);

function coverUrlOf(item) {
  for (const f of COVER_FIELDS) {
    const v = item && item[f];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/** Missing-cover check for one item. Returns [] when the item carries a cover (or is a draft). */
function checkAsset(item) {
  const it = item || {};
  const status = String(it.status || '').toUpperCase();
  if (status && !USER_FACING_STATUS.has(status)) return [];      // DRAFT etc. — nothing owed yet
  if (coverUrlOf(it)) return [];
  return [{
    field: 'coverImageUrl',
    rule: 'missing-cover',
    value: '',
    why: 'ไม่มีทรัมเนล/ปก — การ์ดขึ้นว่างให้ผู้ใช้เห็น' + (status ? ' (สถานะ ' + status + ')' : ''),
  }];
}

/** Check one content item. Returns [] when clean. */
function checkItem(item) {
  const out = [];
  for (const f of checkText(item.title, { isTitle: true })) out.push(Object.assign({ field: 'title', value: item.title }, f));
  if (item.description != null && String(item.description).trim() !== '') {
    for (const f of checkText(item.description, {})) out.push(Object.assign({ field: 'description', value: String(item.description).slice(0, 120) }, f));
  }
  return out;
}

module.exports = { checkText, checkItem, checkAsset, coverUrlOf, findDuplicates, TEST_PATTERNS, TICKET_PATTERNS, STATUS_PAREN, PROFANITY, COVER_FIELDS, USER_FACING_STATUS, latinTokenIsGibberish, thaiIsGibberish, isRepeatedUnit };
