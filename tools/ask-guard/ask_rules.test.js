#!/usr/bin/env node
'use strict';
/**
 * Pins tools/ask-guard: the signal list, the turn scan, the decision, the on-disk gate, the bash
 * relay, and the wiring in .claude/settings.json.
 *
 *   node tools/ask-guard/ask_rules.test.js
 *
 * Exit 0 only if tests ran AND all passed. Zero tests run is a refusal, not a pass (reports #0006,
 * #0010, #0012).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const rules = require('./ask_rules');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..');
const CHECK = path.join(HERE, 'check.js');
const HOOK = path.join(REPO, '.claude', 'hooks', 'ask-guard.sh');

let ran = 0;
let failed = 0;
function ok(name, cond, extra) {
  ran++;
  if (cond) process.stdout.write(`  ok   ${name}\n`);
  else {
    failed++;
    process.stdout.write(`  FAIL ${name}${extra ? ` — ${extra}` : ''}\n`);
  }
}

// ---- transcript line builders (shapes measured from a live Claude Code session log) ----
const prompt = (text) => JSON.stringify({ type: 'user', message: { role: 'user', content: text } });
const promptList = (text) =>
  JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } });
const meta = (text) => JSON.stringify({ type: 'user', isMeta: true, message: { role: 'user', content: text } });
const toolResult = (text) =>
  JSON.stringify({
    type: 'user',
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: text }] },
  });
const toolUse = (name) =>
  JSON.stringify({
    type: 'assistant',
    message: { role: 'assistant', content: [{ type: 'thinking' }, { type: 'tool_use', id: 't1', name, input: {} }] },
  });
const attachment = () => JSON.stringify({ type: 'attachment' });
const SEARCH = 'mcp__plugin_episodic-memory_episodic-memory__search';

const ask = (question, header = 'h', options = []) => ({
  questions: [{ question, header, multiSelect: false, options }],
});

// ============================================================ signals
{
  const positives = [
    ['"เธรดเดิม" ที่ให้ส่งผลรีวิวเข้าไป หมายถึงที่ไหนครับ', 'thread'],
    ['จะส่งเข้าเธรดนั้นทางไหนครับ', 'thread'],
    ['รบกวนวางลิงก์ของข้อความโนติเดิมในช่อง Other ครับ', 'link'],
    ['ใช้ลิ้งค์ไหนครับ', 'link'],
    ['เทสด้วยบัญชีไหนครับ', 'account'],
    ['เทส env ไหนครับ — dev หรือ pre-prod', 'env'],
    ['ต้องใช้ Discord ID ของ QA', 'id'],
    ['ให้ webhook ของช่องนั้นมา', 'webhook'],
    ['อัปโหลดเข้าโฟลเดอร์ไหนครับ', 'folder'],
    ['เขียนผลลงชีทไหนครับ', 'sheet'],
    ['Which Slack channel should this go to?', 'channel'],
    ['Paste the URL of the target page', 'link'],
    ['Where is the API endpoint?', 'endpoint'],
  ];
  for (const [text, id] of positives) {
    const got = rules.findSignals(text);
    ok(`signal "${id}" found in: ${text}`, got.includes(id), `got [${got}]`);
  }
  const negatives = [
    'จะให้ลงมือแก้ไหมครับ',
    'เลือกแนวทางไหนดีครับ',
    'ยืนยันให้ส่งผลรีวิวไหมครับ',
    'Should I fix the failing test first?',
    'Is this a valid approach?',
    'Run against localhost only?',
  ];
  for (const text of negatives) {
    const got = rules.findSignals(text);
    ok(`no signal in: ${text}`, got.length === 0, `got [${got}]`);
  }
}

// ============================================================ questionText
{
  const t = rules.questionText(
    ask('จะส่งทางไหนครับ', 'ช่องทางส่ง', [{ label: 'โพสต์เอง', description: 'วาง URL ของ webhook' }]),
  );
  ok('questionText includes header, labels and descriptions', /ช่องทางส่ง/.test(t) && /โพสต์เอง/.test(t) && /webhook/.test(t));
  ok('questionText returns null for a missing questions array', rules.questionText({}) === null);
  ok('questionText returns null for an empty questions array', rules.questionText({ questions: [] }) === null);
  ok('questionText returns null when a question is not a string', rules.questionText({ questions: [{ question: 5 }] }) === null);
}

// ============================================================ scanTurn
{
  const s = (lines) => rules.scanTurn(lines).state;
  ok('search after the last prompt → searched', s([prompt('go'), toolUse(SEARCH), toolResult('r')]) === 'searched');
  ok('search only in an earlier turn → not-searched', s([prompt('a'), toolUse(SEARCH), prompt('b'), toolUse('Bash')]) === 'not-searched');
  ok('prompt with list content is a turn boundary', s([toolUse(SEARCH), promptList('[Request interrupted by user]')]) === 'not-searched');
  ok('a popup answer (tool_result) does not start a turn', s([prompt('go'), toolUse(SEARCH), toolResult('answer'), toolUse('AskUserQuestion')]) === 'searched');
  ok('injected meta user lines do not start a turn', s([prompt('go'), toolUse(SEARCH), meta('skill body'), attachment()]) === 'searched');
  ok('other tools do not count as a search', s([prompt('go'), toolUse('mcp__x__search'), toolUse('Grep')]) === 'not-searched');
  ok('a malformed line inside the turn with no search → unverifiable', s([prompt('go'), '{not json', toolUse('Bash')]) === 'unverifiable');
  ok('a malformed line does not hide a search that is readable', s([prompt('go'), toolUse(SEARCH), '{not json']) === 'searched');
  ok('empty transcript → unverifiable', s([]) === 'unverifiable');
  ok('no prompt anywhere → unverifiable', s([toolUse('Bash'), attachment()]) === 'unverifiable');
  ok('null lines → unverifiable', s(null) === 'unverifiable');
  const counted = rules.scanTurn([prompt('go'), '{bad', '', attachment()]);
  ok('scanTurn reports how many lines it read and how many it could not parse', counted.scanned === 3 && counted.malformed === 1, JSON.stringify(counted));
}

// ============================================================ decide
{
  const signalAsk = ask('รบกวนวางลิงก์ของเธรดครับ');
  const d = (over) => rules.decide({ toolName: 'AskUserQuestion', toolInput: signalAsk, transcriptLines: [], override: null, ...over });
  ok('other tools are allowed', rules.decide({ toolName: 'Bash', toolInput: {}, transcriptLines: null }).decision === 'allow');
  ok('a question with no signal is allowed without a transcript', rules.decide({ toolName: 'AskUserQuestion', toolInput: ask('จะให้แก้ไหมครับ'), transcriptLines: null }).decision === 'allow');
  ok('signal + searched this turn → allow', d({ transcriptLines: [prompt('go'), toolUse(SEARCH)] }).decision === 'allow');
  ok('signal + not searched → deny', d({ transcriptLines: [prompt('go'), toolUse('Bash')] }).decision === 'deny');
  ok('signal + unverifiable + no override → deny', d({ transcriptLines: null }).decision === 'deny');
  const withOverride = d({ transcriptLines: null, override: { fresh: true } });
  ok('signal + unverifiable + fresh override → allow once', withOverride.decision === 'allow' && withOverride.consumeOverride === true);
  ok('an override never bypasses a readable not-searched turn', d({ transcriptLines: [prompt('go')], override: { fresh: true } }).decision === 'deny');
  ok('a stale override does not allow', d({ transcriptLines: null, override: { fresh: false } }).decision === 'deny');
  ok('unreadable AskUserQuestion input → deny (unverifiable), not allow', rules.decide({ toolName: 'AskUserQuestion', toolInput: { foo: 1 }, transcriptLines: [] }).decision === 'deny');
  const msg = rules.denyMessage(d({ transcriptLines: [prompt('go')] }));
  ok('deny message names the search tool and the report', /episodic-memory__search/.test(msg) && /#0059/.test(msg));
  const msgU = rules.denyMessage(d({ transcriptLines: null }));
  ok('unverifiable deny message gives the recorded way out', /--unverifiable-ok/.test(msgU));
}

// ============================================================ incident replay (#0059)
{
  const question = ask('จะส่งเข้าเธรดนั้นทางไหนครับ', 'ช่องทางส่ง', [
    { label: 'โพสต์เอง (แนะนำ)', description: 'คัดลอกข้อความด้านบนไปวางในเธรดได้เลย' },
    { label: 'ให้ webhook ของช่องนั้นมา', description: 'วาง URL ของ webhook ที่สร้างในช่องที่เธรดนี้อยู่' },
  ]);
  const turn = [
    prompt('สนใจแค่ตาม AC EC ปรับมาใหม่ และส่งเข้าเธรดเดิม'),
    toolUse('Bash'),
    toolResult('...'),
    prompt('Need Improve ปรับใส่มาให้ครบสิ 6 ข้ออะ edit ข้อความในโนติเดิมเลย'),
    toolUse('mcp__plugin_context-mode_context-mode__ctx_execute'),
    toolResult('registry: no match'),
    toolUse('AskUserQuestion'),
    toolResult('ยังไม่มีโนติเดิม ส่งใหม่เลย'),
    toolUse('Bash'),
    toolResult('SEND FAILED http 400'),
  ];
  const r = rules.decide({ toolName: 'AskUserQuestion', toolInput: question, transcriptLines: turn, override: null });
  ok('#0059 replay: the third question is blocked', r.decision === 'deny' && r.state === 'not-searched', JSON.stringify(r));
  const after = rules.decide({ toolName: 'AskUserQuestion', toolInput: question, transcriptLines: [...turn, toolUse(SEARCH)], override: null });
  ok('#0059 replay: the same question passes once the history was searched', after.decision === 'allow');
}

// ============================================================ on disk: check.js --gate
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ask-guard-test-'));
try {
  const stateDir = path.join(TMP, 'state');
  const transcript = path.join(TMP, 'session.jsonl');
  const gate = (payload, raw) =>
    cp.spawnSync(process.execPath, [CHECK, '--gate'], {
      input: raw !== undefined ? raw : JSON.stringify(payload),
      encoding: 'utf8',
      env: { ...process.env, ASK_GUARD_STATE_DIR: stateDir },
    });
  const payload = (extra) => ({
    tool_name: 'AskUserQuestion',
    tool_input: ask('รบกวนวางลิงก์ของเธรดครับ'),
    transcript_path: transcript,
    ...extra,
  });

  fs.writeFileSync(transcript, [prompt('go'), toolUse('Bash'), ''].join('\n'));
  let r = gate(payload());
  ok('gate on disk: not searched → exit 2 with the reason on stderr', r.status === 2 && /episodic-memory__search/.test(r.stderr), `status=${r.status}`);

  fs.writeFileSync(transcript, [prompt('go'), toolUse(SEARCH), ''].join('\n'));
  r = gate(payload());
  ok('gate on disk: searched → exit 0', r.status === 0, `status=${r.status} stderr=${r.stderr}`);

  r = gate(payload({ transcript_path: path.join(TMP, 'missing.jsonl') }));
  ok('gate on disk: missing transcript → exit 2 and says it cannot read it', r.status === 2 && /cannot read transcript_path/.test(r.stderr), `status=${r.status}`);

  r = gate(null, 'not json at all');
  ok('gate on disk: unparseable payload → exit 2', r.status === 2, `status=${r.status}`);

  r = gate(payload({ tool_name: 'Bash', tool_input: { command: 'ls' } }));
  ok('gate on disk: other tool → exit 0', r.status === 0, `status=${r.status}`);

  r = gate(payload({ tool_input: ask('จะให้แก้ไหมครับ'), transcript_path: path.join(TMP, 'missing.jsonl') }));
  ok('gate on disk: no-signal question never touches the transcript → exit 0', r.status === 0, `status=${r.status}`);

  // recorded way out: refused without a reason, works once, only for an unreadable transcript
  const arm = (reason) =>
    cp.spawnSync(process.execPath, reason === null ? [CHECK, '--unverifiable-ok'] : [CHECK, '--unverifiable-ok', reason], {
      encoding: 'utf8',
      env: { ...process.env, ASK_GUARD_STATE_DIR: stateDir },
    });
  ok('--unverifiable-ok without a reason is refused', arm(null).status === 2);
  ok('--unverifiable-ok with a reason arms', arm('searched thread id, no hit').status === 0);
  r = gate(payload({ transcript_path: path.join(TMP, 'missing.jsonl') }));
  ok('override lets one unverifiable question through', r.status === 0, `status=${r.status} ${r.stderr}`);
  r = gate(payload({ transcript_path: path.join(TMP, 'missing.jsonl') }));
  ok('override is single-use', r.status === 2, `status=${r.status}`);
  arm('again');
  fs.writeFileSync(transcript, [prompt('go'), toolUse('Bash'), ''].join('\n'));
  r = gate(payload());
  ok('override does not unlock a readable, not-searched turn', r.status === 2, `status=${r.status}`);

  // ============================================================ the bash relay
  const hook = (root, input) =>
    cp.spawnSync('bash', [HOOK], {
      input,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: root, ASK_GUARD_STATE_DIR: stateDir },
    });
  const stubRoot = (body) => {
    const root = fs.mkdtempSync(path.join(TMP, 'root-'));
    if (body !== null) {
      fs.mkdirSync(path.join(root, 'tools', 'ask-guard'), { recursive: true });
      fs.writeFileSync(path.join(root, 'tools', 'ask-guard', 'check.js'), body);
    }
    return root;
  };

  r = hook(stubRoot("process.stderr.write('STUB-REASON'); process.exit(2);"), '{}');
  ok('relay: exit 2 is kept and the reason goes to stderr, not stdout', r.status === 2 && /STUB-REASON/.test(r.stderr) && !/STUB-REASON/.test(r.stdout), `status=${r.status}`);
  r = hook(stubRoot('process.exit(5);'), '{}');
  ok('relay: a crash (exit 5) allows with a warning', r.status === 0 && /ปล่อยผ่าน/.test(r.stdout), `status=${r.status}`);
  r = hook(stubRoot(null), '{}');
  ok('relay: missing check.js allows with a warning', r.status === 0 && /รันไม่ได้/.test(r.stdout), `status=${r.status}`);

  fs.writeFileSync(transcript, [prompt('go'), toolUse('Bash'), ''].join('\n'));
  r = hook(REPO, JSON.stringify(payload()));
  ok('relay + real check.js: a not-searched reference question is blocked end to end', r.status === 2 && /\[ask-guard\]/.test(r.stderr), `status=${r.status}`);
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

// ============================================================ wiring
{
  const settings = JSON.parse(fs.readFileSync(path.join(REPO, '.claude', 'settings.json'), 'utf8'));
  const pre = (settings.hooks && settings.hooks.PreToolUse) || [];
  const entry = pre.find((m) => m.matcher === 'AskUserQuestion');
  ok('settings.json wires a PreToolUse matcher for AskUserQuestion', !!entry);
  ok('that matcher runs .claude/hooks/ask-guard.sh', !!entry && entry.hooks.some((h) => /\.claude\/hooks\/ask-guard\.sh/.test(h.command || '')));
  const hookSrc = fs.existsSync(HOOK) ? fs.readFileSync(HOOK, 'utf8') : '';
  ok('the hook calls tools/ask-guard/check.js --gate', /tools\/ask-guard\/check\.js/.test(hookSrc) && /--gate/.test(hookSrc));
  ok('the hook sends a block reason to stderr', />&2/.test(hookSrc));
  const gitignore = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8');
  ok('the override state directory is git-ignored', /^\.claude\/\.ask-guard-state\/$/m.test(gitignore));
}

process.stdout.write(`\n${ran} test(s) run, ${failed} failed\n`);
if (ran === 0) {
  process.stdout.write('REFUSED: 0 tests ran\n');
  process.exit(1);
}
process.exit(failed ? 1 : 0);
