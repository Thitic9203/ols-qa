#!/usr/bin/env node
'use strict';
/* Known-answer tests for the adoption-count check.
 *
 * The close-out line "Counted in the adoption dashboard" is a claim to a person, so it is
 * only printed from a search result. These cases fix what the check must say for a counted
 * ticket, for each way a ticket is not counted, and for each way the check cannot run.
 *
 *   node tools/adoption-check/check.test.js
 */
const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const C = require('./check');

const BASE = 'https://tracker.example.com';
const MARKER = '_retestskillmarker · skill=retest-bug-workflow · src=ols-qa · via=retest-bug · agent=claude-code_';

function fakeFetch({ searchKeys = ['PROJ-12'], comments = [], searchStatus = 200, commentStatus = 200, throws = false } = {}) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url, init });
    if (throws) throw new Error('getaddrinfo ENOTFOUND');
    if (url.includes('/search/jql')) {
      return { ok: searchStatus < 300, status: searchStatus, json: async () => ({ issues: searchKeys.map((key) => ({ key })) }) };
    }
    return { ok: commentStatus < 300, status: commentStatus, json: async () => ({ comments }) };
  };
  fn.calls = calls;
  return fn;
}
const comment = (id, created, body) => ({ id, created, body });
const opts = (fetch, extra = {}) => ({ key: 'PROJ-12', base: BASE, auth: 'Basic eDp5', fetch, ...extra });

let failed = 0;
const pending = [];
function check(name, fn) {
  pending.push(Promise.resolve().then(fn).then(
    () => console.log('PASS  ' + name),
    (e) => { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); },
  ));
}

check('the search is the dashboard search scoped to the ticket, on the current search endpoint', async () => {
  const f = fakeFetch({ comments: [comment('1', '2026-10-13T03:00:00.000+0700', 'body\n\n' + MARKER)] });
  await C.check(opts(f));
  const s = f.calls[0];
  assert.strictEqual(s.url, BASE + '/rest/api/3/search/jql');
  assert.strictEqual(s.init.method, 'POST');
  assert.strictEqual(JSON.parse(s.init.body).jql, 'key = PROJ-12 AND comment ~ "retestskillmarker"');
  assert.strictEqual(s.init.headers.Authorization, 'Basic eDp5');
});

check('counted: search returns the ticket and the newest marker comment ends with the marker', async () => {
  const f = fakeFetch({ comments: [comment('7', '2026-10-13T03:00:00.000+0700', 'Retest Result\n\n' + MARKER + '\n\n')] });
  const r = await C.check(opts(f));
  assert.strictEqual(r.exit, 0);
  assert.strictEqual(r.counted, true);
  assert.strictEqual(r.commentId, '7');
});

check('not counted: the search does not return the ticket', async () => {
  const r = await C.check(opts(fakeFetch({ searchKeys: [] })));
  assert.strictEqual(r.exit, 1);
  assert.ok(/search did not return/i.test(r.reason), r.reason);
});

check('not counted: the marker is in the comment but not its last line', async () => {
  const f = fakeFetch({ comments: [comment('3', '2026-10-13T03:00:00.000+0700', MARKER + '\n\nadded later')] });
  const r = await C.check(opts(f));
  assert.strictEqual(r.exit, 1);
  assert.ok(/not the last line/i.test(r.reason), r.reason);
});

check('not counted: the only marker comment is older than the snapshot cutoff', async () => {
  const f = fakeFetch({ comments: [comment('4', '2026-09-01T10:00:00.000+0700', 'x\n\n' + MARKER)] });
  const r = await C.check(opts(f, { cutoff: '2026-10-01T00:00:00Z' }));
  assert.strictEqual(r.exit, 1);
  assert.ok(/cutoff/i.test(r.reason), r.reason);
});

check('counted after the cutoff when one marker comment is newer than it', async () => {
  const f = fakeFetch({ comments: [
    comment('4', '2026-09-01T10:00:00.000+0700', 'x\n\n' + MARKER),
    comment('9', '2026-10-13T10:00:00.000+0700', 'y\n\n' + MARKER),
  ] });
  const r = await C.check(opts(f, { cutoff: '2026-10-01T00:00:00Z' }));
  assert.strictEqual(r.exit, 0);
  assert.strictEqual(r.commentId, '9');
});

check('cannot check: HTTP 401 on the search', async () => {
  const r = await C.check(opts(fakeFetch({ searchStatus: 401 })));
  assert.strictEqual(r.exit, 2);
  assert.ok(/401/.test(r.reason), r.reason);
});

check('cannot check: HTTP 500 on the comment read', async () => {
  const r = await C.check(opts(fakeFetch({ commentStatus: 500 })));
  assert.strictEqual(r.exit, 2);
});

check('cannot check: the network call throws', async () => {
  const r = await C.check(opts(fakeFetch({ throws: true })));
  assert.strictEqual(r.exit, 2);
});

check('cannot check: a key that is not a tracker key is refused before any call (no query injection)', async () => {
  const f = fakeFetch();
  const r = await C.check(opts(f, { key: 'PROJ-1 OR 1=1' }));
  assert.strictEqual(r.exit, 2);
  assert.strictEqual(f.calls.length, 0);
});

check('the chat line is printed only for a counted result, with the placeholder kept generic', async () => {
  assert.strictEqual(C.chatLine({ exit: 0, counted: true }, '<ADOPTION_DASHBOARD_URL>'),
    'Counted in <ADOPTION_DASHBOARD_URL> — tab AI Skill Adoption Overview (dashboard refreshes every 5 minutes)');
  assert.ok(/^NOT counted yet — /.test(C.chatLine({ exit: 1, reason: 'the search did not return PROJ-12' }, 'U')));
  assert.ok(/^Could not check the adoption count — /.test(C.chatLine({ exit: 2, reason: 'HTTP 401' }, 'U')));
});

check('CLI: missing credentials → exit 2, no network', () => {
  const env = { ...process.env };
  delete env.TRACKER_BASE_URL; delete env.TRACKER_EMAIL; delete env.TRACKER_API_TOKEN;
  const r = spawnSync(process.execPath, [path.join(__dirname, 'check.js'), '--key', 'PROJ-12'], { encoding: 'utf8', env });
  assert.strictEqual(r.status, 2);
  assert.ok(/TRACKER_BASE_URL/.test(r.stderr), r.stderr);
});

Promise.all(pending).then(() => {
  console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
  process.exit(failed ? 1 : 0);
});
