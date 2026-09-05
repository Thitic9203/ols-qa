#!/usr/bin/env node
'use strict';

/* Pins the investigation rules — the layer that keeps the other three from decaying.
 *
 * Two failure modes are pinned here, and the second one matters more:
 *   1. the guard stops guarding  (a problem prompt no longer arms, a missing skill no
 *      longer blocks, an override appears)
 *   2. the guard starts over-guarding  (ordinary QA prompts arm, every turn gets refused)
 * The second is how a real guard dies. PM-010: an alert that fires on healthy data is how
 * a real alert gets trained into noise. So the "does NOT arm" cases below are not padding
 * — they are the contract that lets this thing survive past its first week.
 *
 *   node tools/investigation-guard/investigation_rules.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./investigation_rules');

const ROOT = path.join(__dirname, '..', '..');
let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const T0 = '2026-09-05T10:00:00.000Z';
const AFTER = '2026-09-05T10:05:00.000Z';
const BEFORE = '2026-09-05T09:00:00.000Z';

function entry(ts, block, extra = {}) {
  return JSON.stringify({ type: 'assistant', timestamp: ts, message: { content: [block] }, ...extra });
}
function skillCall(name, input) {
  return { type: 'tool_use', id: 'x', name, input };
}

// ── intent: what must arm ───────────────────────────────────────────────────────

check('a problem-shaped prompt arms, in Thai and in English', () => {
  for (const p of [
    'ทำไม job นี้ fail ตลอด',
    'หน้านี้พังตั้งแต่เมื่อวาน',
    'ช่วยหาสาเหตุที่ยอดไม่ตรงหน่อย',
    'ตรวจสอบปัญหาที่ผู้ใช้แจ้งมา',
    'sync ค้างมา 3 วันแล้ว',
    'ผลไม่ตรงกับที่คาดไว้',
    'the deploy keeps failing',
    'why is the mirror not updating',
    'got a traceback on startup',
    'this button does not work',
  ]) assert.ok(R.detectIntent(p).armed, `ไม่ติดธงทั้งที่ควรติด: "${p}"`);
});

// ── intent: what must NOT arm (the survival contract) ───────────────────────────

check('ordinary QA work does NOT arm — "ตรวจสอบ" alone is not a problem signal', () => {
  for (const p of [
    'ช่วยตรวจสอบ TC 3 เคสนี้ให้หน่อย',
    'รีวิว test case ชุดนี้ที',
    'อัปเดตผลลง sheet ให้หน่อย',
    'เขียน retest comment ของ ticket นี้',
    'สรุปงานวันนี้ให้หน่อย',
    'สร้าง test data 5 ชิ้นบน pre-prod',
    'เพิ่มคอลัมน์ใน tracking sheet',
    'ตรวจสอบว่า cover ครบทุกชิ้นไหม',
  ]) assert.ok(!R.detectIntent(p).armed, `ติดธงทั้งที่ไม่ควรติด: "${p}" (hits: ${R.detectIntent(p).hits})`);
});

check('verdict vocabulary is data, not a problem report — it must not arm', () => {
  // The exact prompt that armed the guard wrongly on 2026-09-05. PASSED / FAILED / BLOCKED /
  // REVIEWING are the values this workspace records results in; they appear in nearly every
  // result table, sheet and report. Reading them as "something broke" would arm the guard on
  // ordinary QA reporting, which is how a guard gets switched off.
  const real = 'ใน md file มีตารางแรกสุดเป็น \n\ntab name | passed | failed| reviewing \n\nบอกว่า แต่ละ tab รีวิว passed หรือ failed เท่าไหร่แล้วเช่น 35 % (30)';
  assert.strictEqual(R.detectIntent(real).armed, false, `ยังติดธงผิด: ${JSON.stringify(R.detectIntent(real).hits)}`);
  for (const p of [
    'tab name | passed | failed | reviewing',
    'สรุปให้หน่อย passed 30 failed 5 blocked 2',
    'คอลัมน์ Test Status มีค่า PASSED FAILED BLOCKED SKIPPED',
    'ช่วยนับ passed กับ failed ต่อแท็บ',
  ]) assert.strictEqual(R.detectIntent(p).armed, false, `ติดธงผิด: "${p}"`);
});

check('one failure word on its own still arms — suppression needs verdict COMPANY', () => {
  // "the build failed" is a report of a failure; "passed / failed / blocked" is a column set.
  // The difference is company, so the threshold is two distinct status words, never one.
  for (const p of [
    'the build failed yesterday',
    'job นี้ failed ตั้งแต่เมื่อวาน',
    'the deploy keeps failing',
    'ทำไม test นี้ fail ตลอด',
    'มี failure ตอน startup',
    'เทสต์ตัวนี้ flaky',
  ]) assert.ok(R.detectIntent(p).armed, `ไม่ติดธงทั้งที่ควรติด: "${p}"`);
});

check('suppression touches the verdict signal only — every other signal still arms', () => {
  const p = 'ทำไม passed 30 failed 5 ถึงไม่ตรงกับที่คาด';
  const r = R.detectIntent(p);
  assert.ok(r.armed, 'สัญญาณอื่นถูกกลบไปด้วย');
  assert.ok(!r.hits.includes('เฟล'), 'สัญญาณ verdict ไม่ถูกกด');
  assert.ok(r.hits.includes('ทำไม'), 'ทำไม ต้องยังจับได้');
  // A real breakage word alongside a verdict table still arms on its own merit.
  assert.ok(R.detectIntent('ตาราง passed/failed/blocked ขึ้นมาแล้วหน้าพัง').armed);
});

check('an empty or missing prompt never arms', () => {
  for (const p of ['', null, undefined]) assert.strictEqual(R.detectIntent(p).armed, false);
});

check('the reason is always showable — arming without a named signal is impossible', () => {
  const r = R.detectIntent('ทำไม deploy ล่ม');
  assert.ok(r.hits.length > 0, 'ติดธงโดยไม่มีสัญญาณที่บอกได้ = เหตุผลที่ผู้ใช้ตรวจไม่ได้');
});

// ── satisfaction ────────────────────────────────────────────────────────────────

check('the skill satisfies whether it runs in the main thread or in a subagent', () => {
  const cases = [
    skillCall('Skill', { skill: R.DEBUG_SKILL }),
    skillCall('Task', { prompt: `invoke ${R.DEBUG_SKILL} first, then report root cause` }),
    skillCall('Agent', { prompt: `เรียก ${R.DEBUG_SKILL} ก่อน แล้วค่อยลงมือ` }),
    skillCall('SlashCommand', { command: `/${R.DEBUG_SKILL}` }),
  ];
  for (const b of cases) {
    const s = R.scanTranscript([entry(AFTER, b)], T0);
    assert.ok(s.satisfied, `ไม่นับว่าเรียกสกิลแล้ว: ${b.name}`);
  }
});

check('the harness stamp counts too, and so does the person typing the slash command', () => {
  const stamped = JSON.stringify({ type: 'assistant', timestamp: AFTER, attributionSkill: 'superpowers:systematic-debugging', message: { content: [] } });
  assert.ok(R.scanTranscript([stamped], T0).satisfied);
  const typed = JSON.stringify({ type: 'user', timestamp: AFTER, message: { content: `/${R.DEBUG_SKILL} ช่วยดูให้ที` } });
  assert.ok(R.scanTranscript([typed], T0).satisfied);
});

check('another skill does not satisfy — "เท่านั้น" means this skill', () => {
  const other = entry(AFTER, skillCall('Skill', { skill: 'superpowers:brainstorming' }));
  assert.strictEqual(R.scanTranscript([other], T0).satisfied, null);
});

check('an invocation from BEFORE the arm does not satisfy it', () => {
  const stale = entry(BEFORE, skillCall('Skill', { skill: R.DEBUG_SKILL }));
  assert.strictEqual(R.scanTranscript([stale], T0).satisfied, null,
    'ของเก่าจากปัญหาคนละเรื่องถูกนับเป็นการสืบรอบนี้');
});

check('field names are not load-bearing — a renamed input still satisfies', () => {
  const renamed = entry(AFTER, skillCall('Skill', { skillName: R.DEBUG_SKILL }));
  assert.ok(R.scanTranscript([renamed], T0).satisfied,
    'ผูกกับชื่อฟิลด์ = วันที่ harness เปลี่ยนชื่อ การ์ดจะบล็อกงานที่ถูกต้อง');
});

check('a corrupt transcript line is skipped, never fatal', () => {
  const lines = ['{not json', '', entry(AFTER, skillCall('Skill', { skill: R.DEBUG_SKILL })), 'x'];
  assert.doesNotThrow(() => R.scanTranscript(lines, T0));
  assert.ok(R.scanTranscript(lines, T0).satisfied);
});

// ── the verdict ─────────────────────────────────────────────────────────────────

check('no arm = clean; armed + satisfied = clean; armed + unsatisfied = block', () => {
  assert.strictEqual(R.decide(null, { satisfied: null }).verdict, 'clean');
  assert.strictEqual(R.decide({}, { satisfied: null }).verdict, 'clean');
  assert.strictEqual(R.decide({ armed_at: T0, hits: ['ทำไม'] }, { satisfied: 'Skill' }).verdict, 'clean');
  assert.strictEqual(R.decide({ armed_at: T0, hits: ['ทำไม'] }, { satisfied: null }).verdict, 'block');
});

check('a dismissal clears the arm only when a written reason exists', () => {
  const armed = { armed_at: T0, hits: ['error'] };
  assert.strictEqual(R.decide({ ...armed, dismissed_reason: 'แก้ typo คำว่า error' }, { satisfied: null }).verdict, 'dismissed');
  assert.strictEqual(R.decide({ ...armed, dismissed_reason: '' }, { satisfied: null }).verdict, 'block');
  assert.strictEqual(R.decide({ ...armed, dismissed_reason: null }, { satisfied: null }).verdict, 'block');
});

check('the block always names its signals — a refusal with no reason is unarguable', () => {
  const d = R.decide({ armed_at: T0, hits: ['พัง/ล่ม', 'ทำไม'] }, { satisfied: null });
  assert.ok(d.reason.includes(R.DEBUG_SKILL));
  assert.ok(d.reason.includes('พัง/ล่ม'));
  assert.strictEqual(d.armed_at, T0);
});

// ── hedges: reported, never blocking ────────────────────────────────────────────

check('hedge words are found in assistant prose', () => {
  const line = JSON.stringify({ type: 'assistant', timestamp: AFTER, message: { content: [{ type: 'text', text: 'สาเหตุน่าจะมาจาก cache ครับ' }] } });
  assert.deepStrictEqual(R.scanTranscript([line], T0).hedges, ['น่าจะ/อาจจะ/ควรจะ']);
});

check('a hedge NEVER turns a satisfied investigation into a block', () => {
  const lines = [
    entry(AFTER, skillCall('Skill', { skill: R.DEBUG_SKILL })),
    JSON.stringify({ type: 'assistant', timestamp: AFTER, message: { content: [{ type: 'text', text: 'by design ครับ likely ถูกแล้ว' }] } }),
  ];
  const scan = R.scanTranscript(lines, T0);
  assert.ok(scan.hedges.length >= 1);
  assert.strictEqual(R.decide({ armed_at: T0, hits: ['x'] }, scan).verdict, 'clean',
    'hedge กลายเป็นตัวบล็อก = การ์ดจะผิดบ่อยจนถูกปิด และพาตัวบล็อกจริงล้มไปด้วย');
});

check('a user message is never mined for hedges — only what the agent asserts', () => {
  const u = JSON.stringify({ type: 'user', timestamp: AFTER, message: { content: [{ type: 'text', text: 'มันน่าจะพังตรงไหนนะ' }] } });
  assert.deepStrictEqual(R.scanTranscript([u], T0).hedges, []);
});

// ── the layers stay wired ───────────────────────────────────────────────────────

check('all four layers exist and are wired into settings.json', () => {
  const settings = fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8');
  const s = JSON.parse(settings);
  const cmds = (ev) => (s.hooks[ev] || []).flatMap((g) => (g.hooks || []).map((h) => h.command)).join(' ');
  assert.ok(cmds('SessionStart').includes('investigation-rule.sh'), 'SessionStart ไม่ได้อ่านกฎขึ้นมาแล้ว');
  assert.ok(cmds('UserPromptSubmit').includes('investigation-rule.sh'), 'UserPromptSubmit ไม่ติดธงแล้ว');
  assert.ok(cmds('Stop').includes('investigation-gate.sh'), 'Stop ไม่บล็อกแล้ว — เหลือแต่คำเตือนที่เดินผ่านได้');
  for (const f of ['.claude/hooks/investigation-rule.sh', '.claude/hooks/investigation-gate.sh', 'tools/investigation-guard/check.js']) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} หายไป — ชั้นหนึ่งถูกถอด`);
  }
});

check('the decision lives in ONE runtime — bash delegates, it never re-implements', () => {
  const rule = fs.readFileSync(path.join(ROOT, '.claude', 'hooks', 'investigation-rule.sh'), 'utf8');
  const gate = fs.readFileSync(path.join(ROOT, '.claude', 'hooks', 'investigation-gate.sh'), 'utf8');
  assert.ok(rule.includes('check.js') && rule.includes('--arm'), 'ตัวตะโกนเลิกส่งการตัดสินให้ node');
  assert.ok(gate.includes('check.js') && gate.includes('--gate'), 'ตัวบล็อกเลิกส่งการตัดสินให้ node');
  // A second copy of the pattern list in bash is two answers waiting to disagree.
  for (const src of [rule, gate]) {
    assert.ok(!/grep -[A-Za-z]*E[A-Za-z]*q?[^\n]*(หาสาเหตุ|ทำไม|root.cause)/.test(src),
      'bash เริ่มตัดสิน intent เอง = มีกฎสองชุดที่รอวันไม่ตรงกัน');
  }
});

check('the guard has no override flag (an override that exists eventually gets used)', () => {
  const src = ['tools/investigation-guard/check.js', 'tools/investigation-guard/investigation_rules.js',
    '.claude/hooks/investigation-rule.sh', '.claude/hooks/investigation-gate.sh']
    .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  for (const bad of ['--force', 'SKIP_INVESTIGATION', 'INVESTIGATION_OK', 'no-verify', 'DISABLE_GUARD']) {
    assert.ok(!src.includes(bad), `มีทางลัด "${bad}" โผล่ขึ้นมา`);
  }
  // The one way out is recorded, and it refuses to run without a written reason.
  assert.ok(fs.readFileSync(path.join(ROOT, 'tools/investigation-guard/check.js'), 'utf8')
    .includes('--not-an-investigation'), 'ทางออกที่บันทึกไว้หายไป เหลือแต่ทางที่ต้องฝืน');
});

check('the rule is written in CLAUDE.md too, not only in code', () => {
  const md = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
  assert.ok(md.includes('superpowers:systematic-debugging'), 'CLAUDE.md ไม่ได้พูดถึงสกิลนี้แล้ว');
  assert.ok(md.includes('investigation-guard'), 'CLAUDE.md ไม่ได้ชี้ไปที่ตัวบังคับ — คนอ่านจะไม่รู้ว่ามันมีอยู่');
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
