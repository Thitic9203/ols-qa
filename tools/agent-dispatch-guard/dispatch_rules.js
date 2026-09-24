'use strict';

/**
 * dispatch_rules.js — the single source of truth for what a background-agent
 * brief must say before it may be dispatched.
 *
 * WHY THIS EXISTS
 * ---------------
 * Measured 2026-09-18 over every subagent transcript on this machine
 * (`tools/agent-stall-metrics/measure.js` reproduces the numbers):
 *
 *   - 328 of 328 agents that carry the watchdog's kill marker were waiting on
 *     the MODEL when they died. ZERO were waiting on a tool.
 *   - The final silence is 600.1s at the median — the watchdog threshold
 *     exactly, so the kill is the watchdog's, not a tool timing out.
 *   - The per-request stall hazard roughly triples once an agent's context
 *     passes ~300k tokens, and it does so by the same factor on
 *     claude-sonnet-5 and claude-opus-5, so it is not a property of one model.
 *   - Screenshots are how our agents reach that size: stall rate is 16.5% for
 *     agents that pull no image into context and 59.4% for those that pull
 *     61-150.
 *
 * Two consequences, and this module enforces the first two of three:
 *
 *   1. Nothing the agent holds only in its own context survives the kill, so a
 *      brief must tell the agent to write each result to disk BEFORE it calls
 *      the next tool. A brief without that instruction is a brief whose work
 *      is lost the first time the stream stalls. (Reports #0053, #0057 both
 *      identified this and both closed with prose; prose did not carry.)
 *   2. A brief that asks for screenshots without saying to keep them out of
 *      context is asking for the context growth that triples the hazard.
 *   3. (Not enforced here — server-side.) Why the stream stops is unknown; no
 *      HTTP status is recorded anywhere for these. Strict scanning found a
 *      real API error in 2 of 419 transcripts.
 *
 * DESIGN RULES THIS FILE FOLLOWS (from this repo's own post-mortems)
 * -----------------------------------------------------------------
 * - One module decides. `check.js` prints and relays; it holds no regex of its
 *   own. Two runtimes holding the same rules are two answers waiting to
 *   disagree (#0003).
 * - Every assessment reports HOW MANY checks it actually ran, and zero checks
 *   is a refusal, never a pass (#0006, #0010, #0012).
 * - "Cannot check" is a third state and it routes to refusal, never to allow
 *   (#0005).
 * - Words that have legitimate uses are REPORTED, not blocked, so the guard
 *   does not become the thing everyone switches off (investigation-guard).
 */

/** Result codes. BLOCK stops the dispatch; NOTE is reported and allowed. */
const SEVERITY = { BLOCK: 'BLOCK', NOTE: 'NOTE' };

/**
 * The canonical marker. A brief may satisfy the persistence rule either by
 * carrying this literal token or by spelling the contract out (see
 * `hasPersistenceContract`). The token exists so a brief can be unambiguous;
 * the heuristic exists so a well-written brief is not rejected for lacking a
 * magic word.
 */
const PERSIST_MARKER = 'PERSIST-BEFORE-PRINT';

/** A path-like token: something/with.an-extension */
const PATH_RE = /[\w./~-]*[\w-]+\.(?:jsonl|json|md|txt|log|csv|tsv|ndjson|yaml|yml)\b/i;

/** A verb that means "put it on disk", English or Thai. */
const WRITE_VERB_RE = /\b(?:append|write|writes|writing|save|saves|saving|flush|persist|record)\b|เขียน|บันทึก|เซฟ/i;

/**
 * A cadence phrase that means "every unit, not at the end". The whole point is
 * that a brief saying "write your results at the end" is exactly the brief
 * whose results are lost.
 */
const CADENCE_RE = new RegExp(
  [
    'after (?:each|every)',
    'before (?:the )?next tool',
    'before you call',
    'per (?:case|row|item|file|unit|batch)',
    'one line per',
    'as you go',
    'incrementally',
    'ทุกเคส',
    'ทุกก้อน',
    'ทุกแถว',
    'ทุกไฟล์',
    'ทุกรายการ',
    'ก่อนเรียก',
    'ก่อนจะเรียก',
    'ทีละเคส',
    'ทีละก้อน',
  ].join('|'),
  'i'
);

/** A brief that will make the agent take screenshots. */
const SCREENSHOT_RE = /\b(?:screenshot|screen shot|screen-capture|screencapture)\b|app_screenshot|browser_snapshot|computer_use|ภาพหน้าจอ|แคปหน้าจอ|สกรีนช็อต/i;

/**
 * Wording that keeps a screenshot OUT of context: save it to a file, read it
 * with a sandboxed tool, or prefer the text tree.
 */
const SCREENSHOT_SAFE_RE = /\bfilename\b|\bsave (?:it|them|the (?:image|screenshot|snapshot))|ctx_execute_file|ctx_index|get_page_text|read_page|accessibility tree|เซฟลงไฟล์|บันทึกลงไฟล์|ไม่ต้องดึงภาพเข้า|อย่าดึงภาพเข้า/i;

/** Wording that means "read/scan the whole of something" with no stated bound. */
const UNBOUNDED_RE = /\b(?:all|every|entire|whole|each of the)\b[^.\n]{0,40}\b(?:files?|transcripts?|rows?|records?|cases?|clips?|tickets?)\b|ทั้งหมดทุก(?:ไฟล์|เคส|แถว|รายการ)/i;

/** A stated bound: a number of items, a batch size, or an explicit cap. */
const BOUND_RE = /\b\d{1,5}\s*(?:files?|transcripts?|rows?|records?|cases?|clips?|items?|ไฟล์|เคส|แถว|รายการ)\b|\bbatch(?:es)? of \d+|\bat most \d+|\bno more than \d+|ไม่เกิน\s*\d+|ครั้งละ\s*\d+/i;

/**
 * Proxy preload (#0121). On training69 the session tools build a Playwright API
 * context with no proxy option, so they only reach the host when node starts
 * with `NODE_OPTIONS=--require …/pw_proxy_preload.js` (the preload is what reads
 * PW_PROXY). A brief that hand-lists PW_PROXY without the preload sends every
 * lane into `getaddrinfo ENOTFOUND`. Scope is deliberately narrow — only a brief
 * that runs the session tools AND is on the proxied env — so pre-prod briefs and
 * recorder briefs are not touched.
 */
const SESSION_TOOL_RE = /\bsession_(?:verify|capture)(?:\.js)?\b/i;
const PROXIED_ENV_RE = /\bPW_PROXY\b|training\s*69|\bt69\b/i;
const PRELOAD_RE = /pw_proxy_preload(?:\.js)?|\bt69_env\.sh\b/i;
// The owner's secrets store (PM-2026-09-24-11). Matches the directory and the file name.
const SECRETS_STORE_RE = /\.ols-qa-secrets\b|\bols-secrets\.md\b/i;

/**
 * Does the brief spell out the persistence contract?
 *
 * Satisfied by the canonical marker, or by naming an output file AND a write
 * verb AND a per-unit cadence. All three are required: a brief that names a
 * file but says to fill it at the end does not survive a kill, and neither
 * does one that says "write as you go" without saying where.
 */
function hasPersistenceContract(text) {
  if (typeof text !== 'string') return false;
  if (text.includes(PERSIST_MARKER)) return true;
  return PATH_RE.test(text) && WRITE_VERB_RE.test(text) && CADENCE_RE.test(text);
}

/**
 * Assess one agent brief.
 *
 * Returns { ok, checks, findings }.
 *   - `checks` is the number of checks that actually ran. The caller must
 *     refuse on zero; a run that measured nothing is not a pass.
 *   - `findings` carries { code, severity, message, fix }.
 *
 * Throws TypeError when the input is not a string — "cannot read the brief" is
 * a refusal for the caller to surface, never a silent allow.
 */
function assessBrief(text) {
  if (typeof text !== 'string') {
    throw new TypeError('assessBrief: brief is not a string — cannot check (refuse, do not allow)');
  }

  const findings = [];
  let checks = 0;

  // Check 1 — persistence contract. Blocks: the fix is one line, and without
  // it every stall costs the whole agent's work.
  checks += 1;
  if (!hasPersistenceContract(text)) {
    findings.push({
      code: 'NO_PERSIST_CONTRACT',
      severity: SEVERITY.BLOCK,
      message:
        'the brief never tells the agent to write each result to disk before its next tool call — ' +
        'measured: 328/328 killed agents were waiting on the model, so anything held only in ' +
        'context was lost',
      fix:
        'name an output file, say to append to it, and say when — e.g. ' +
        '"append one JSON line per case to out/<round>/lane1.jsonl BEFORE calling the next tool" ' +
        '(or put the literal token ' + PERSIST_MARKER + ' in the brief)',
    });
  }

  // Check 2 — screenshots into context. Reported, not blocked: a brief may
  // legitimately need one image, and a guard that blocks a legitimate need is
  // a guard that gets switched off.
  checks += 1;
  if (SCREENSHOT_RE.test(text) && !SCREENSHOT_SAFE_RE.test(text)) {
    findings.push({
      code: 'SCREENSHOT_INTO_CONTEXT',
      severity: SEVERITY.NOTE,
      message:
        'the brief asks for screenshots without saying to keep them out of context — ' +
        'measured stall rate: 16.5% with no images, 59.4% with 61-150',
      fix:
        'pass a filename to the capture tool and read the file with ctx_execute_file, ' +
        'or read the page as text (get_page_text / read_page) instead',
    });
  }

  // Check 3 — unbounded sweep. Reported: the phrasing is often fine, but an
  // agent told to walk "every file" is the agent that grows past 300k.
  checks += 1;
  if (UNBOUNDED_RE.test(text) && !BOUND_RE.test(text)) {
    findings.push({
      code: 'UNBOUNDED_SCAN',
      severity: SEVERITY.NOTE,
      message:
        'the brief asks the agent to work through everything with no stated bound — ' +
        'per-request stall hazard roughly triples past ~300k context, on both sonnet-5 and opus-5',
      fix: 'state how many items this agent handles, and split the rest into another agent',
    });
  }

  // Check 4 — proxy preload for the session tools on training69 (#0121).
  // Blocks: the failure is certain (ENOTFOUND on every lane), and the fix is
  // one command that the brief can name instead of an env list.
  checks += 1;
  if (SESSION_TOOL_RE.test(text) && PROXIED_ENV_RE.test(text) && !PRELOAD_RE.test(text)) {
    findings.push({
      code: 'PROXY_PRELOAD_MISSING',
      severity: SEVERITY.BLOCK,
      message:
        'the brief runs session_verify/session_capture on the proxied env (training69 / PW_PROXY) ' +
        'but never gives the proxy preload — measured 2026-09-23: 3 of 3 lanes got getaddrinfo ENOTFOUND (#0121)',
      fix:
        'name the one wrapper instead of an env list: ' +
        'HANDS_OFF_EXCEPTION="<reason>" bash capture/t69_env.sh node capture/session_verify.js <tags> ' +
        '(or add NODE_OPTIONS="--require <bot>/capture/pw_proxy_preload.js")',
    });
  }

  // Check 5 — agent told to read the owner's secrets store (PM-2026-09-24-11).
  // Blocks: a grep over that file returns whole lines, and one filter slip put a
  // password line into the session. Account lists without passwords already exist.
  checks += 1;
  if (SECRETS_STORE_RE.test(text)) {
    findings.push({
      code: 'SECRETS_STORE_IN_BRIEF',
      severity: SEVERITY.BLOCK,
      message:
        'the brief points the agent at the secrets store — a read of it prints whole lines, ' +
        'and on 2026-09-24 a filter slip put one password line into the session (PM-2026-09-24-11)',
      fix:
        'give the password-free account list instead: <bot>/capture/accounts_<env>.json ' +
        '(fields email/env/role_ols/row/tag), or name the exact tag the agent should use',
    });
  }

  if (checks === 0) {
    throw new Error('assessBrief: ran zero checks — refusing rather than reporting clean');
  }

  return {
    ok: !findings.some((f) => f.severity === SEVERITY.BLOCK),
    checks,
    findings,
  };
}

/** Render an assessment for a human. Always states how many checks ran (#0006). */
function formatAssessment(result) {
  if (!result || typeof result.checks !== 'number') {
    throw new TypeError('formatAssessment: not an assessment');
  }
  const lines = [];
  if (!result.findings.length) {
    lines.push(`[agent-dispatch-guard] brief ok — ${result.checks} check(s) ran, 0 finding(s)`);
    return lines.join('\n');
  }
  lines.push(
    `[agent-dispatch-guard] ${result.findings.length} finding(s) from ${result.checks} check(s):`
  );
  for (const f of result.findings) {
    lines.push(`  ${f.severity} ${f.code}: ${f.message}`);
    lines.push(`    fix: ${f.fix}`);
  }
  return lines.join('\n');
}

module.exports = {
  SEVERITY,
  PERSIST_MARKER,
  hasPersistenceContract,
  assessBrief,
  formatAssessment,
};
