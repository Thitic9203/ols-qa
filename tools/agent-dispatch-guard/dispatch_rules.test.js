#!/usr/bin/env node
'use strict';

/**
 * Tests for the agent-dispatch guard.
 *
 * The suite counts what it ran and refuses on zero (#0010, #0012 — a harness
 * that prints "all green" over zero tests is the bug those reports are about).
 *
 * It includes cases that touch REAL FILES on disk (#0002 — every suite needs at
 * least one case that is not hand-made data), and cases that run the guard in
 * the shape the hook actually delivers.
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rules = require('./dispatch_rules.js');

const CHECK = path.join(__dirname, 'check.js');
const tests = [];
function t(name, fn) {
  tests.push([name, fn]);
}

/** Run check.js with a payload on stdin; returns { code, out, err }. */
function runCheck(stdin, args) {
  try {
    const out = execFileSync(process.execPath, [CHECK].concat(args || []), {
      input: stdin === null ? undefined : stdin,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, out, err: '' };
  } catch (err) {
    return {
      code: typeof err.status === 'number' ? err.status : -1,
      out: err.stdout || '',
      err: err.stderr || '',
    };
  }
}

const GOOD_BRIEF = [
  'Check 12 cases on pre-prod.',
  'Append one JSON line per case to out/round-9/lane1.jsonl before calling the next tool.',
  'Do not hold results in your head.',
].join('\n');

const BAD_BRIEF = [
  'Check the cases on pre-prod.',
  'Report everything back to me when you are finished.',
].join('\n');

// ---------------------------------------------------------------- rules layer

t('a brief that names a file, a write verb and a per-case cadence passes', () => {
  const r = rules.assessBrief(GOOD_BRIEF);
  assert.strictEqual(r.ok, true);
  assert.ok(r.checks >= 3, 'must report the number of checks it ran');
  assert.strictEqual(
    r.findings.filter((f) => f.severity === rules.SEVERITY.BLOCK).length,
    0
  );
});

t('a brief with no persistence contract is BLOCKED', () => {
  const r = rules.assessBrief(BAD_BRIEF);
  assert.strictEqual(r.ok, false);
  const codes = r.findings.map((f) => f.code);
  assert.ok(codes.includes('NO_PERSIST_CONTRACT'), 'expected NO_PERSIST_CONTRACT, got ' + codes);
});

t('the canonical marker alone satisfies the persistence rule', () => {
  const r = rules.assessBrief('Do the work. ' + rules.PERSIST_MARKER);
  assert.strictEqual(r.ok, true);
});

t('"write your results at the end" does NOT satisfy the rule', () => {
  // This is the exact brief whose results are lost, so it must not pass.
  const r = rules.assessBrief(
    'Do the work and write your results to out/x.jsonl at the end of the run.'
  );
  assert.strictEqual(r.ok, false, 'an end-of-run write is not a persistence contract');
});

t('naming a cadence without naming a file does NOT satisfy the rule', () => {
  const r = rules.assessBrief('Write down what you find after each case.');
  assert.strictEqual(r.ok, false);
});

t('a Thai brief with file, verb and cadence passes', () => {
  const r = rules.assessBrief(
    'ตรวจ 10 เคส แล้วเขียนผลลง out/rnd/lane2.jsonl ทุกเคส ก่อนเรียกเครื่องมือตัวถัดไป'
  );
  assert.strictEqual(r.ok, true);
});

t('screenshots with no file-handling are a NOTE, never a BLOCK', () => {
  const r = rules.assessBrief(GOOD_BRIEF + '\nTake a screenshot of each page.');
  const f = r.findings.find((x) => x.code === 'SCREENSHOT_INTO_CONTEXT');
  assert.ok(f, 'expected the screenshot note');
  assert.strictEqual(f.severity, rules.SEVERITY.NOTE);
  assert.strictEqual(r.ok, true, 'a note must not block — a guard that over-blocks gets disabled');
});

t('screenshots saved to a file raise no note', () => {
  const r = rules.assessBrief(
    GOOD_BRIEF + '\nTake a screenshot with filename out/shot.png and read it with ctx_execute_file.'
  );
  assert.ok(!r.findings.some((f) => f.code === 'SCREENSHOT_INTO_CONTEXT'));
});

t('an unbounded sweep is a NOTE; a bounded one is not flagged', () => {
  // The persistence half is satisfied by the marker so this case carries no
  // digits of its own — otherwise the count in GOOD_BRIEF ("12 cases") is
  // itself the stated bound and the case would test nothing.
  const base = rules.PERSIST_MARKER + '\n';
  const loose = rules.assessBrief(base + 'Go through every transcript on the machine.');
  assert.ok(
    loose.findings.some((f) => f.code === 'UNBOUNDED_SCAN'),
    'an unbounded sweep must be reported'
  );
  assert.strictEqual(loose.ok, true, 'it is a note, not a block');

  const bounded = rules.assessBrief(base + 'Go through 40 transcripts, no more than 40.');
  assert.ok(!bounded.findings.some((f) => f.code === 'UNBOUNDED_SCAN'));
});

t('a non-string brief throws — "cannot check" is not "clean"', () => {
  assert.throws(() => rules.assessBrief(null), TypeError);
  assert.throws(() => rules.assessBrief(undefined), TypeError);
  assert.throws(() => rules.assessBrief({ prompt: 'x' }), TypeError);
});

t('every assessment reports a non-zero check count', () => {
  for (const brief of [GOOD_BRIEF, BAD_BRIEF, 'x']) {
    const r = rules.assessBrief(brief);
    assert.ok(r.checks > 0, 'zero checks must never be reported as a result');
  }
});

t('the rendered report always states how many checks ran', () => {
  for (const brief of [GOOD_BRIEF, BAD_BRIEF]) {
    const text = rules.formatAssessment(rules.assessBrief(brief));
    assert.ok(/check\(s\)/.test(text), 'report must carry the check count: ' + text);
  }
});

// ------------------------------------------- proxy preload (#0121) rules layer

// The incident's env line, placeholders only (repo is public).
const PERSIST_LINE = 'Append one JSON line per case to out/round-9/laneE.jsonl before calling the next tool.';
const INCIDENT_BRIEF = [
  'Env: training69 only (OLS=<T69_OLS>). Every node run needs',
  'PW_PROXY=http://127.0.0.1:18723 NODE_EXTRA_CA_CERTS=<CA_BUNDLE> HANDS_OFF_EXCEPTION="<reason>" HANDS_OFF_EXCEPTION_TARGET=$OLS.',
  'Verify with capture/session_verify.js (same env as above).',
  PERSIST_LINE,
].join('\n');

t('#0121 incident brief (session_verify + PW_PROXY, no preload) is BLOCKED', () => {
  const r = rules.assessBrief(INCIDENT_BRIEF);
  assert.strictEqual(r.ok, false, 'must block');
  assert.ok(r.findings.some((f) => f.code === 'PROXY_PRELOAD_MISSING' && f.severity === rules.SEVERITY.BLOCK),
    'expected PROXY_PRELOAD_MISSING BLOCK, got ' + r.findings.map((f) => f.code));
  assert.ok(r.checks >= 4, 'the preload check must be counted');
});

t('#0121 same brief WITH NODE_OPTIONS --require pw_proxy_preload.js passes', () => {
  const text = INCIDENT_BRIEF + '\nNODE_OPTIONS="--require <BOT>/out/round/pw_proxy_preload.js"';
  const r = rules.assessBrief(text);
  assert.ok(!r.findings.some((f) => f.code === 'PROXY_PRELOAD_MISSING'), 'must not flag: ' + rules.formatAssessment(r));
  assert.strictEqual(r.ok, true);
});

t('#0121 same brief pointing at capture/t69_env.sh passes', () => {
  const text = INCIDENT_BRIEF + '\nRun it as: HANDS_OFF_EXCEPTION="<reason>" bash capture/t69_env.sh node capture/session_verify.js <tags>';
  const r = rules.assessBrief(text);
  assert.ok(!r.findings.some((f) => f.code === 'PROXY_PRELOAD_MISSING'), 'must not flag: ' + rules.formatAssessment(r));
});

t('#0121 training69 + session_capture.js with no proxy words at all is BLOCKED', () => {
  const text = 'Re-login tc9021 on training69 with capture/session_capture.js.\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.ok(r.findings.some((f) => f.code === 'PROXY_PRELOAD_MISSING'), 'expected a block: ' + rules.formatAssessment(r));
});

t('#0121 session_verify on pre-prod (no training69, no PW_PROXY) is not flagged', () => {
  const text = 'Verify the 4 pre-prod sessions with capture/session_verify.js.\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.ok(!r.findings.some((f) => f.code === 'PROXY_PRELOAD_MISSING'), 'false positive: ' + rules.formatAssessment(r));
});

t('#0121 training69 recording brief without session tools is not flagged', () => {
  const text = 'Record Profile_TC_004 on training69 with capture/qa_recorder.js, PW_PROXY=http://127.0.0.1:18723.\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.ok(!r.findings.some((f) => f.code === 'PROXY_PRELOAD_MISSING'), 'false positive: ' + rules.formatAssessment(r));
});

// ----------------------------------------------------------------- hook layer

t('hook payload: a good brief exits 0', () => {
  const payload = JSON.stringify({ tool_name: 'Agent', tool_input: { prompt: GOOD_BRIEF } });
  const r = runCheck(payload);
  assert.strictEqual(r.code, 0, r.err || r.out);
});

t('hook payload: a brief with no contract exits 2 and says why', () => {
  const payload = JSON.stringify({ tool_name: 'Agent', tool_input: { prompt: BAD_BRIEF } });
  const r = runCheck(payload);
  assert.strictEqual(r.code, 2, 'must refuse');
  assert.ok(/NO_PERSIST_CONTRACT/.test(r.err), 'must name the finding: ' + r.err);
  assert.ok(/fix:/.test(r.err), 'a refusal must state the fix');
});

t('hook payload: #0121 incident brief exits 2 naming PROXY_PRELOAD_MISSING', () => {
  const payload = JSON.stringify({ tool_name: 'Agent', tool_input: { prompt: INCIDENT_BRIEF } });
  const r = runCheck(payload);
  assert.strictEqual(r.code, 2, 'must refuse');
  assert.ok(/PROXY_PRELOAD_MISSING/.test(r.err), 'must name the finding: ' + r.err);
});

t('hook payload: a different tool is left alone', () => {
  const payload = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } });
  assert.strictEqual(runCheck(payload).code, 0);
});

t('hook payload: unparseable stdin is REFUSED, not allowed', () => {
  const r = runCheck('this is not json');
  assert.strictEqual(r.code, 2, 'cannot check must refuse');
  assert.ok(/refus/i.test(r.err), r.err);
});

t('hook payload: an Agent call with no prompt is REFUSED', () => {
  const payload = JSON.stringify({ tool_name: 'Agent', tool_input: { description: 'x' } });
  const r = runCheck(payload);
  assert.strictEqual(r.code, 2);
});

t('hook payload: empty stdin is REFUSED', () => {
  const r = runCheck('');
  assert.strictEqual(r.code, 2);
});

t('--explain prints the contract and exits 0', () => {
  const r = runCheck('', ['--explain']);
  assert.strictEqual(r.code, 0);
  assert.ok(r.out.includes(rules.PERSIST_MARKER), 'explain must name the marker');
});

// ------------------------------------------------- real files, not fixtures

t('--file reads a real brief off disk and judges it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-guard-'));
  try {
    const good = path.join(dir, 'good.md');
    const bad = path.join(dir, 'bad.md');
    fs.writeFileSync(good, GOOD_BRIEF);
    fs.writeFileSync(bad, BAD_BRIEF);
    assert.strictEqual(runCheck(null, ['--file', good]).code, 0);
    assert.strictEqual(runCheck(null, ['--file', bad]).code, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

t('--file on a path that does not exist is REFUSED, not passed', () => {
  const r = runCheck(null, ['--file', path.join(os.tmpdir(), 'no-such-brief-' + Date.now() + '.md')]);
  assert.strictEqual(r.code, 2);
});

t('this repo really carries the rules module and the guard it claims to', () => {
  // Touches the actual tree, so a deletion or rename fails the suite rather
  // than leaving a guard that nobody notices is gone (#0002).
  for (const f of ['dispatch_rules.js', 'check.js']) {
    const p = path.join(__dirname, f);
    assert.ok(fs.existsSync(p), 'missing ' + p);
    assert.ok(fs.statSync(p).size > 0, 'empty ' + p);
  }
});

t('check.js holds no rule of its own — the decision lives in one module', () => {
  // #0003: two runtimes holding the same rules are two answers waiting to
  // disagree. check.js may parse the payload; it may not judge the brief.
  const src = fs.readFileSync(CHECK, 'utf8');
  for (const token of ['PERSIST-BEFORE-PRINT', 'screenshot', 'ทุกเคส']) {
    const inRegex = new RegExp('/[^\\n]*' + token.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&') + '[^\\n]*/[gimsuy]*');
    assert.ok(
      !inRegex.test(src),
      'check.js must not carry its own matching rule for ' + token
    );
  }
});

// PM-2026-09-24-11: brief sent the agent to the owner's secrets store; a grep filter slipped
// and printed a password line into the session.
t('PM-2026-09-24-11 incident wording (grep the secrets store) is BLOCKED', () => {
  const text = 'Account list: grep `~/.ols-qa-secrets/ols-secrets.md` for training69; never print passwords.\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.strictEqual(r.ok, false, 'must block');
  assert.ok(r.findings.some((f) => f.code === 'SECRETS_STORE_IN_BRIEF' && f.severity === rules.SEVERITY.BLOCK),
    'expected SECRETS_STORE_IN_BRIEF, got ' + r.findings.map((f) => f.code));
  assert.ok(r.checks >= 5, 'the secrets check must be counted');
});

t('PM-2026-09-24-11 brief using the password-free account list passes', () => {
  const text = 'Accounts: read <BOT>/capture/accounts_training69.json (email/env/role_ols/row/tag).\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.ok(!r.findings.some((f) => f.code === 'SECRETS_STORE_IN_BRIEF'), 'must not flag: ' + rules.formatAssessment(r));
  assert.strictEqual(r.ok, true);
});

t('PM-2026-09-24-14 incident wording (prefill email, no read-back) is BLOCKED', () => {
  const text = 'Open a HEADED browser window on the NDLP sign-in page and prefill ONLY the email. Wait for the owner.\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.strictEqual(r.ok, false, 'must block');
  assert.ok(r.findings.some((f) => f.code === 'EMAIL_PREFILL_WITHOUT_READBACK'), 'got ' + r.findings.map((f) => f.code));
  assert.ok(r.checks >= 6, 'the email check must be counted');
});

t('PM-2026-09-24-14 same brief demanding an inputValue read-back passes', () => {
  const text = 'Prefill ONLY the email, then read back the input value and log EMAIL_READY only if it matches.\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.ok(!r.findings.some((f) => f.code === 'EMAIL_PREFILL_WITHOUT_READBACK'), 'must not flag: ' + rules.formatAssessment(r));
  assert.strictEqual(r.ok, true);
});

t('PM-2026-09-24-14 real brief shape (prefill + relogin_t69.js named elsewhere) is still BLOCKED', () => {
  const text = 'Open a HEADED browser window on the NDLP training69 sign-in page with newNdlpCtx/waitOwnerLogin, and prefill ONLY the email.\n' +
    '4. After saving, check OLS read-only: run relogin_t69.js with TAG=st9020, EMAIL prefilled only.\n' + PERSIST_LINE;
  const r = rules.assessBrief(text);
  assert.ok(r.findings.some((f) => f.code === 'EMAIL_PREFILL_WITHOUT_READBACK'), 'naming a helper must not excuse the missing proof');
});

// ------------------------------------------------------------------- harness

let failed = 0;
let ran = 0;
for (const [name, fn] of tests) {
  ran += 1;
  try {
    fn();
    console.log('ok   ' + name);
  } catch (err) {
    failed += 1;
    console.log('FAIL ' + name);
    console.log('       ' + (err && err.message ? err.message : String(err)));
  }
}

if (ran === 0) {
  console.error('dispatch_rules.test.js: ran 0 tests — refusing (a suite that measured nothing is not green)');
  process.exit(2);
}
console.log('\n' + (failed ? failed + ' failed' : 'all green') + ' — ' + ran + ' test(s) ran');
process.exit(failed ? 1 : 0);
