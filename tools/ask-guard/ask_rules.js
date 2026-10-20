'use strict';
/**
 * ask-guard rules — the ONE place that decides whether an AskUserQuestion call may go out.
 *
 * Root cause (docs/post-mortem/20260916-post-mortem-report-0059-…): the owner was asked three
 * times where and how to post a review into a Discord thread whose webhook and mention id they
 * had given two days earlier. Only memory/ files were searched before asking. The answer existed
 * only in a past session's transcript, which nobody searched until the owner replied
 * "เคยบอกไปแล้วนะ". Repeat of #0021 — "could not find it in memory" is not "it was never answered".
 *
 * The rule this module enforces:
 *   A question that asks the owner for a REFERENCE (thread, channel, webhook, link, id, account,
 *   env, folder, sheet, destination, token, endpoint, host) may only go out after an
 *   episodic-memory search ran in the SAME TURN. A turn starts at the last genuine user prompt
 *   in the transcript; answers to earlier popups are tool results and do not start a turn.
 *
 * Three states, never two (report #0005): "searched", "not-searched", and "unverifiable". The
 * third one refuses too, but carries an explicit, recorded way out (see check.js), because a
 * transcript this module cannot read is not evidence that a search happened.
 *
 * Nothing here reads files or the clock. check.js does the I/O and passes plain values in.
 */

const ASK_TOOL = 'AskUserQuestion';
const SEARCH_TOOL_RE = /episodic-memory__search$/;

// Each signal names a kind of reference the owner may already have given in an earlier session.
// English words use ASCII word boundaries; Thai has no spaces between words, so Thai signals are
// plain substrings chosen to be nouns that do not occur inside unrelated common words.
const SIGNALS = [
  { id: 'thread', re: /เธรด|\bthreads?\b/i },
  { id: 'channel', re: /ช่องทาง|\bchannels?\b/i },
  { id: 'webhook', re: /เว็บฮุ[กค]|\bwebhooks?\b/i },
  { id: 'destination', re: /ปลายทาง|\bdestinations?\b/i },
  { id: 'link', re: /ลิ้?ง[กค]์|\blinks?\b|\burls?\b/i },
  { id: 'id', re: /ไอดี|\bids?\b/i },
  { id: 'account', re: /บัญชี|\baccounts?\b/i },
  { id: 'env', re: /สภาพแวดล้อม|\benv\b|\benvironments?\b/i },
  { id: 'folder', re: /โฟลเดอร์|\bfolders?\b/i },
  { id: 'sheet', re: /ชี[ทต]|\b(?:spread)?sheets?\b/i },
  { id: 'token', re: /โทเค็?น|\btokens?\b/i },
  { id: 'endpoint', re: /\bendpoints?\b|\bhosts?\b/i },
];

// Fixed TC-review destination (docs/sdd/tc-review-fixed-notify-channel R5). The owner fixed the
// channel a TC review is sent to; the only question allowed is which thread. A question that asks
// WHICH group/room/channel/server is blocked outright — searching history does not unlock it,
// because the answer is already in the project config.
const WHICH_GROUP_RE =
  /(?:กลุ่ม|ห้อง|แชนแนล|ช่อง(?!ทาง)|เซิร์ฟเวอร์|เซิฟ|server|channel|guild)\s*(?:ไหน|อะไร|ใด)|\b(?:which|what)\s+(?:discord\s+)?(?:channels?|servers?|groups?|guilds?)\b/i;
const TC_REVIEW_RE = /tc[\s_-]*review|รีวิว\s*(?:เทส|test)\s*(?:เคส|case)|รีวิว\s*tc/i;

/** True when any transcript line shows the tc-review skill or its slash command in this session. */
function tcReviewRan(lines) {
  if (!Array.isArray(lines)) return false;
  for (const line of lines) {
    if (typeof line !== 'string' || !/tc-review/.test(line)) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    const parts = contentParts(o) || [];
    if (o.type === 'assistant' && parts.some((p) => p.type === 'tool_use' && p.name === 'Skill' && /tc-review/.test(String(p.input && p.input.skill)))) {
      return true;
    }
    if (o.type === 'user') {
      const c = o.message && o.message.content;
      const text = typeof c === 'string' ? c : parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n');
      if (/<command-name>\/?[\w:-]*tc-review/.test(text) || /^\s*\/[\w:-]*tc-review\b/.test(text)) return true;
    }
  }
  return false;
}

/**
 * Everything the owner reads in the popup: header, question, option labels and descriptions.
 * Returns null when the input does not have the documented shape — "cannot read the question"
 * must never collapse into "the question has no signals" (report #0002).
 */
function questionText(toolInput) {
  const qs = toolInput && toolInput.questions;
  if (!Array.isArray(qs) || qs.length === 0) return null;
  const parts = [];
  for (const q of qs) {
    if (!q || typeof q.question !== 'string') return null;
    parts.push(q.question);
    if (typeof q.header === 'string') parts.push(q.header);
    for (const o of Array.isArray(q.options) ? q.options : []) {
      if (o && typeof o.label === 'string') parts.push(o.label);
      if (o && typeof o.description === 'string') parts.push(o.description);
    }
  }
  return parts.join('\n');
}

function findSignals(text) {
  return SIGNALS.filter((s) => s.re.test(text)).map((s) => s.id);
}

function contentParts(o) {
  const c = o && o.message && o.message.content;
  return Array.isArray(c) ? c.filter((p) => p && typeof p === 'object') : null;
}

/** A line the owner (or a slash command they ran) typed — not a tool result, not injected meta. */
function isUserPrompt(o) {
  if (!o || o.type !== 'user' || o.isMeta) return false;
  const c = o.message && o.message.content;
  if (typeof c === 'string') return c.trim().length > 0;
  const parts = contentParts(o);
  if (!parts) return false;
  if (parts.some((p) => p.type === 'tool_result')) return false;
  return parts.some((p) => p.type === 'text' && typeof p.text === 'string' && p.text.trim());
}

function isSearch(o) {
  if (!o || o.type !== 'assistant') return false;
  const parts = contentParts(o);
  return !!parts && parts.some((p) => p.type === 'tool_use' && SEARCH_TOOL_RE.test(p.name || ''));
}

/**
 * Walks the transcript backwards to the start of the current turn.
 * @param {string[]} lines raw JSONL lines
 * @returns {{state: 'searched'|'not-searched'|'unverifiable', why: string, scanned: number, malformed: number}}
 */
function scanTurn(lines) {
  if (!Array.isArray(lines)) {
    return { state: 'unverifiable', why: 'no transcript lines were provided', scanned: 0, malformed: 0 };
  }
  let scanned = 0;
  let malformed = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const raw = typeof lines[i] === 'string' ? lines[i].trim() : '';
    if (!raw) continue;
    scanned++;
    let o;
    try {
      o = JSON.parse(raw);
    } catch {
      malformed++;
      continue;
    }
    if (isSearch(o)) {
      return { state: 'searched', why: 'an episodic-memory search ran in this turn', scanned, malformed };
    }
    if (isUserPrompt(o)) {
      if (malformed > 0) {
        return {
          state: 'unverifiable',
          why: `${malformed} unreadable transcript line(s) in this turn — one of them may be the search`,
          scanned,
          malformed,
        };
      }
      return { state: 'not-searched', why: 'no episodic-memory search since the last user prompt', scanned, malformed };
    }
  }
  return {
    state: 'unverifiable',
    why: scanned === 0 ? 'the transcript is empty' : 'no user prompt found in the transcript',
    scanned,
    malformed,
  };
}

/**
 * @param {{toolName: string, toolInput: object, transcriptLines: string[]|null, override: {fresh: boolean}|null}} ctx
 * @returns {{decision: 'allow'|'deny', state: string, signals: string[], why: string, consumeOverride?: boolean}}
 */
function decide(ctx) {
  const toolName = ctx && ctx.toolName;
  if (toolName !== ASK_TOOL) {
    return { decision: 'allow', state: 'not-ask', signals: [], why: `tool is ${toolName || 'unknown'}` };
  }
  const text = questionText(ctx.toolInput);
  if (text === null) {
    return {
      decision: 'deny',
      state: 'unverifiable',
      signals: [],
      why: 'AskUserQuestion input does not have the expected questions[] shape, so the guard cannot read it',
    };
  }
  const signals = findSignals(text);
  const whichGroup = WHICH_GROUP_RE.test(text);
  if (whichGroup && (TC_REVIEW_RE.test(text) || tcReviewRan(ctx.transcriptLines))) {
    return {
      decision: 'deny',
      state: 'fixed-destination',
      signals: [...signals, 'group'],
      why: 'the TC-review notify channel is fixed in the project config — only the thread may be asked',
    };
  }
  if (signals.length === 0) {
    // A which-group question needs the transcript (did tc-review run?) before it can be allowed,
    // so it must not report "no-signal", which check.js allows without reading the transcript.
    if (whichGroup) {
      return { decision: 'allow', state: 'group-unrelated', signals, why: 'which-group question outside TC review' };
    }
    return { decision: 'allow', state: 'no-signal', signals, why: 'the question asks for no reference' };
  }
  const turn = scanTurn(ctx.transcriptLines);
  if (turn.state === 'searched') {
    return { decision: 'allow', state: turn.state, signals, why: turn.why };
  }
  if (turn.state === 'unverifiable' && ctx.override && ctx.override.fresh) {
    return {
      decision: 'allow',
      state: 'unverifiable-override',
      signals,
      why: `${turn.why}; allowed once by a recorded override`,
      consumeOverride: true,
    };
  }
  return { decision: 'deny', state: turn.state, signals, why: turn.why };
}

function denyMessage(result) {
  if (result.state === 'fixed-destination') {
    return (
      '[ask-guard] บล็อกคำถามนี้ — ห้องส่งโนติผล TC review ถูกกำหนดตายตัวแล้ว ห้ามถามว่าส่งกลุ่ม/ห้อง/channel ไหน\n\n' +
      'ห้องอยู่ใน config ของโปรเจกต์ (หัวข้อ TC review notify ใน project guide → ค่าจริงใน local secrets)\n' +
      '  · ถามได้เพียงข้อเดียว: จะให้ส่งใน "เธรด" ไหนของห้องนั้น\n' +
      '  · config ไม่มีห้อง = หยุด Step 5 และแจ้งว่า config ขาด ห้ามถามหาห้องแทน\n' +
      'ที่มา: docs/sdd/tc-review-fixed-notify-channel/spec.md R2–R5'
    );
  }
  const found = result.signals.length ? result.signals.join(', ') : '—';
  const head =
    `[ask-guard] บล็อกคำถามนี้ไว้ก่อน — คำถามขอข้อมูลอ้างอิงจากเจ้าของงาน (พบ: ${found}) ` +
    `แต่ ${result.why}\n\n` +
    'ตาม post-mortem #0059: ข้อมูลที่เจ้าของงานเคยให้ในเซสชันก่อน (ลิงก์ · webhook · ID · บัญชี · env) ' +
    'มักไม่เคยถูกบันทึกเป็นไฟล์ memory — ต้องค้นประวัติการสนทนาก่อนถามทุกครั้ง\n\n';
  if (result.state === 'unverifiable') {
    return (
      head +
      'ตัวการ์ดอ่านบันทึกเซสชันของเทิร์นนี้ไม่ได้ จึงยืนยันไม่ได้ว่าค้นแล้ว:\n' +
      '  1) ค้น mcp__plugin_episodic-memory_episodic-memory__search ด้วยตัวระบุที่เกี่ยวข้องก่อน\n' +
      '  2) ถ้ายังถูกบล็อก แปลว่าการ์ดอ่านบันทึกไม่ได้จริง ให้บันทึกเหตุผลแล้วค่อยถาม:\n' +
      '     node tools/ask-guard/check.js --unverifiable-ok "<ค้นอะไรไปแล้ว ได้ผลอะไร>"\n' +
      '  และแจ้งเจ้าของงานว่า ask-guard อ่านบันทึกเซสชันไม่ได้'
    );
  }
  return (
    head +
    'ก่อนถามอีกครั้ง: ค้น mcp__plugin_episodic-memory_episodic-memory__search ด้วยตัวระบุที่เพิ่งได้รับ ' +
    '(ลิงก์ · ID · ticket key · ชื่อเธรด)\n' +
    '  · เจอคำตอบ = ใช้เลย ไม่ต้องถาม และยกขึ้นเป็นไฟล์ memory ในเทิร์นนี้\n' +
    '  · ไม่เจอ = ถามได้ และบอกในคำถามว่าค้นอะไรไปแล้ว'
  );
}

module.exports = {
  ASK_TOOL,
  SEARCH_TOOL_RE,
  SIGNALS,
  questionText,
  findSignals,
  isUserPrompt,
  isSearch,
  scanTurn,
  decide,
  denyMessage,
  WHICH_GROUP_RE,
  TC_REVIEW_RE,
  tcReviewRan,
};
