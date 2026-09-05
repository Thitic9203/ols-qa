'use strict';

/**
 * The investigation rules — the ONE place a machine decides them.
 *
 * The repo's first rule is "never guess, and never dress a guess in language that sounds
 * like knowledge". Its companion (CLAUDE.md, owner 2026-08-15) is that an investigation is
 * run with `superpowers:systematic-debugging` and nothing else. Both were prose. Prose is
 * obeyed until the moment it is inconvenient, which is precisely the moment it matters.
 *
 * So the decidable half lives here, and only here:
 *   - which prompts are shaped like a problem  (INTENT)
 *   - which transcript entries prove the skill actually ran  (SATISFACTION)
 *   - which words mark a guess wearing a suit  (HEDGE, reported — never blocking)
 *
 * The bash layers deliberately hold NO copy of these patterns. Two runtimes carrying the
 * same regex is two answers waiting to disagree; when they disagree the loud one and the
 * blocking one stop describing the same rule, and the guard starts lying. Bash prints the
 * rule (no logic, cannot drift); this file decides.
 */

/** The only skill that may satisfy an armed investigation. */
const DEBUG_SKILL = 'superpowers:systematic-debugging';

/**
 * Problem-shaped signals. Deliberately NARROW.
 *
 * `ตรวจสอบ` on its own is not here, and that omission is the whole design: this is a QA
 * workspace where "ตรวจสอบ" appears in nearly every prompt. A guard that arms on every
 * prompt is a guard that gets switched off within a week — PM-010's lesson, that an alert
 * firing on healthy data is how a real alert gets ignored. Only wording that says
 * *something is wrong* or *find out why* is allowed to arm.
 */
const INTENT = [
  // ── Thai: something is broken ────────────────────────────────────────────────
  { label: 'พัง/ล่ม', re: /พัง|เจ๊ง|ล่ม|crash/i },
  { label: 'ไม่ทำงาน', re: /ไม่ทำงาน|ไม่ขึ้น|ไม่ผ่าน|ใช้ไม่ได้|กดไม่ได้|เข้าไม่ได้/ },
  { label: 'ค้าง', re: /ค้าง|แฮงก์|hang|stuck/i },
  { label: 'ผลเพี้ยน', re: /เพี้ยน|ผลไม่ตรง|ไม่ตรงที่คาด|ไม่ตรงกับที่คาด|ค่าผิด|ข้อมูลหาย/ },
  { label: 'บั๊ก', re: /บั๊ก|บัค|\bbug\b|\bbugs\b|regression/i },
  { label: 'เฟล', re: /เฟล|\bfail(ed|ing|ure|s)?\b|\bbroken\b|\bflaky\b/i, verdictWord: true },

  // ── Thai: find out why ───────────────────────────────────────────────────────
  { label: 'หาสาเหตุ', re: /หาสาเหตุ|ต้นเหตุ|สาเหตุ|root\s*cause/i },
  { label: 'ทำไม', re: /ทำไม/ },
  { label: 'สืบ/ดีบัก', re: /สืบหา|สืบสวน|ดีบัก|\bdebug/i },
  { label: 'ตรวจสอบปัญหา', re: /ตรวจสอบปัญหา|แก้ปัญหา|ไล่ปัญหา|หาจุดที่พัง/ },

  // ── machine noise that is never anything but a problem ───────────────────────
  { label: 'error', re: /\berror\b|\berrors\b|exception|traceback|stack\s*trace|\bpanic\b|timeout/i },
  { label: 'why (en)', re: /why\s+(is|are|does|did|do|isn'?t|doesn'?t|can'?t)\b/i },
  { label: 'not working (en)', re: /not\s+working|do(es|)\s+not\s+work|do(es|)n'?t\s+work|no\s+longer\s+works?/i },
];

/**
 * Words that let an unchecked claim pass as a checked one. Reported, NEVER blocking.
 *
 * Every one of them has an honest use — "ตามสเปก" is correct the moment the spec has
 * actually been opened, and no hook can see whether it was. Blocking on them would make
 * the gate wrong often enough to be disabled, and would take the real block down with it.
 * Naming them at the end of an investigation is the whole intervention.
 */
const HEDGE = [
  { label: 'น่าจะ/อาจจะ/ควรจะ', re: /น่าจะ|อาจจะ|ควรจะ|คงจะ/ },
  { label: 'โดยทั่วไป/ปกติระบบจะ', re: /โดยทั่วไป|ปกติระบบจะ|โดยธรรมชาติของระบบ/ },
  { label: 'ตามหลักการ/ตามสถาปัตยกรรม', re: /ตามหลักการ|ตามสถาปัตยกรรม|by\s+design/i },
  { label: 'อ้างแหล่งลอยๆ', re: /ตามสเปก|ตาม\s?Figma|ตาม\s?AC\b|จากที่เข้าใจ|ตามที่เคยทำ/i },
  { label: 'likely/should be/typically', re: /\blikely\b|\bshould\s+be\b|\btypically\b|\bpresumably\b|\bprobably\b/i },
  { label: 'ศัพท์สวยที่ไม่เพิ่มข้อเท็จจริง', re: /\bcanonical\b|\bmanifest\b|\brobust\b/i },
];

/**
 * The words this workspace records RESULTS in.
 *
 * `FAILED` here is a value in a column, not a report that something broke — it sits beside
 * PASSED and BLOCKED in nearly every result table, sheet and Jira field in this repo. Reading
 * it as a breakage armed the guard on a request to format a summary table (2026-09-05), which
 * is precisely the noise that gets a guard switched off.
 */
const VERDICT_VOCAB = [
  /\bpassed\b/i, /\bfailed\b/i, /\bblocked\b/i, /\breviewing\b/i,
  /\bskipped\b/i, /\bpwmi\b/i, /\bnot\s+started\b/i, /ไม่ผ่าน/, /รอรีวิว/,
];

/**
 * Verdict company: two or more DISTINCT status words in the same text.
 *
 * The threshold is two, and one is deliberately not enough — "the build failed" is a report
 * of a failure and must still arm. What marks a table is that the statuses appear together.
 */
function verdictContext(text) {
  const s = String(text || '');
  return VERDICT_VOCAB.filter((re) => re.test(s)).length >= 2;
}

/** Does this prompt describe a problem? Returns every signal, so the reason is showable. */
function detectIntent(prompt) {
  const text = String(prompt || '');
  const verdicts = verdictContext(text);
  // Only the verdict-bearing signal is suppressed, and only in verdict company. Every other
  // signal keeps its own merit: "ทำไม passed 30 failed 5 ถึงไม่ตรง" is still an investigation.
  const hits = INTENT
    .filter((p) => p.re.test(text) && !(p.verdictWord && verdicts))
    .map((p) => p.label);
  return { armed: hits.length > 0, hits };
}

/** Which hedge words appear in this text. */
function detectHedges(text) {
  const s = String(text || '');
  return HEDGE.filter((p) => p.re.test(s)).map((p) => p.label);
}

/** ISO -> ms. Anything unparseable is treated as "no time", never as "long ago". */
function ts(v) {
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Does one transcript entry prove the skill ran?
 *
 * Matched on the SERIALISED tool_use block rather than on a named input field. The Skill
 * tool takes `skill`, the Agent tool takes `prompt`, and a harness may rename either; a
 * check pinned to a field name would start returning false — and a satisfaction check that
 * silently returns false blocks correct work, which gets the guard deleted.
 */
function isSatisfying(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // A skill invoked in the main thread, or handed to a subagent (CLAUDE.md rule 13).
  const content = entry.message && entry.message.content;
  if (Array.isArray(content)) {
    for (const b of content) {
      if (!b || b.type !== 'tool_use') continue;
      if (!['Skill', 'Task', 'Agent', 'SlashCommand'].includes(b.name)) continue;
      let s = '';
      try { s = JSON.stringify(b.input || {}); } catch { s = ''; }
      if (s.includes(DEBUG_SKILL)) return `${b.name} → ${DEBUG_SKILL}`;
    }
  }

  // The harness stamps the active skill onto entries produced while it is running.
  if (typeof entry.attributionSkill === 'string' && entry.attributionSkill.includes('systematic-debugging')) {
    return `attributionSkill=${entry.attributionSkill}`;
  }

  // The person typed the slash command themselves.
  if (entry.type === 'user' && typeof content === 'string' && content.includes(DEBUG_SKILL)) {
    return 'user ran the slash command';
  }
  return null;
}

/** Assistant prose from one entry, for the hedge report. */
function assistantText(entry) {
  if (!entry || entry.type !== 'assistant') return '';
  const c = entry.message && entry.message.content;
  if (typeof c === 'string') return c;
  if (!Array.isArray(c)) return '';
  return c.filter((b) => b && b.type === 'text').map((b) => b.text || '').join('\n');
}

/**
 * Walk the transcript for everything that happened at or after `sinceIso`.
 * `lines` is the raw JSONL; a corrupt line is skipped, never fatal — a transcript this
 * gate cannot fully parse must not become a reason to trap the session.
 */
function scanTranscript(lines, sinceIso) {
  const since = ts(sinceIso);
  const out = { satisfied: null, at: null, hedges: [] };
  for (const line of lines) {
    const s = String(line).trim();
    if (!s) continue;
    let d;
    try { d = JSON.parse(s); } catch { continue; }
    const when = ts(d.timestamp);
    if (since !== null && when !== null && when < since) continue;

    if (!out.satisfied) {
      const how = isSatisfying(d);
      if (how) { out.satisfied = how; out.at = d.timestamp || null; }
    }
    for (const h of detectHedges(assistantText(d))) {
      if (!out.hedges.includes(h)) out.hedges.push(h);
    }
  }
  return out;
}

/**
 * The verdict. Pure, so the test pins the decision itself and not a rendering of it.
 *
 *   'clean'     nothing armed, or the skill ran
 *   'dismissed' the arm was recorded as a false positive, with a written reason
 *   'block'     armed, unsatisfied, and the turn is trying to end
 */
function decide(state, scan) {
  if (!state || !state.armed_at) return { verdict: 'clean', reason: 'ไม่มีการตรวจสอบที่ติดธงไว้' };
  if (state.dismissed_reason) {
    return { verdict: 'dismissed', reason: state.dismissed_reason, hits: state.hits || [] };
  }
  if (scan && scan.satisfied) {
    return { verdict: 'clean', reason: scan.satisfied, at: scan.at, hedges: (scan.hedges || []) };
  }
  return {
    verdict: 'block',
    reason: `prompt เข้าข่ายการตรวจสอบปัญหา (${(state.hits || []).join(' · ') || 'ไม่ระบุ'}) แต่ยังไม่มีการเรียก ${DEBUG_SKILL}`,
    hits: state.hits || [],
    armed_at: state.armed_at,
    hedges: (scan && scan.hedges) || [],
  };
}

module.exports = {
  DEBUG_SKILL, INTENT, HEDGE, VERDICT_VOCAB, verdictContext,
  detectIntent, detectHedges, isSatisfying, assistantText, scanTranscript, decide,
};
