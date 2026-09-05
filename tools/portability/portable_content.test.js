#!/usr/bin/env node
'use strict';
/* `references/portable-content.md` is a rule nobody was enforcing.
 *
 * Everything under skills/ and commands/ is synced into the generic helix plugin
 * and installed by other projects. A transition id, an app URL shape or a UI
 * quirk written there is shipped to all of them — and the retest skill was doing
 * exactly that while its own Step 8a said "NEVER hardcode transition names in the
 * skill". Those eight rules now live in the project guide, which is not synced.
 *
 * Project-specific values belong in the workspace's own `references/*-guide.md`.
 *
 *   node tools/portability/portable_content.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SCAN_DIRS = ['skills', 'commands'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/**
 * Each rule says what may not appear in a synced skill, and where it goes instead.
 * `allow` lists lines that are teaching the rule rather than breaking it.
 */
const RULES = [
  {
    id: 'machine-path',
    re: /(\/Users\/[A-Za-z0-9._-]+|[Cc]:\\Users\\|~\/\.helix|~\/\.cursor)/,
    home: "the user's own environment, never a committed skill",
    allow: /symptom:|do not|never|must not|forbidden|ห้าม/i,
  },
  {
    id: 'hardcoded-transition-id',
    re: /transition[^|\n]{0,40}`\d{2,3}`|`\d{2,3}`[^|\n]{0,20}then\s+`\d{2,3}`/i,
    home: "the workspace's project guide — workflows differ per project",
    allow: /never hardcode|portable-content|project guide|read them from here/i,
  },
  {
    id: 'app-url-shape',
    re: /`\/(creator|admin|learner)\/[a-z-]+`/i,
    home: "the workspace's project guide — routes belong to one deployment",
    allow: /example|placeholder|never|must not/i,
  },
  {
    id: 'ui-library-quirk',
    re: /\bMUI\s+Select\b|MutationObserver callback|superpowers-chrome eval/i,
    home: "the workspace's project guide — the UI stack is not the skill's business",
    allow: /project guide|moved here/i,
  },
  {
    id: 'notify-helper-flags',
    re: /--pass-count|--owner-label|discord_qa_notify\.py/,
    home: "the workspace's project guide — the helper is project tooling",
    allow: /project guide|if the project provides a notify helper/i,
  },
];

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

check('there is something to scan (a silent empty scan is not a pass)', () => {
  assert.ok(files.length > 5, 'only ' + files.length + ' markdown files found under ' + SCAN_DIRS.join(', '));
});

for (const rule of RULES) {
  check(`no synced skill carries a ${rule.id}`, () => {
    const offenders = [];
    for (const f of files) {
      const rel = path.relative(ROOT, f);
      fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (!rule.re.test(line)) return;
        if (rule.allow && rule.allow.test(line)) return;
        offenders.push(`${rel}:${i + 1}`);
      });
    }
    assert.deepStrictEqual(offenders, [],
      `${rule.id} belongs in ${rule.home}; found at: ${offenders.join(', ')}`);
  });
}

check('the retest skill still points the reader at the project guide for those values', () => {
  const wf = path.join(ROOT, 'skills', 'deprecated', 'retest-bug-workflow', 'WORKFLOW.md');
  const text = fs.readFileSync(wf, 'utf8');
  assert.ok(/take transition names\/ids, notify-helper flags, app URL shapes and UI-automation quirks from the workspace's project guide/.test(text),
    'removing the project values without leaving a pointer just loses them');
});


check('a synced skill never orders an unconditional run of a workspace-local tool', () => {
  // The retest workflow ships to projects that do not have tools/retest-guard/. An
  // unconditional `node tools/...` there fails, and a failing gate command reads as
  // "could not run" — which the same workflow says is not a pass. So it would block
  // a retest in every project that has not adopted the tool.
  const wf = fs.readFileSync(path.join(ROOT, 'skills', 'deprecated', 'retest-bug-workflow', 'WORKFLOW.md'), 'utf8');
  assert.ok(/When the workspace provides `tools\/retest-guard\/` — run it;\s+it is not optional there/.test(wf),
    'the guard step is not stated as conditional on the workspace providing it');
  assert.ok(/a missing tool is not a lighter\s+standard/.test(wf),
    'the conditional does not say the rules still apply without the tool');
  assert.ok(/\*\*When the workspace provides an evidence reconciler\*\*/.test(wf),
    'the reconciler step is not stated as conditional');
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
