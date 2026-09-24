#!/usr/bin/env node
'use strict';

/* zsh word-split guard — post-mortem #0118 (repeat of #0117).
 *
 * The Bash tool on this machine runs zsh. zsh does NOT word-split an unquoted scalar `$V`
 * (bash does), so a loop written the bash way hands one whole string to a program that expected
 * several words — twice in one day it produced runs that silently used defaults or NaN:
 *   #0117  for C in "A 25 18 0" ...; FPS/SCROLL never set -> both A/B runs identical
 *   #0118  for V in "1920 1080" ...; do set -- $V; VW=$1 VH=$2 ...  -> VW="1920 1080", VH=""
 *
 * decideCommand(cmd) -> { block, reason }. Refuses:
 *   1. `set -- $X` / `set -- ${X}` outside quotes (never splits a scalar in zsh)
 *   2. `for N in <list>; do … $N …` where <list> has a quoted item containing whitespace and the
 *      body uses $N unquoted (the author expected it to become several words)
 *   3. `for N in $X` / `${X}` — a scalar list is one iteration in zsh
 * Allowed: `${=X}` / `$=X` (explicit split), `"$N"` (one word on purpose), arrays `"${a[@]}"`,
 * `"$@"`, `$(cmd)`, plain word lists, anything inside quotes or a heredoc body.
 *
 * `node split_rules.js --hook` reads a PreToolUse JSON payload on stdin: exit 2 = refuse (reason
 * on stderr), exit 0 = pass. Unreadable input fails open with a warning — the damage this layer
 * prevents is a wasted run, which is recoverable; blocking every Bash call on a parse error is not.
 * Not wired into .claude/settings.json yet: adding a hook needs the owner's approval (CLAUDE.md §10).
 */

// Drop heredoc bodies: they are data (or a script for another interpreter), not this shell's code.
function stripHeredocs(cmd) {
  return cmd.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g, '<<HEREDOC');
}

// Same-length copy of cmd with every quoted region (quotes included) replaced by 'Q',
// plus the list of quoted regions so the caller can look at what was inside them.
function mask(cmd) {
  const out = cmd.split('');
  const regions = [];
  let i = 0;
  while (i < cmd.length) {
    const c = cmd[i];
    if (c === '\\') { i += 2; continue; }
    if (c === "'" || c === '"') {
      const start = i;
      i += 1;
      while (i < cmd.length && cmd[i] !== c) {
        if (c === '"' && cmd[i] === '\\') i += 1;
        i += 1;
      }
      const end = Math.min(i, cmd.length - 1);
      regions.push({ start, end, inner: cmd.slice(start + 1, end) });
      for (let k = start; k <= end; k++) out[k] = 'Q';
      i = end + 1;
      continue;
    }
    i += 1;
  }
  return { masked: out.join(''), regions };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const HOW = 'zsh does not word-split $var — use ${=V} (explicit split), an array, or one command per case with the values written out';

function decideCommand(raw) {
  const cmd = stripHeredocs(String(raw || ''));
  const { masked, regions } = mask(cmd);

  const set = /(^|[\s;&|(])set\s+--\s+\$\{?([A-Za-z_]\w*)\}?/.exec(masked);
  if (set) {
    return { block: true, reason: `\`set -- $${set[2]}\` in zsh keeps $${set[2]} as ONE argument, so $1 gets the whole string and $2 is empty — ${HOW}` };
  }

  const loop = /(^|[\s;&|(])for\s+([A-Za-z_]\w*)\s+in\s+([^;\n]*?)\s*[;\n]\s*do\b/g;
  let m;
  while ((m = loop.exec(masked))) {
    const name = m[2];
    const listStart = m.index + m[0].indexOf(m[3], m[0].indexOf(' in') + 3);
    const listEnd = listStart + m[3].length;
    const list = masked.slice(listStart, listEnd);

    const scalar = /\$\{?([A-Za-z_]\w*)\}?(?![\w[(])/.exec(list);
    if (scalar) {
      return { block: true, reason: `\`for ${name} in $${scalar[1]}\` runs ONCE in zsh with the whole string — ${HOW}` };
    }

    const multi = regions.some((r) => r.start >= listStart && r.end < listEnd && /\s/.test(r.inner));
    if (!multi) continue;
    const body = masked.slice(m.index + m[0].length);
    const use = new RegExp(`\\$(\\{${esc(name)}\\}|${esc(name)}(?![\\w\\[]))`).exec(body);
    if (use) {
      return { block: true, reason: `loop item for $${name} holds several words ("a b") and the body uses $${name} unquoted — zsh passes it as ONE argument, not several — ${HOW}` };
    }
  }

  // 4. (#0124, PM-2026-09-24-08) a scalar that holds several words, then used unquoted as arguments:
  //    F="a.js b.js"; prettier --write $F   ·   P=$(pgrep -f x); renice -n 10 -p $P
  //    A `$(…)` value counts only when the inner command prints a list (pgrep/ls/find/grep/…);
  //    `echo $V` is exempt (one argument prints the same text).
  const LISTERS = /\b(pgrep|pidof|ls|find|grep|egrep|awk|cut|xargs|seq|jq|sed|sort|uniq|tr|lsof|ps)\b/;
  const assign = /(^|[\s;&|(])([A-Za-z_]\w*)=(?!\()/g;
  let a;
  while ((a = assign.exec(masked))) {
    const name = a[2];
    const valStart = a.index + a[0].length;
    let multi = false;
    const region = regions.find((r) => r.start === valStart);
    if (region && /\s/.test(region.inner)) multi = true;
    if (!multi && cmd.startsWith('$(', valStart)) {
      const close = cmd.indexOf(')', valStart);
      if (LISTERS.test(cmd.slice(valStart + 2, close < 0 ? cmd.length : close))) multi = true;
    }
    if (!multi) continue;
    const rest = masked.slice(valStart);
    const use = new RegExp(`(^|[^\\w$])(echo\\s+)?\\$(\\{${esc(name)}\\}|${esc(name)}(?![\\w\\[]))`, 'g');
    let u;
    while ((u = use.exec(rest))) {
      if (u[2]) continue;
      return { block: true, reason: `$${name} holds several words and is used unquoted as arguments — zsh passes it as ONE argument (e.g. renice "pid argument … is invalid") — ${HOW}` };
    }
  }
  return { block: false, reason: '' };
}

function hookMain() {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { buf += c; });
  process.stdin.on('end', () => {
    let command;
    try { command = JSON.parse(buf).tool_input.command; } catch (_) { command = undefined; }
    if (typeof command !== 'string') {
      process.stderr.write('zsh-split-guard: could not read hook input — command NOT checked\n');
      process.exit(0);
    }
    const r = decideCommand(command);
    if (r.block) {
      process.stderr.write(`zsh-split-guard (post-mortem #0118): ${r.reason}\n`);
      process.exit(2);
    }
    process.exit(0);
  });
}

if (require.main === module && process.argv.includes('--hook')) hookMain();

module.exports = { decideCommand, mask, stripHeredocs };
