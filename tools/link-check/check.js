#!/usr/bin/env node
'use strict';
/* Internal markdown link checker — proves a tree (the helix install, or this repo) has no
 * relative link that points at nothing.
 *
 *   node tools/link-check/check.js <root>
 *   bash scripts/helix-link-check.sh [root]     (default root: the helix repo helix-parity.sh uses)
 *
 * Scans every *.md under <root> (the plugin manifest ships the whole repo, so no directory is
 * left out), skipping .git, node_modules, .worktrees, nested git checkouts and symlinks (a
 * symlinked skill dir is a second view of files already scanned). For each inline link
 * [x](target), image ![x](target) and reference definition [id]: target outside fenced code
 * and inline code spans:
 *   - ignored: any scheme (http:, https:, mailto:, ...), <...> targets, {placeholder} targets
 *   - the path part must exist (relative to the file; a leading / means relative to <root>)
 *     and must stay inside <root> — a link out of the tree is broken for whoever installs it
 *   - a #anchor on a .md target (or on the file itself) must match a heading slug
 *     (GitHub rules) or an <a name/id> in that file
 *
 * Output uses root-relative paths only.
 *   exit 0  LINK-CHECK OK <n> links in <m> files
 *   exit 1  one "<file>:<line> -> <target>" line per broken link, then LINK-CHECK BROKEN <k>
 *   exit 2  CANNOT-VERIFY <reason>   (no root, unreadable root, no markdown files to measure)
 */
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['.git', 'node_modules', '.worktrees']);

function listMarkdown(root) {
  const out = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isSymbolicLink()) continue;
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        if (fs.existsSync(path.join(full, '.git'))) continue; // nested checkout / worktree
        walk(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out.sort();
}

// Yields { line, text } for lines outside fenced code blocks, with inline code spans blanked.
function proseLines(body) {
  const lines = body.split(/\r?\n/);
  const out = [];
  let fence = null; // { ch, len }
  lines.forEach((raw, i) => {
    const m = raw.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (m && m[1][0] === fence.ch && m[1].length >= fence.len && raw.trim().replace(/[`~]/g, '') === '') fence = null;
      return;
    }
    if (m) { fence = { ch: m[1][0], len: m[1].length }; return; }
    out.push({ line: i + 1, raw, text: raw.replace(/(`+)[\s\S]*?\1/g, (s) => ' '.repeat(s.length)) });
  });
  return out;
}

function extractLinks(body) {
  const links = [];
  for (const { line, text } of proseLines(body)) {
    const inline = /!?\[(?:[^\[\]]|\[[^\]]*\])*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
    let m;
    while ((m = inline.exec(text))) links.push({ line, target: m[1] });
    const def = text.match(/^\s{0,3}\[[^\]]+\]:\s*(\S+)/);
    if (def) links.push({ line, target: def[1] });
  }
  return links;
}

function ignored(target) {
  return target === '' ||
    /^[a-z][a-z0-9+.-]*:/i.test(target) || // http:, https:, mailto:, file:, ...
    target.startsWith('<') ||
    /[{}]/.test(target);
}

// Code-span content stays (GitHub slugs the rendered text: `<br>` -> "br"); HTML tags and link
// syntax outside code are reduced to their text first.
function slugify(heading) {
  return heading
    .split(/(`+[^`]*?`+)/)
    .map((part, i) => (i % 2 ? part.replace(/`/g, '')
      : part.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '')))
    .join('')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-');
}

const anchorCache = new Map();
function anchorsOf(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const set = new Set();
  const seen = new Map();
  const body = fs.readFileSync(file, 'utf8');
  for (const { raw, text } of proseLines(body)) {
    const h = raw.match(/^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/);
    if (h) {
      const base = slugify(h[1]);
      const n = seen.get(base) || 0;
      seen.set(base, n + 1);
      set.add(n === 0 ? base : `${base}-${n}`);
    }
    const re = /<a\s[^>]*\b(?:name|id)\s*=\s*["']([^"']+)["']/gi;
    let a;
    while ((a = re.exec(text))) set.add(a[1].toLowerCase());
  }
  anchorCache.set(file, set);
  return set;
}

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

function check(root) {
  const files = listMarkdown(root);
  const broken = [];
  let checked = 0;
  for (const file of files) {
    const rel = path.relative(root, file);
    for (const { line, target } of extractLinks(fs.readFileSync(file, 'utf8'))) {
      if (ignored(target)) continue;
      checked++;
      const hash = target.indexOf('#');
      const p = safeDecode(hash === -1 ? target : target.slice(0, hash));
      const anchor = hash === -1 ? '' : safeDecode(target.slice(hash + 1)).toLowerCase();
      const dest = p === '' ? file
        : path.resolve(p.startsWith('/') ? root : path.dirname(file), p.replace(/^\/+/, '') || '.');
      const inside = dest === root || dest.startsWith(root + path.sep);
      let ok = inside && fs.existsSync(dest);
      if (ok && anchor && dest.toLowerCase().endsWith('.md') && fs.statSync(dest).isFile()) {
        ok = anchorsOf(dest).has(anchor);
      }
      if (!ok) broken.push(`${rel}:${line} -> ${target}`);
    }
  }
  return { files: files.length, links: checked, broken };
}

function main(argv) {
  const arg = argv[0];
  if (!arg) { console.log('CANNOT-VERIFY no root given (usage: check.js <root>)'); return 2; }
  let root;
  try {
    root = fs.realpathSync(path.resolve(arg));
    if (!fs.statSync(root).isDirectory()) throw new Error('not a directory');
    fs.readdirSync(root);
  } catch (e) {
    console.log(`CANNOT-VERIFY root unreadable: ${e.message.split('\n')[0]}`);
    return 2;
  }
  let r;
  try { r = check(root); } catch (e) {
    console.log(`CANNOT-VERIFY scan failed: ${e.message.split('\n')[0]}`);
    return 2;
  }
  if (r.files === 0) { console.log('CANNOT-VERIFY no markdown files under root — nothing measured'); return 2; }
  if (r.broken.length === 0) {
    console.log(`LINK-CHECK OK ${r.links} links in ${r.files} files`);
    return 0;
  }
  for (const b of r.broken) console.log(b);
  console.log(`LINK-CHECK BROKEN ${r.broken.length}`);
  return 1;
}

module.exports = { check, extractLinks, slugify, ignored };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
