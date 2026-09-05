#!/usr/bin/env node
'use strict';

/**
 * The investigation gate.
 *
 *   node tools/investigation-guard/check.js --arm      < hook JSON   (UserPromptSubmit)
 *   node tools/investigation-guard/check.js --gate     < hook JSON   (Stop)
 *   node tools/investigation-guard/check.js --status
 *   node tools/investigation-guard/check.js --not-an-investigation "เหตุผล"
 *
 * Exit codes:
 *   0  allow / nothing to say
 *   2  BLOCK — armed investigation, skill never invoked (stderr goes back to the agent)
 *
 * On `--gate`, exit 2 means "do not end the turn". `stop_hook_active` is honoured, so the
 * block lands once per stop attempt and can never become a session the owner cannot leave.
 * A trap gets the guard deleted; one refusal per attempt, with the state file still armed
 * so the next attempt refuses again, is the version that survives.
 */

const fs = require('fs');
const path = require('path');
const R = require('./investigation_rules');

const ROOT = path.join(__dirname, '..', '..');
const STATE_DIR = path.join(ROOT, '.claude', '.investigation-state');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}
function parse(s) { try { return JSON.parse(s); } catch { return {}; } }
function statePath(id) { return path.join(STATE_DIR, `${String(id || 'unknown').replace(/[^\w.-]/g, '_')}.json`); }
function loadState(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function saveState(p, o) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
}
/**
 * `null` = could not be read at all. `[]` = read fine and genuinely empty.
 *
 * Collapsing those two into `[]` made the gate refuse with "ยังไม่พบการเรียกสกิลนี้เลย" when the
 * real fact was that it never opened the file — a refusal whose stated reason sends the reader
 * to fix something that is not broken.
 */
function transcriptLines(p) {
  if (!p) return null;
  try { return fs.readFileSync(p, 'utf8').split('\n'); } catch { return null; }
}

/**
 * Finding 7 — state files are per-session and nothing ever removed them.
 *
 * Only SETTLED files are pruned, and only once they are old: an armed flag belonging to a
 * session still running must survive, or this becomes a way to disarm someone else's
 * investigation by waiting. Best-effort throughout — housekeeping must never break a run.
 */
function pruneState(now = Date.now()) {
  let files = [];
  try { files = fs.readdirSync(STATE_DIR).filter((f) => f.endsWith('.json')); } catch { return 0; }
  let n = 0;
  for (const f of files) {
    const fp = path.join(STATE_DIR, f);
    if (!R.prunable(loadState(fp), now)) continue;
    try { fs.unlinkSync(fp); n += 1; } catch { /* best effort */ }
  }
  return n;
}

/** UserPromptSubmit: arm on a problem-shaped prompt, and say so in full. */
function arm() {
  pruneState();
  const hook = parse(readStdin());
  const { armed, hits } = R.detectIntent(hook.prompt || '');
  if (!armed) return 0;

  const p = statePath(hook.session_id);
  const prev = loadState(p);
  const now = new Date().toISOString();

  // An arm already standing keeps its original armed_at. Pushing the timestamp forward on
  // every follow-up prompt would let an unanswered investigation quietly reset its own
  // deadline — the debt would age while the clock kept restarting.
  const keep = prev && prev.armed_at && !prev.dismissed_reason && !prev.satisfied_at;
  saveState(p, {
    armed_at: keep ? prev.armed_at : now,
    last_prompt_at: now,
    hits: keep ? Array.from(new Set([...(prev.hits || []), ...hits])) : hits,
    prompt_excerpt: String(hook.prompt || '').slice(0, 200),
    transcript_path: hook.transcript_path || (prev && prev.transcript_path) || null,
    dismissed_reason: null,
  });

  process.stdout.write(
`=== 🔴 กฎหลักของ repo: การตรวจสอบปัญหา — บังคับ ห้ามข้าม ===
prompt นี้เข้าข่ายการตรวจสอบปัญหา (สัญญาณที่จับได้: ${hits.join(' · ')})

ก่อนจะสรุป ก่อนจะแก้ ก่อนจะบอกว่าอะไรเป็นสาเหตุ ต้องทำตามนี้ครับ

  1. เรียกสกิล ${R.DEBUG_SKILL} ก่อนเป็นอย่างแรก
     - ทำในเธรดหลัก หรือส่งให้ subagent ก็ได้ แต่ prompt ของ subagent ต้องสั่งให้เรียกสกิลนี้
     - ห้ามใช้วิธีตรวจอย่างอื่นแทน ห้ามไล่เดาลองเองก่อนแล้วค่อยเรียกทีหลัง
  2. ห้ามเดา ห้ามมโน ห้ามสรุปก่อนเปิดของจริงดู
     ทุกประโยคที่พูดเหมือนเป็นข้อเท็จจริง ต้องชี้ได้ว่ามาจาก path:line ไหน หรือ output ไหน
  3. ยังไม่ได้ตรวจ = พูดว่า "ยังไม่ได้ตรวจ" แล้วไปตรวจ · ตรวจไม่ได้ = บอกว่าติดอะไร แล้วหยุดถาม
  4. ห้ามใช้คำสวยกลบช่องว่าง — น่าจะ · อาจจะ · โดยทั่วไป · by design · ตามสเปก (ที่ยังไม่ได้เปิดอ่าน)

ลำดับการทำงาน 5 ขั้น ห้ามข้ามขั้น ห้ามสลับ
  1. สืบด้วย ${R.DEBUG_SKILL} จนได้หลักฐานจริง
  2. รายงานในแชท 4 หัวข้อ — ปัญหาที่แท้จริง · สาเหตุที่แท้จริง · แนวทางแก้ไขที่ดีที่สุด
     · แนวทางป้องกันปัญหานี้และที่ใกล้เคียงไม่ให้เกิดอีก
  3. ถามเจ้าของงานว่าจะให้ลงมือแก้และป้องกันเลยไหม แล้วรอคำยืนยัน ห้ามลงมือก่อน
  4. ได้ยืนยันแล้วจึงลงมือ ตามขอบเขตที่ยืนยันเท่านั้น
  5. รีวิวละเอียดว่าสิ่งที่แก้ถูกต้องครบถ้วน และไม่ได้ทำอย่างอื่นพัง (รันชุดเทสต์ทั้งหมด)

ถ้าจบเทิร์นโดยยังไม่เคยเรียกสกิลนี้ Stop hook จะปฏิเสธไม่ให้จบ
ถ้าธงนี้ติดผิด (prompt ไม่ได้เกี่ยวกับการตรวจสอบปัญหาจริง) ให้บันทึกเหตุผลไว้ด้วยคำสั่ง
  node tools/investigation-guard/check.js --not-an-investigation "เหตุผลที่ไม่ใช่การตรวจสอบ"
`);
  return 0;
}

/** Stop: refuse to end a turn that investigated by guesswork. */
function gate() {
  const hook = parse(readStdin());
  const p = statePath(hook.session_id);
  const state = loadState(p);
  if (!state || !state.armed_at) return 0;

  const tPath = hook.transcript_path || state.transcript_path;
  const lines = transcriptLines(tPath);
  const scan = lines === null ? null : R.scanTranscript(lines, state.armed_at);
  const d = R.decide(state, scan);

  if (d.verdict === 'clean' && scan && scan.satisfied) {
    saveState(p, { ...state, satisfied_at: scan.at || new Date().toISOString(), satisfied_by: scan.satisfied });
  }

  if (d.verdict === 'clean' || d.verdict === 'dismissed') {
    if (d.hedges && d.hedges.length) {
      process.stdout.write(
`=== ⚠️  เจอคำที่ใช้กลบการเดาในคำตอบรอบนี้: ${d.hedges.join(' · ')} ===
    ไม่ได้บล็อกครับ เพราะทุกคำมีที่ใช้ถูกต้องอยู่ และ hook แยกไม่ออกว่ารอบนี้เปิดของจริงแล้วหรือยัง
    รบกวนไล่ดูอีกรอบว่าแต่ละประโยคชี้หลักฐานได้จริง ถ้าชี้ไม่ได้ให้เขียนว่า "ยังไม่ได้ตรวจ"
`);
    }
    return 0;
  }

  // Already refused once this stop cycle — say it again, but let the turn end.
  if (hook.stop_hook_active) {
    process.stdout.write(
`=== 🔴 ยังค้าง: การตรวจสอบรอบนี้ยังไม่ผ่าน ===
    ${d.reason}
    ปล่อยให้จบเทิร์นได้เพื่อไม่ให้ session ติดกับ แต่ธงยังติดอยู่และจะทวงอีกในรอบถัดไป
`);
    return 0;
  }

  if (d.verdict === 'unreadable') {
    process.stderr.write(
`ปฏิเสธการจบเทิร์น — ตรวจไม่ได้ว่าเคยเรียกสกิลหรือยัง

  สัญญาณที่ทำให้ติดธง : ${(d.hits || []).join(' · ') || 'ไม่ระบุ'}
  transcript ที่อ่าน   : ${tPath || '(ไม่มีค่า)'}
  สถานะ               : เปิดไฟล์นี้ไม่ได้ จึงพิสูจน์ไม่ได้ทั้งสองทาง

นี่ไม่ได้แปลว่าไม่เคยเรียกสกิล — แปลว่าตรวจไม่ได้ ซึ่งไม่นับว่าผ่าน
ทางออก: เรียก ${R.DEBUG_SKILL} รอบนี้ให้เห็นชัด หรือถ้าธงติดผิดให้บันทึกเหตุผลด้วย
  node tools/investigation-guard/check.js --not-an-investigation "เหตุผล"
`);
    return 2;
  }

  process.stderr.write(
`ปฏิเสธการจบเทิร์น — งานตรวจสอบปัญหายังไม่ได้ทำตามกฎหลักของ repo

  สัญญาณที่ทำให้ติดธง : ${(d.hits || []).join(' · ') || 'ไม่ระบุ'}
  ติดธงเมื่อ           : ${d.armed_at}
  สกิลที่ต้องเรียก      : ${R.DEBUG_SKILL}
  สถานะ               : ยังไม่พบการเรียกสกิลนี้เลยนับจากที่ติดธง

ต้องทำอย่างใดอย่างหนึ่งก่อนจบเทิร์นครับ
  1. เรียกสกิล ${R.DEBUG_SKILL} แล้วสืบหา root cause จริงตามขั้นตอนของสกิล
     (จะทำเองในเธรดหลัก หรือแยก subagent ให้เรียกสกิลนี้ ก็นับทั้งคู่)
  2. ถ้าธงติดผิดจริงๆ ให้บันทึกเหตุผลไว้เป็นลายลักษณ์อักษร
     node tools/investigation-guard/check.js --not-an-investigation "เหตุผล"

ห้ามข้ามด้วยการสรุปเอง — ข้อสรุปที่ไม่ได้ผ่านการสืบ คือการเดาที่ผู้ใช้แยกไม่ออกว่าเชื่อได้หรือไม่
`);
  return 2;
}

/**
 * Record an arm as a false positive. Written down, never silent.
 *
 * Finding 2 — this used to take whichever state file was modified most recently, with no idea
 * who ran it. In a worktree where concurrent sessions are the norm (they are, here), that
 * silently disarms somebody ELSE'S investigation while leaving the caller's own flag standing.
 * Proven: session BBB ran it, session AAA's flag was cleared, BBB's stayed armed.
 *
 * So the target is now named, never inferred: `--session <id>` when it is known, otherwise the
 * single armed flag if there is exactly one. Two or more and it refuses — which flag the caller
 * meant is not guessable, and guessing is the bug.
 */
function dismiss(reason, sessionId) {
  if (!reason || !reason.trim()) {
    console.error('[investigation-guard] ต้องระบุเหตุผลด้วยครับ — การยกเลิกธงแบบไม่มีเหตุผล คือการปิดการ์ดเฉยๆ');
    return 2;
  }

  if (sessionId) {
    const p = statePath(sessionId);
    const st = loadState(p);
    if (!st) {
      console.error(`[investigation-guard] ไม่มีธงของ session "${sessionId}" — ตรวจรายการด้วย --status`);
      return 2;
    }
    return writeDismissal(p, st, reason);
  }

  let entries = [];
  try {
    entries = fs.readdirSync(STATE_DIR).filter((f) => f.endsWith('.json'))
      .map((f) => ({ id: path.basename(f, '.json'), state: loadState(path.join(STATE_DIR, f)) }));
  } catch { /* no dir yet */ }

  const pick = R.pickDismissTarget(entries, null);
  if (pick.ok) {
    const fp = statePath(pick.id);
    return writeDismissal(fp, loadState(fp), reason);
  }
  if (pick.reason === 'none') {
    console.log('[investigation-guard] ไม่มีธงติดอยู่ ไม่ต้องยกเลิกอะไรครับ');
    return 0;
  }
  console.error('[investigation-guard] มีธงค้างอยู่มากกว่า 1 session — เลือกให้ชัดว่าจะยกเลิกอันไหน');
  for (const id of pick.ids) {
    const st = loadState(statePath(id)) || {};
    console.error(`    --session ${id}   (ติดธง ${st.armed_at} · ${(st.hits || []).join(',')})`);
  }
  console.error('    ยกเลิกให้เองไม่ได้ครับ เพราะเดาผิดคือไปปลดการ์ดของอีก session');
  return 2;
}

function writeDismissal(p, st, reason) {
  saveState(p, { ...st, dismissed_reason: reason.trim(), dismissed_at: new Date().toISOString() });
  console.log(`[investigation-guard] บันทึกแล้วว่าไม่ใช่การตรวจสอบปัญหา: ${reason.trim()}`);
  console.log(`    session   : ${path.basename(p, '.json')}`);
  console.log(`    ไฟล์สถานะ: ${path.relative(ROOT, p)}`);
  return 0;
}

function status() {
  let files = [];
  try { files = fs.readdirSync(STATE_DIR).filter((f) => f.endsWith('.json')); } catch { /* none */ }
  if (!files.length) { console.log('ไม่มีธงการตรวจสอบค้างอยู่'); return 0; }
  for (const f of files) {
    const st = loadState(path.join(STATE_DIR, f)) || {};
    const mark = st.dismissed_reason ? 'ยกเลิกแล้ว' : st.satisfied_at ? 'ทำครบแล้ว' : 'ยังค้าง';
    console.log(`${f}  [${mark}]  armed_at=${st.armed_at || '-'}  hits=${(st.hits || []).join(',') || '-'}`);
  }
  return 0;
}

function main() {
  const a = process.argv.slice(2);
  if (a.includes('--arm')) return arm();
  if (a.includes('--status')) return status();
  const si = a.indexOf('--session');
  const sessionId = si !== -1 ? a[si + 1] : null;
  const i = a.indexOf('--not-an-investigation');
  if (i !== -1) return dismiss(a[i + 1], sessionId);
  return gate();
}

try {
  process.exit(main());
} catch (e) {
  // A gate that cannot run is not a pass — but at Stop it must not trap the session either.
  // It says exactly what broke, loudly, and lets the turn end so the break can be fixed.
  console.error(`[investigation-guard] CANNOT RUN: ${e && e.message}`);
  console.error('    การ์ดข้อนี้ใช้การไม่ได้ชั่วคราว — ต้องแก้ก่อน ห้ามถือว่าผ่าน');
  process.exit(0);
}
