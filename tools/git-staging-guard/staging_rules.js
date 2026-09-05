'use strict';

/**
 * Staging rules — one place decides which git commands may put files in the index.
 *
 * WHY THIS EXISTS: on 2026-09-05 a commit whose message was about retest-guard shipped three
 * files and a CLAUDE.md section belonging to a different session that was mid-edit in the same
 * worktree, and pushed them. Nothing was lost, but half a feature reached main — the decision
 * module without the hooks that run it — and the pushed tree failed its own tests for as long
 * as it took somebody to notice.
 *
 * The mistake was not carelessness about *which* files; it was staging by PATH instead of by
 * FILE. `git add tools/` cannot know that half of `tools/` was written by someone else four
 * seconds ago. Listing the files makes that impossible to do by accident, because the list is
 * written by the person who knows what they changed.
 *
 * So: a broad stage is refused, an explicit one is not. Reading, diffing and committing an
 * already-correct index are untouched.
 */

/**
 * Split a shell line into the commands it actually runs — quote-aware.
 *
 * A naive split on `|` and `&&` reads the inside of a quoted string as a command. That is not
 * hypothetical: it blocked two of this repo's own review commands, because a `node -e` script
 * that merely QUOTED a staging command got torn at the pipe inside the quotes and the tail
 * parsed as a real one. A guard that stops people writing about git is a guard they remove.
 */
function segments(cmd) {
  const s = String(cmd || '');
  const out = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (quote) {
      cur += c;
      if (c === '\\' && i + 1 < s.length) { cur += s[i + 1]; i += 1; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; cur += c; continue; }
    if (c === '\\' && i + 1 < s.length) { cur += c + s[i + 1]; i += 1; continue; }
    if (c === '|' || c === ';' || c === '\n') {
      if (c === '|' && s[i + 1] === '|') i += 1;
      out.push(cur); cur = ''; continue;
    }
    if (c === '&' && s[i + 1] === '&') { i += 1; out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

/** Tokenise one segment, honouring simple quoting so a quoted path stays one token. */
function tokens(seg) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(seg)) !== null) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  return out;
}

/** git's own options sit before the subcommand; skip them to find it. */
function subcommand(tk) {
  let i = 0;
  if (!tk.length) return null;
  if (!/(^|\/)git$/.test(tk[0])) return null;
  i = 1;
  while (i < tk.length) {
    const t = tk[i];
    if (t === '-C' || t === '-c') { i += 2; continue; }
    if (t.startsWith('--git-dir') || t.startsWith('--work-tree') || t.startsWith('--namespace')) { i += 1; continue; }
    if (t.startsWith('-')) { i += 1; continue; }
    return { name: t, rest: tk.slice(i + 1) };
  }
  return null;
}

/** Short flags may be clustered: -am carries both a and m. */
function hasShort(rest, letter) {
  return rest.some((t) => /^-[A-Za-z]+$/.test(t) && t.slice(1).includes(letter));
}
function hasLong(rest, name) {
  return rest.some((t) => t === `--${name}` || t.startsWith(`--${name}=`));
}

/** Arguments that are paths, i.e. everything after `--`, or every non-flag token. */
function pathArgs(rest) {
  const dd = rest.indexOf('--');
  const src = dd === -1 ? rest : rest.slice(dd + 1);
  return src.filter((t) => !t.startsWith('-'));
}

const WHOLE_TREE = new Set(['.', './', ':/', '*', '**', '"*"']);

/**
 * A path the SHELL will turn into something else before git ever sees it.
 *
 * `git add tools/*` is the incident's command with one character changed, and it stages exactly
 * the same set — the expansion happens in the shell, so a guard reading the typed command sees
 * one harmless-looking argument. Same for `$(git diff --name-only)` and backticks: the argument
 * list is decided at run time by something this guard cannot read. Whatever a person cannot name
 * in the command, they cannot claim to have reviewed.
 */
const UNSAFE_PATH = /[*?\[\]$`]/;

/**
 * Decide one shell line.
 *
 * `isDir(p)` is injected rather than computed here: whether `tools` is a directory depends on
 * the cwd the command will run in, which this module cannot know and must not guess. Without
 * it a bare word is treated as a file, so the module errs toward ALLOW — a staging guard that
 * blocks legitimate work is a staging guard somebody deletes.
 */
function decideCommand(cmd, isDir) {
  const dir = typeof isDir === 'function' ? isDir : () => false;
  for (const seg of segments(cmd)) {
    const sub = subcommand(tokens(seg));
    if (!sub) continue;

    if (sub.name === 'add') {
      if (hasShort(sub.rest, 'A') || hasLong(sub.rest, 'all')) return block(seg, 'git add -A / --all');
      if (hasShort(sub.rest, 'u') || hasLong(sub.rest, 'update')) return block(seg, 'git add -u / --update');
      const paths = pathArgs(sub.rest);
      if (!paths.length) continue; // `git add -p`, or a malformed line git itself will reject
      for (const p of paths) {
        if (WHOLE_TREE.has(p)) return block(seg, `git add ${p}`);
        if (UNSAFE_PATH.test(p)) return block(seg, `git add ${p} (shell ขยายเองก่อนถึง git)`);
        if (p.endsWith('/') || dir(p)) return block(seg, `git add ${p} (เป็นโฟลเดอร์)`);
      }
    }

    if (sub.name === 'commit') {
      if (hasShort(sub.rest, 'a') || hasLong(sub.rest, 'all')) return block(seg, 'git commit -a / --all');
    }
  }
  return { block: false };
}

function block(segment, what) {
  return {
    block: true,
    what,
    segment,
    reason: `คำสั่งนี้ stage แบบเหมา ไม่ได้ระบุไฟล์ — ${what}`,
  };
}

module.exports = { segments, tokens, subcommand, pathArgs, decideCommand, UNSAFE_PATH };
