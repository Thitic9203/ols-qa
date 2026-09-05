#!/usr/bin/env node
'use strict';
/* A skill that ships to the generic plugin must not link to a file that stays here.
 *
 * Everything under skills/ and commands/ is copied into the generic helix plugin;
 * references/ files are only copied when they already exist there. So a markdown
 * link from a synced skill to a workspace-only reference deploys as a **dangling
 * link** — the sync script prints a warning about it, and a warning printed once
 * during a commit is a warning nobody reads twice. This test is the same warning,
 * except it fails.
 *
 * A workspace-only reference marks itself with `<!-- ols-only` in its first lines.
 * Reference such a file as a plain path (`references/x.md`), never as a link.
 *
 *   node tools/portability/synced_links.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SYNCED_DIRS = ['skills', 'commands'];

/**
 * Links that already existed when this test was written. They are real dangling
 * links in the deployed plugin, left as-is because fixing them was not part of the
 * change that added this test — the owner decides. Anything NEW fails.
 */
const PRE_EXISTING = new Set([
  // Empty on purpose. The three links that were here (both content-takedown files
  // and the sync-tc-result command, all pointing at the project guide) were fixed
  // rather than exempted, so nothing is grandfathered and the next break fails.
]);

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

/** Reference files that declare themselves workspace-only. */
function workspaceOnlyReferences() {
  const dir = path.join(ROOT, 'references');
  const names = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const head = fs.readFileSync(path.join(dir, f), 'utf8').slice(0, 400);
    if (head.includes('<!-- ols-only')) names.add(f);
  }
  return names;
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const marked = workspaceOnlyReferences();

check('the workspace-only references are marked (an unmarked one is invisible to this test)', () => {
  assert.ok(marked.has('ols-project-guide.md'), 'ols-project-guide.md carries no ols-only marker');
  assert.ok(marked.size >= 2, 'only ' + marked.size + ' marked file(s) found');
});

check('no synced skill or command markdown-links to a workspace-only reference', () => {
  const files = SYNCED_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
  assert.ok(files.length > 5, 'only ' + files.length + ' files scanned');
  const offenders = [];
  const linkRe = /\]\(([^)]+\.md)\)/g;
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const text = fs.readFileSync(f, 'utf8');
    text.split('\n').forEach((line, i) => {
      let m;
      linkRe.lastIndex = 0;
      while ((m = linkRe.exec(line)) !== null) {
        const target = path.basename(m[1]);
        if (!marked.has(target)) continue;
        if (PRE_EXISTING.has(rel)) continue;
        offenders.push(`${rel}:${i + 1} → ${target}`);
      }
    });
  }
  assert.deepStrictEqual(offenders, [],
    'these would deploy as dangling links: ' + offenders.join(', '));
});

check('nothing is grandfathered — the exemption list is empty', () => {
  assert.strictEqual(PRE_EXISTING.size, 0,
    'an exemption is a link that still 404s in the deployed plugin: ' + [...PRE_EXISTING].join(', '));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
