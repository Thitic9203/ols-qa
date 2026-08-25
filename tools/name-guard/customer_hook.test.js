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

console.log();
if (failed) { console.log(failed + ' failing'); process.exit(1); }
console.log('all green');
