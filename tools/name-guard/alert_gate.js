'use strict';
/* Seven checks a name-guard alert must pass before it is allowed to leave.
 *
 * The message shape is not a preference — it is the format the owner accepted, and every
 * deviation has cost a correction round: a wrong header (PM-001), literal markdown (PM-004),
 * a headline that accused readable names of being unfit, the same alert posted three times.
 * Reading a draft does not catch these; the draft always looks right to whoever wrote it.
 * So the outgoing string is scanned, mechanically, every time.
 *
 * FAIL-CLOSED: if any layer fails, nothing is sent. A missing alert is recoverable; a wrong one
 * has already been read by the team.
 *
 *   L1 field set      — Environment · Media Type · Status · Solution · Prevention · FYI, all present
 *   L2 field order    — in that order, exactly; no reordering "because it reads better"
 *   L3 line shape     — header line, `> **Field:**` lines, `> • ` bullets; nothing else
 *   L4 no extras      — no field outside the canonical set (no Scope/Action/Items drift)
 *   L5 markdown safe  — no literal `**` inside a value, no unescaped `_` (Discord renders italics)
 *   L6 substance      — every field carries content, every block has ≥1 bullet, ≤2000 chars
 *   L7 no empty claim — a Status that says work happened must show what, and counts must be real
 */

const FIELDS = ['Environment', 'Media Type', 'Status', 'Solution', 'Prevention', 'FYI'];
const BLOCK_FIELDS = ['Solution', 'Prevention'];      // these carry bullets, not an inline value
const HEADER_RE = /^\*\*Inappropriate content:\*\* \[Content Naming]\[[^\]]+] .+$/;
const FIELD_RE = /^> \*\*([^*]+):\*\*(.*)$/;
const BULLET_RE = /^> • .+$/;
const MAX = 2000;                                      // Discord's hard limit on message content

function verify(content) {
  const fails = [];
  const text = String(content == null ? '' : content);
  const lines = text.split('\n');

  // L3 — line shape. Every line is the header, a field, or a bullet.
  if (!lines.length || !HEADER_RE.test(lines[0])) {
    fails.push('L3 header line is not `**Inappropriate content:** [Content Naming][env] …`');
  }
  const seen = [];
  lines.slice(1).forEach((ln, i) => {
    const m = FIELD_RE.exec(ln);
    if (m) { seen.push(m[1].trim()); return; }
    if (BULLET_RE.test(ln)) return;
    if (ln.trim() === '') return;
    fails.push('L3 line ' + (i + 2) + ' is neither a field nor a bullet: ' + ln.slice(0, 60));
  });

  // L1 — every canonical field present.
  for (const f of FIELDS) if (!seen.includes(f)) fails.push('L1 missing field: ' + f);

  // L2 — canonical order.
  const canonical = seen.filter((f) => FIELDS.includes(f));
  const wanted = FIELDS.filter((f) => canonical.includes(f));
  if (canonical.join('|') !== wanted.join('|')) {
    fails.push('L2 fields out of order: got ' + canonical.join(' · ') + ' — want ' + FIELDS.join(' · '));
  }

  // L4 — nothing outside the canonical set.
  for (const f of seen) if (!FIELDS.includes(f)) fails.push('L4 unexpected field: ' + f);

  // L5 — markdown that would render wrong. Values must be escaped before they get here.
  const body = lines.slice(1).join('\n')
    .replace(/^> \*\*[^*]+:\*\*/gm, '')                // the field labels are meant to be bold
    .replace(/`[^`]*`/g, '');                          // code spans are literal by design
  if (/\*\*/.test(body)) fails.push('L5 literal ** inside a value — escape it');
  if (/(^|[^\\])_/.test(body)) fails.push('L5 unescaped _ — Discord will render italics');

  // L6 — substance. A field with no content is a formatting shell, not a report.
  lines.slice(1).forEach((ln) => {
    const m = FIELD_RE.exec(ln);
    if (!m) return;
    const [, name, rest] = m;
    if (BLOCK_FIELDS.includes(name.trim())) return;    // value lives in the bullets below
    if (!rest.trim()) fails.push('L6 field has no value: ' + name.trim());
  });
  for (const f of BLOCK_FIELDS) {
    const at = lines.findIndex((ln) => (FIELD_RE.exec(ln) || [])[1] === f);
    if (at < 0) continue;                              // already reported by L1
    if (!BULLET_RE.test(lines[at + 1] || '')) fails.push('L6 ' + f + ' has no bullets');
  }
  if (text.length > MAX) fails.push('L6 message is ' + text.length + ' chars, over Discord’s ' + MAX);

  // L7 — no claim without evidence. If the headline counts things, the message must list some.
  const headline = lines[0] || '';
  const counted = /\d+\s*(รายการ|ชื่อ)/.test(headline);
  const bullets = lines.filter((l) => BULLET_RE.test(l)).length;
  if (counted && bullets === 0) fails.push('L7 headline counts findings but the message lists none');
  if (/undefined|null|NaN|\{\{|TBD|TODO/.test(text)) fails.push('L7 unfilled placeholder in the message');

  return { ok: fails.length === 0, failures: fails };
}

module.exports = { verify, FIELDS, BLOCK_FIELDS, HEADER_RE, MAX };
