#!/usr/bin/env node
'use strict';

/* process-kill guard — post-mortem #0163 (repeat of #0039).
 *
 * CLAUDE.md §9: stop a process only by a pid of known origin, never `pkill -f` / `killall`.
 * That rule existed as text since #0039 (2026-09-09) and was broken again on 2026-10-01: a
 * login-window process was stopped with `pkill -f '<script> <tag>'`, SIGTERM did not end it,
 * and two login windows waited on the same account until it was found and `kill -9 <pid>`'d.
 * #0039 Action Item 4 asked for exactly this mechanical layer and it was never built.
 *
 * decideCommand(cmd) -> { block, reason, segment }. Refuses:
 *   1. `pkill …` / `killall …` in command position (any flags — both select by name/pattern)
 *   2. `kill … $(pgrep|pidof|lsof|ps …)` / backtick form — a pattern lookup dressed as a pid
 *   3. `… pgrep|pidof|lsof|ps … | xargs kill` — same thing through a pipe
 *   4. any of the above inside `bash -c "…"` / `sh -c` / `zsh -c` or inside `$( … )`
 * Wrapper words in front do not hide the command (rtk · sudo · command · env · nohup · exec ·
 * time · nice · timeout N · VAR=value) — same lesson as tools/git-staging-guard (`rtk git add -A`).
 * Allowed: `kill <digits>` / `kill -9 <digits>` / `kill "$PID"` / `kill $!` / `kill %1` /
 * `kill $(cat x.pid)`, read-only `pgrep -fl …`, and the words pkill/killall as data
 * (quoted strings, grep patterns, commit messages, heredoc bodies).
 *
 * `node kill_rules.js --hook` reads a PreToolUse JSON payload on stdin: exit 2 = refuse (reason on
 * stderr), exit 0 = pass. Unreadable input fails open with a warning: the damage this layer
 * prevents is recoverable (a stray or surviving process), blocking every Bash call on a parse
 * error is not.
 * Not wired into .claude/settings.json by this commit: adding a hook needs the owner's approval
 * (CLAUDE.md §10) — the one-line entry is in the #0163 report, Action Item 1.
 */

function stripHeredocs(cmd) {
  return cmd.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g, '<<HEREDOC');
}

// Split into pipelines (on ; && || & newline) and each pipeline into stages (on |), outside
// quotes and outside $( … ). Returns [[stage, …], …] of raw text.
function pipelines(cmd) {
  const out = [];
  let stages = [];
  let cur = '';
  let i = 0;
  const flushStage = () => { stages.push(cur.trim()); cur = ''; };
  const flushPipe = () => { flushStage(); out.push(stages.filter(Boolean)); stages = []; };
  while (i < cmd.length) {
    const c = cmd[i];
    if (c === '\\') { cur += cmd.slice(i, i + 2); i += 2; continue; }
    if (c === "'") {
      const j = cmd.indexOf("'", i + 1);
      const end = j === -1 ? cmd.length : j + 1;
      cur += cmd.slice(i, end); i = end; continue;
    }
    if (c === '"') {
      let j = i + 1;
      while (j < cmd.length && cmd[j] !== '"') { if (cmd[j] === '\\') j += 1; j += 1; }
      const end = Math.min(j + 1, cmd.length);
      cur += cmd.slice(i, end); i = end; continue;
    }
    if (c === '$' && cmd[i + 1] === '(') {
      let depth = 0; let j = i + 1;
      for (; j < cmd.length; j++) {
        if (cmd[j] === '(') depth += 1;
        else if (cmd[j] === ')') { depth -= 1; if (depth === 0) break; }
      }
      const end = Math.min(j + 1, cmd.length);
      cur += cmd.slice(i, end); i = end; continue;
    }
    if (c === '`') {
      const j = cmd.indexOf('`', i + 1);
      const end = j === -1 ? cmd.length : j + 1;
      cur += cmd.slice(i, end); i = end; continue;
    }
    if (c === '\n' || c === ';') { flushPipe(); i += 1; continue; }
    if (c === '&' && cmd[i + 1] === '&') { flushPipe(); i += 2; continue; }
    if (c === '|' && cmd[i + 1] === '|') { flushPipe(); i += 2; continue; }
    if (c === '&') { flushPipe(); i += 1; continue; }
    if (c === '|') { flushStage(); i += 1; continue; }
    cur += c; i += 1;
  }
  flushPipe();
  return out.filter((p) => p.length);
}

// Shell words of one stage, quotes removed (enough to find the command word and its args).
function words(stage) {
  const ws = [];
  const re = /'([^']*)'|"((?:\\.|[^"\\])*)"|(\$\((?:[^()]|\([^()]*\))*\))|(`[^`]*`)|(\S+?)(?=\s|$|'|")|\s+/g;
  let w = null; let m;
  while ((m = re.exec(stage)) !== null) {
    if (m[0].trim() === '') { if (w !== null) { ws.push(w); w = null; } continue; }
    const piece = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[0];
    w = (w || '') + piece;
  }
  if (w !== null) ws.push(w);
  return ws;
}

const WRAPPERS = new Set(['rtk', 'sudo', 'command', 'env', 'nohup', 'exec', 'time', 'nice', 'builtin', 'caffeinate']);
const LOOKUP = /\b(pgrep|pidof|lsof|ps)\b/;
const base = (w) => w.replace(/^.*\//, '');

// Index of the real command word, skipping VAR=x and wrapper words (with their -options).
function commandIndex(ws) {
  let i = 0;
  while (i < ws.length) {
    const w = ws[i];
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w)) { i += 1; continue; }
    const b = base(w);
    if (WRAPPERS.has(b)) {
      i += 1;
      while (i < ws.length && /^-/.test(ws[i])) i += 1;
      continue;
    }
    if (b === 'timeout') {
      i += 1;
      while (i < ws.length && /^-/.test(ws[i])) i += 1;
      i += 1; // duration
      continue;
    }
    return i;
  }
  return -1;
}

function substitutions(stage) {
  const subs = [];
  const re = /\$\(((?:[^()]|\([^()]*\))*)\)|`([^`]*)`/g;
  let m;
  while ((m = re.exec(stage)) !== null) subs.push(m[1] !== undefined ? m[1] : m[2]);
  return subs;
}

const RULE = 'CLAUDE.md §9 — stop a process only by a pid of known origin';

function decideCommand(cmd, depth = 0) {
  if (depth > 4 || typeof cmd !== 'string' || !cmd.trim()) return { block: false };
  const text = stripHeredocs(cmd);
  for (const pipe of pipelines(text)) {
    const pipeHasLookup = pipe.some((st) => {
      const ws = words(st); const k = commandIndex(ws);
      return k >= 0 && LOOKUP.test(base(ws[k]));
    });
    for (const stage of pipe) {
      // Code inside $( … ) / backticks is commands too.
      for (const sub of substitutions(stage)) {
        const d = decideCommand(sub, depth + 1);
        if (d.block) return d;
      }
      const ws = words(stage);
      const k = commandIndex(ws);
      if (k < 0) continue;
      const name = base(ws[k]);
      const args = ws.slice(k + 1);
      if (name === 'pkill' || name === 'killall') {
        return { block: true, segment: stage, reason: `\`${name}\` selects processes by name/pattern, not by a known pid (${RULE})` };
      }
      if (name === 'kill') {
        if (substitutions(stage).some((s) => LOOKUP.test(s))) {
          return { block: true, segment: stage, reason: `\`kill\` with a pid looked up by pattern (pgrep/pidof/lsof/ps) is pkill under another name (${RULE})` };
        }
        continue;
      }
      if (name === 'xargs') {
        // the command xargs runs: first non-option word after xargs
        const runIdx = args.findIndex((a) => !/^-/.test(a));
        const run = runIdx >= 0 ? base(args[runIdx]) : '';
        if (run === 'pkill' || run === 'killall') {
          return { block: true, segment: stage, reason: `\`xargs ${run}\` selects processes by name/pattern (${RULE})` };
        }
        if (run === 'kill' && pipeHasLookup) {
          return { block: true, segment: pipe.join(' | '), reason: `pids fed to \`xargs kill\` come from a pattern lookup, not a known origin (${RULE})` };
        }
        continue;
      }
      if (['bash', 'sh', 'zsh'].includes(name)) {
        const c = args.indexOf('-c');
        if (c >= 0 && args[c + 1] !== undefined) {
          const d = decideCommand(args[c + 1], depth + 1);
          if (d.block) return d;
        }
      }
    }
  }
  return { block: false };
}

function hookMain() {
  let raw = '';
  try { raw = require('fs').readFileSync(0, 'utf8'); } catch { raw = ''; }
  let cmd;
  try {
    const hook = JSON.parse(raw);
    cmd = hook && hook.tool_input && hook.tool_input.command;
  } catch { cmd = undefined; }
  if (typeof cmd !== 'string') {
    process.stderr.write('process-kill-guard: could not read hook input — command NOT checked\n');
    process.exit(0);
  }
  const d = decideCommand(cmd);
  if (!d.block) process.exit(0);
  process.stderr.write(
`BLOCKED — stop processes by a known pid only

  command : ${d.segment}
  problem : ${d.reason}

Do this instead:
  1. pgrep -fl '<pattern>'        # read-only: see every match, count them
  2. pick the pid you started (from \`$!\` / a pidfile / that listing) and confirm it is yours
  3. kill <pid> ; then pgrep -fl again — still alive = kill -9 <pid>, then confirm it is gone

Why: a pattern can match a live process you did not mean (report #0039) and gives no pid to
follow up when SIGTERM is ignored (report #0163). tools/process-kill-guard/
`);
  process.exit(2);
}

if (require.main === module && process.argv.includes('--hook')) hookMain();

module.exports = { decideCommand, pipelines, words, commandIndex, stripHeredocs };
