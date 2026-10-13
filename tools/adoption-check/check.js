#!/usr/bin/env node
'use strict';

/**
 * Is this ticket counted by the AI-skill adoption dashboard? Answer it from the tracker,
 * never from memory.
 *
 * The dashboard runs the tracker search `comment ~ "retestskillmarker"` and counts a ticket
 * when one of its comments carries the usage marker (created after the snapshot cutoff; older
 * ones come from the snapshot). This check runs the same search scoped to one ticket, then
 * reads the ticket's comments and confirms the marker is the LAST line of a comment (and,
 * with --cutoff, that the comment is newer than the cutoff).
 *
 *   TRACKER_BASE_URL=https://{JIRA_DOMAIN} TRACKER_EMAIL=… TRACKER_API_TOKEN=… \
 *     node tools/adoption-check/check.js --key {ISSUE_KEY} [--cutoff <ISO date>] [--dashboard <url>]
 *
 * stdout: JSON {key, counted, exit, reason, commentId?, created?} then the one chat line.
 * exit 0 = counted · 1 = not counted (reason says why) · 2 = cannot check (no credentials,
 * bad key, HTTP error, network error) — "cannot check" is never reported as counted.
 *
 * This repo is PUBLIC: credentials and the dashboard URL come from the environment or the
 * caller, never from this file. Node >= 18 (global fetch), no dependencies.
 */

const MARKER_ANCHOR = 'retestskillmarker';
const KEY_RE = /^[A-Z][A-Z0-9_]*-\d+$/;
const DASHBOARD_PLACEHOLDER = '<ADOPTION_DASHBOARD_URL>';

function jqlFor(key) { return `key = ${key} AND comment ~ "${MARKER_ANCHOR}"`; }

function lastLine(body) {
  const lines = String(body == null ? '' : body).split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : '';
}

/** Jira prints offsets as +0700; normalise to +07:00 before parsing. */
function parseTime(s) {
  return Date.parse(String(s || '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
}

async function call(fetch, url, init) {
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    return { error: `network error: ${e.message}` };
  }
  if (!res.ok) return { error: `HTTP ${res.status} from ${url.replace(/^https?:\/\/[^/]+/, '')}` };
  try {
    return { data: await res.json() };
  } catch (e) {
    return { error: `unreadable response: ${e.message}` };
  }
}

async function check({ key, cutoff, base, auth, fetch }) {
  const out = (exit, reason, extra = {}) => ({ key, counted: exit === 0, exit, reason, ...extra });
  if (!KEY_RE.test(String(key || ''))) return out(2, `"${key}" is not a tracker issue key`);
  if (!base || !auth || typeof fetch !== 'function') return out(2, 'no tracker base URL / credentials');
  const cutoffMs = cutoff ? parseTime(cutoff) : null;
  if (cutoff && !Number.isFinite(cutoffMs)) return out(2, `cutoff "${cutoff}" is not a date`);
  const headers = { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' };

  const s = await call(fetch, `${base}/rest/api/3/search/jql`, {
    method: 'POST', headers, body: JSON.stringify({ jql: jqlFor(key), fields: ['key'], maxResults: 1 }),
  });
  if (s.error) return out(2, `search failed: ${s.error}`);
  const keys = ((s.data && s.data.issues) || []).map((i) => i.key);
  if (!keys.includes(key)) return out(1, `the search did not return ${key} (query: ${jqlFor(key)})`);

  const c = await call(fetch, `${base}/rest/api/2/issue/${key}/comment?orderBy=-created&maxResults=100`, { method: 'GET', headers });
  if (c.error) return out(2, `comment read failed: ${c.error}`);
  const withMarker = ((c.data && c.data.comments) || []).filter((x) => String(x.body || '').includes(MARKER_ANCHOR));
  const lastLineOnes = withMarker.filter((x) => lastLine(x.body).includes(MARKER_ANCHOR));
  if (lastLineOnes.length === 0) {
    return out(1, withMarker.length
      ? 'a comment carries the marker but it is not the last line of that comment'
      : 'no readable comment carries the marker (newest 100 read)');
  }
  const eligible = cutoffMs == null ? lastLineOnes : lastLineOnes.filter((x) => parseTime(x.created) > cutoffMs);
  if (eligible.length === 0) return out(1, `every marker comment is older than the snapshot cutoff ${cutoff}`);
  const newest = eligible.slice().sort((a, b) => parseTime(b.created) - parseTime(a.created))[0];
  return out(0, 'the search returns the ticket and its marker is the last line of the comment', {
    commentId: String(newest.id), created: newest.created,
  });
}

/** The one close-out line for the chat. */
function chatLine(r, dashboard = DASHBOARD_PLACEHOLDER) {
  if (r.exit === 0) return `Counted in ${dashboard} — tab AI Skill Adoption Overview (dashboard refreshes every 5 minutes)`;
  if (r.exit === 1) return `NOT counted yet — ${r.reason}`;
  return `Could not check the adoption count — ${r.reason}`;
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--key') { a.key = argv[i + 1]; i += 1; }
    else if (argv[i] === '--cutoff') { a.cutoff = argv[i + 1]; i += 1; }
    else if (argv[i] === '--dashboard') { a.dashboard = argv[i + 1]; i += 1; }
  }
  return a;
}

async function main(argv, env = process.env) {
  const a = parseArgs(argv);
  const missing = ['TRACKER_BASE_URL', 'TRACKER_EMAIL', 'TRACKER_API_TOKEN'].filter((k) => !env[k]);
  if (missing.length) {
    process.stderr.write(`cannot check: set ${missing.join(', ')} (from your local secrets, never from the repo)\n`);
    return 2;
  }
  const auth = 'Basic ' + Buffer.from(`${env.TRACKER_EMAIL}:${env.TRACKER_API_TOKEN}`).toString('base64');
  const r = await check({ key: a.key, cutoff: a.cutoff, base: env.TRACKER_BASE_URL.replace(/\/+$/, ''), auth, fetch: globalThis.fetch });
  process.stdout.write(JSON.stringify(r, null, 2) + '\n' + chatLine(r, a.dashboard || DASHBOARD_PLACEHOLDER) + '\n');
  return r.exit;
}

if (require.main === module) main(process.argv.slice(2)).then((code) => process.exit(code));

module.exports = { MARKER_ANCHOR, DASHBOARD_PLACEHOLDER, jqlFor, lastLine, parseTime, check, chatLine, parseArgs, main };
