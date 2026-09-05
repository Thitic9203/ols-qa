'use strict';
/* The command-path guard — the one that stands where no library check can.
 *
 * Nine layers keep the toolkit off HI's `[RGS]` fixtures. None of them is in the way of a shell
 * command typed by hand, which is how most one-off content changes on pre-prod have actually
 * been made. `.claude/hooks/customer-content-guard.sh` sits on the Bash tool itself and sees
 * every command whatever binary path it names.
 *
 * A guard on that path has two ways to fail, and both are tested here:
 *   · it lets a real write through          → the thing it exists to prevent
 *   · it blocks ordinary work               → it gets removed within the week, and then the
 *                                             first failure mode arrives anyway
 *
 * run: node customer_hook.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HOOK = path.join(__dirname, '..', '..', '.claude', 'hooks', 'customer-content-guard.sh');
const SETTINGS = path.join(__dirname, '..', '..', '.claude', 'settings.json');

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed++; console.log('FAIL  ' + name + ' — ' + e.message); }
};

/** Run the hook the way Claude Code does: the tool payload on stdin, the verdict as an exit code. */
function verdict(command) {
  try {
    execFileSync('bash', [HOOK], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return 0;
  } catch (e) {
    return e.status;
  }
}

/**
 * The same run, but with a `python3` on PATH that fails the way a real one can.
 *
 * The guard shells out to python3 twice — to pull the command out of the payload, and to
 * normalise it before looking for the marker. Until 2026-09-06 a failure of either was read as
 * "no marker here" and the command was ALLOWED: measured, all three failure modes let a write
 * aimed at customer content through. This machine has carried a python3 PATH shim before, so
 * the mode is not hypothetical (memory python3-shim-breaks-guard).
 *
 * @param mode 'missing' exits non-zero silently · 'stdout' prints its refusal to stdout first,
 *             which is what a shim does and is worse: a non-empty WRONG value.
 */
function verdictWithBrokenPython(command, mode) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'py-shim-'));
  const shim = path.join(dir, 'python3');
  fs.writeFileSync(shim, mode === 'stdout'
    ? '#!/bin/sh\necho "ERROR: Use `uv run python` instead"\nexit 1\n'
    : '#!/bin/sh\nexit 127\n', 'utf8');
  fs.chmodSync(shim, 0o755);
  try {
    execFileSync('bash', [HOOK], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PATH: `${dir}:/usr/bin:/bin` },
    });
    return 0;
  } catch (e) {
    return e.status;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The guard with NO usable interpreter at all.
 *
 * A shim on PATH is no longer enough to reach that state — the guard now picks an absolute
 * python3 the way scripts/check-no-secrets.sh does, so a shim is simply stepped over. To
 * exercise the no-interpreter branch honestly this runs THE SAME SCRIPT with only its
 * candidate list pointed at paths that do not exist, and a failing python3 on PATH so the
 * `command -v` candidate fails too. Nothing else about the script is changed, and there is no
 * environment override in the real file for a caller to abuse.
 */
function verdictWithNoInterpreter(command) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'py-none-'));
  const shim = path.join(dir, 'python3');
  fs.writeFileSync(shim, '#!/bin/sh\nexit 127\n', 'utf8');
  fs.chmodSync(shim, 0o755);

  const src = fs.readFileSync(HOOK, 'utf8');
  const patched = src.replace(
    '/opt/homebrew/bin/python3 /usr/bin/python3 /usr/local/bin/python3',
    `${dir}/none-a ${dir}/none-b ${dir}/none-c`,
  );
  assert.notStrictEqual(patched, src, 'the candidate list changed shape — this test is now blind');
  const copy = path.join(dir, 'guard.sh');
  fs.writeFileSync(copy, patched, 'utf8');

  try {
    execFileSync('bash', [copy], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PATH: `${dir}:/usr/bin:/bin` },
    });
    return 0;
  } catch (e) {
    return e.status;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/* A real environment host, read from the off-repo secrets dir — never written into this public
 * repo. Without one, the host half of the check cannot be exercised honestly, so those cases
 * are skipped rather than quietly passed on a made-up hostname. */
function anyOlsHost() {
  const dir = path.join(os.homedir(), '.ols-qa-secrets');
  if (!fs.existsSync(dir)) return null;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.env'))) {
    const m = fs.readFileSync(path.join(dir, f), 'utf8').match(/^OLS_ORIGIN=https?:\/\/(\S+)/m);
    if (m) return m[1].replace(/["']/g, '').trim();
  }
  return null;
}

const HOST = anyOlsHost();
const M = '[' + 'RGS]';                 // assembled, so this file is not itself a marker hit
const FULLWIDTH = '[ＲＧＳ]';
const ZWSP = '[R​GS]';

check('the hook exists and is registered on the Bash tool', () => {
  assert.ok(fs.existsSync(HOOK), 'the hook script is missing — the command path is unguarded');
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const pre = (s.hooks && s.hooks.PreToolUse) || [];
  const registered = JSON.stringify(pre).includes('customer-content-guard.sh');
  assert.ok(registered, 'the hook is not registered in settings.json — it never runs');
  assert.ok(pre.some((e) => e.matcher === 'Bash'), 'it must match the Bash tool');
});

check('a write to an OLS environment naming the marker is blocked', () => {
  if (!HOST) { console.log('      (skipped — no OLS host available off-repo)'); return; }
  assert.strictEqual(verdict(`curl -X PUT https://${HOST}/api/media/1 -d '{"title":"${M} x"}'`), 2);
});

check('an absolute binary path does not slip past it', () => {
  if (!HOST) { console.log('      (skipped — no OLS host available off-repo)'); return; }
  // This is exactly what a shell function or a PATH shim cannot catch.
  assert.strictEqual(verdict(`/usr/bin/curl -X DELETE https://${HOST}/api/media/9 -H 'x: ${M}'`), 2);
});

check('another language is not another way in', () => {
  assert.strictEqual(verdict(`python3 -c "req(u, method='DELETE')" # /api/courses ${M}`), 2);
  assert.strictEqual(verdict(`node -e "fetch(u,{method:'PATCH'})" // /api/achievements ${M}`), 2);
});

check('an invisible or fullwidth marker is still the marker', () => {
  assert.strictEqual(verdict(`curl -X PUT /api/media/1 -d '${FULLWIDTH}'`), 2);
  assert.strictEqual(verdict(`curl -X PUT /api/media/1 -d '${ZWSP}'`), 2);
});

// ── the other failure mode: ordinary work must not be blocked ───────────────────────────
check('reading the customer\'s rows is never blocked', () => {
  if (!HOST) { console.log('      (skipped — no OLS host available off-repo)'); return; }
  assert.strictEqual(verdict(`curl -s https://${HOST}/api/media | grep ${M}`), 0);
  assert.strictEqual(verdict(`grep -rn "${M}" out/name-guard-preprod.json`), 0);
});

check('a write to our own content is never blocked', () => {
  if (!HOST) { console.log('      (skipped — no OLS host available off-repo)'); return; }
  assert.strictEqual(verdict(`curl -X PUT https://${HOST}/api/media/1 -d '{"title":"ทะเลมหัศจรรย์"}'`), 0);
});

check('a Discord alert that merely quotes the marker still goes out', () => {
  // The corrective PATCH of 2026-08-25 carried the marker in its own text. A guard that blocked
  // that would stop us explaining the rule in the very message that announces it.
  assert.strictEqual(verdict(`curl -X PATCH https://discord.com/api/v10/channels/1/messages/2 -d 'ไม่ได้แก้รายการที่มี RGS'`), 0);
});

check('editing this repo is never blocked', () => {
  assert.strictEqual(verdict(`git commit -m "docs: อธิบายกฎ ${M}"`), 0);
  assert.strictEqual(verdict(`sed -i '' 's/x/y/' tools/name-guard/customer_content.js  # ${M}`), 0);
});

/* ── the guard when its own helper is broken ─────────────────────────────────────────────
 *
 * Every case above assumes a working python3. These are the ones that were open: report #0005.
 */

check('a python3 shim on PATH no longer changes any verdict — the guard steps over it', () => {
  // The stronger property, and the one that keeps the fail-closed branch from firing in daily
  // work: a shim is bypassed for an absolute interpreter, so every verdict is the normal one.
  if (!HOST) { console.log('      (skipped — no OLS host available off-repo)'); return; }
  const theirs = `curl -X PUT https://${HOST}/api/media/1 -d '{"title":"${M} x"}'`;
  const ours = `curl -X PUT https://${HOST}/api/media/1 -d '{"title":"ทะเลมหัศจรรย์"}'`;
  for (const mode of ['missing', 'stdout']) {
    assert.strictEqual(verdictWithBrokenPython(theirs, mode), 2, `shim ${mode}: customer write allowed`);
    assert.strictEqual(verdictWithBrokenPython(ours, mode), 0, `shim ${mode}: our own write blocked`);
  }
});

check('with NO usable interpreter, the marker case still blocks', () => {
  if (!HOST) { console.log('      (skipped — no OLS host available off-repo)'); return; }
  const cmd = `curl -X PUT https://${HOST}/api/media/1 -d '{"title":"${M} x"}'`;
  assert.strictEqual(verdictWithNoInterpreter(cmd), 2, 'the guard allowed a customer write');
});

check('with NO usable interpreter, a write aimed at an OLS environment is refused even with no marker seen', () => {
  // It cannot tell whose row it is, so it will not guess. Over-blocking costs one confirmation;
  // the other direction costs the customer's data, and we cannot undo that.
  if (!HOST) { console.log('      (skipped — no OLS host available off-repo)'); return; }
  const ours = `curl -X PUT https://${HOST}/api/media/1 -d '{"title":"ทะเลมหัศจรรย์"}'`;
  assert.strictEqual(verdict(ours), 0, 'with an interpreter available this must still pass');
  assert.strictEqual(verdictWithNoInterpreter(ours), 2);
});

check('a missing interpreter does not start blocking ordinary work', () => {
  for (const cmd of ['ls -la docs/', 'git status', 'node tools/name-guard/scan.js --help']) {
    assert.strictEqual(verdictWithNoInterpreter(cmd), 0, cmd);
    assert.strictEqual(verdictWithBrokenPython(cmd, 'missing'), 0, cmd);
    assert.strictEqual(verdictWithBrokenPython(cmd, 'stdout'), 0, cmd);
  }
});

check('the interpreter is chosen the way the secret guard chooses it', () => {
  const src = fs.readFileSync(HOOK, 'utf8');
  assert.ok(/hooks\/shims/.test(src), 'the shim is no longer skipped');
  assert.ok(/PYBIN/.test(src), 'the interpreter is no longer resolved deterministically');
  assert.ok(!/\| python3 -c/.test(src), 'a bare python3 call came back');
});

check('the guard checks python3\'s exit status, not merely whether it printed something', () => {
  const src = fs.readFileSync(HOOK, 'utf8');
  assert.ok(/MARKER_RC/.test(src), 'the normaliser result is unchecked again');
  assert.ok(/CMD_RC/.test(src), 'the payload parse result is unchecked again');
  assert.ok(!/^\[ -z "\$MARKER" \] && exit 0$/m.test(src),
    'an empty marker exits 0 outright again — that is the #0005 hole');
});

console.log();
if (failed) { console.log(failed + ' failing'); process.exit(1); }
console.log('all green');
