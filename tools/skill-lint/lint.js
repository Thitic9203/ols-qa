#!/usr/bin/env node
'use strict';
/* Lint gate for skill files (plan D11). Five rules:
 *
 *   max-lines           skills/**\/SKILL.md and skills/**\/WORKFLOW.md are at most 500 lines.
 *   toc                 any skills/**\/*.md or references/*.md longer than 100 lines has a
 *                       "Contents" section within its first 25 lines (after YAML frontmatter).
 *   must-read-depth     every must-read link reachable from a loaded skill
 *                       (skills/<name>/SKILL.md) is linked from that SKILL.md directly (1 hop).
 *   description-person  the frontmatter description of skills/**\/SKILL.md has no first or
 *                       second person (I / me / my / you / your ...).
 *   description-use-when  the frontmatter description of skills/**\/SKILL.md says when to use it
 *                       with "Use when ..." and never with "Use for ..." (Anthropic skill
 *                       authoring best practice). Negative clauses ("Do NOT use for ...") are
 *                       not counted either way.
 *
 * A baseline (baseline.json next to this file) lists today's known violations so the gate can
 * be on now and fail only on NEW ones. It is a ratchet: a baselined file may not grow past its
 * recorded line count, a baselined link may not get deeper, and a baseline entry that is no
 * longer violated is reported as STALE and also fails — remove it (or re-run with
 * --write-baseline) so the list only ever shrinks.
 *
 *   node tools/skill-lint/lint.js [--root <dir>] [--baseline <file>|--no-baseline] [--write-baseline]
 *
 * exit 0 = no new or stale violation · 1 = new or stale violation · 2 = usage / unreadable input.
 *
 * Must-read vs see-also is a heuristic (same definitions as the D13 measurement):
 *   edge  = inline markdown link [t](path.md[#x]) outside code fences, resolving to an existing
 *           .md inside the root. context = the link's line + the previous non-blank line.
 *   SEE   if the enclosing heading matches see also|related|references|further|อ้างอิง|ดูเพิ่ม
 *         or the context matches see also|related|cf.|for (more|background|details)|optional|ดูเพิ่ม
 *   MUST  else if the context matches follow|read|load|open|run|apply|per|governed by|must|
 *         mandatory|required|full rule|full procedure|before|ทำตาม|อ่าน|ตาม
 *   INFO  otherwise. Only MUST edges count for must-read-depth.
 *   A MUST link to another loaded skill's SKILL.md is a hand-off: it is not counted and not
 *   followed (that skill is checked from its own SKILL.md). Links into skills/procedures/<other>/
 *   are reads of that skill's internals and are followed like any other MUST edge.
 */
const fs = require('fs');
const path = require('path');

const MAX_LINES = 500;
const TOC_MIN_LINES = 100; // a file needs a ToC when it has MORE than this many lines
const TOC_WINDOW = 25;

const RULES = ['max-lines', 'toc', 'must-read-depth', 'description-person', 'description-use-when'];

// ---------- files

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function rel(root, abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}

function readLines(abs) {
  return fs.readFileSync(abs, 'utf8').split('\n');
}

// wc -l semantics: a trailing newline does not start another line.
function lineCount(lines) {
  return lines.length && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
}

function stripFrontmatter(lines) {
  if (lines.length && lines[0].trim() === '---') {
    for (let i = 1; i < lines.length; i++) if (lines[i].trim() === '---') return lines.slice(i + 1);
  }
  return lines;
}

const isSkillMain = (p) => p.startsWith('skills/') && (p.endsWith('/SKILL.md') || p.endsWith('/WORKFLOW.md'));
const isSkillMd = (p) => p.startsWith('skills/') && p.endsWith('.md');
const isRef = (p) => /^references\/[^/]+\.md$/.test(p);
const isLoadedSkill = (p) => /^skills\/[^/]+\/SKILL\.md$/.test(p);

function listFiles(root) {
  return walk(path.join(root, 'skills')).concat(walk(path.join(root, 'references')))
    .map((a) => rel(root, a))
    .filter((p) => isSkillMd(p) || isRef(p))
    .sort();
}

// ---------- rule: max-lines

function ruleMaxLines(root, files) {
  const out = [];
  for (const p of files.filter(isSkillMain)) {
    const n = lineCount(readLines(path.join(root, p)));
    if (n > MAX_LINES) out.push({ key: p, value: n, msg: `${p}: ${n} lines (max ${MAX_LINES})` });
  }
  return out;
}

// ---------- rule: toc

const TOC_HEAD = /^\s{0,3}#{1,6}\s*(\*\*)?\s*((table of )?contents|สารบัญ|toc)\s*(\*\*)?\s*:?\s*$/i;

function hasToc(lines) {
  return stripFrontmatter(lines).slice(0, TOC_WINDOW).some((l) => TOC_HEAD.test(l));
}

function ruleToc(root, files) {
  const out = [];
  for (const p of files) {
    const lines = readLines(path.join(root, p));
    const n = lineCount(lines);
    if (n > TOC_MIN_LINES && !hasToc(lines)) {
      out.push({ key: p, msg: `${p}: ${n} lines, no "Contents" heading in the first ${TOC_WINDOW} lines` });
    }
  }
  return out;
}

// ---------- rule: must-read-depth

const LINK = /(?<!!)\[[^\]]*\]\(([^)\s]+?\.md)(#[^)\s]*)?\)/g;
const SEE_HEAD = /see also|related|references|further|อ้างอิง|ดูเพิ่ม/i;
const SEE_CTX = /see also|related|\bcf\.|for (more|background|details)|optional|ดูเพิ่ม/i;
const MUST_CTX = /\b(follow|follows|read|load|open|run|apply|per|governed by|must|mandatory|required|full rule|full procedure|before)\b|ทำตาม|อ่าน|ตาม/i;
const HEAD = /^\s{0,3}#{1,6}\s+(.*)$/;

function classify(heading, ctx) {
  if (SEE_HEAD.test(heading) || SEE_CTX.test(ctx)) return 'SEE';
  if (MUST_CTX.test(ctx)) return 'MUST';
  return 'INFO';
}

function edges(root, p, cache) {
  if (cache.has(p)) return cache.get(p);
  const out = [];
  const abs = path.join(root, p);
  if (fs.existsSync(abs)) {
    let heading = '';
    let prev = '';
    let inCode = false;
    for (const line of readLines(abs)) {
      if (line.trim().startsWith('```')) { inCode = !inCode; prev = ''; continue; }
      if (inCode) continue;
      const h = HEAD.exec(line);
      if (h) { heading = h[1]; prev = ''; continue; }
      for (const m of line.matchAll(LINK)) {
        const tgt = m[1];
        if (/^[a-z]+:\/\//i.test(tgt)) continue;
        const target = path.normalize(path.join(path.dirname(abs), tgt));
        const r = rel(root, target);
        if (r.startsWith('..') || path.isAbsolute(r) || !fs.existsSync(target) || !fs.statSync(target).isFile()) continue;
        out.push({ to: r, cls: classify(heading, prev + ' ' + line) });
      }
      prev = line.trim() ? line : '';
    }
  }
  cache.set(p, out);
  return out;
}

function mustDepths(root, start, cache) {
  const dist = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const u = queue.shift();
    for (const e of edges(root, u, cache)) {
      if (e.cls !== 'MUST' || dist.has(e.to)) continue;
      // A link to ANOTHER loaded skill's SKILL.md is a hand-off ("go run skill X"), not a read of
      // X's internals: X is loaded on its own and its depth is checked from its own SKILL.md.
      // Links into another skill's procedures/ files are still real reads and still count.
      if (isLoadedSkill(e.to) && e.to !== start) continue;
      dist.set(e.to, dist.get(u) + 1);
      queue.push(e.to);
    }
  }
  return dist;
}

function ruleMustReadDepth(root, files) {
  const out = [];
  const cache = new Map();
  for (const skill of files.filter(isLoadedSkill)) {
    for (const [target, d] of mustDepths(root, skill, cache)) {
      if (d < 2) continue;
      const key = `${skill} -> ${target}`;
      out.push({ key, value: d, msg: `${key}: must-read at ${d} hops (max 1)` });
    }
  }
  return out;
}

// ---------- rule: description-person

function description(lines) {
  if (!lines.length || lines[0].trim() !== '---') return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === '---') { end = i; break; }
  if (end < 0) return null;
  const fm = lines.slice(1, end);
  const i = fm.findIndex((l) => /^description\s*:/.test(l));
  if (i < 0) return null;
  const parts = [fm[i].replace(/^description\s*:\s*/, '').replace(/^[|>][-+]?\s*$/, '')];
  for (let j = i + 1; j < fm.length && (/^\s/.test(fm[j]) || fm[j] === ''); j++) parts.push(fm[j].trim());
  return parts.join(' ').trim();
}

function rulePerson(root, files) {
  const out = [];
  for (const p of files.filter((f) => f.startsWith('skills/') && f.endsWith('/SKILL.md'))) {
    const raw = description(readLines(path.join(root, p)));
    if (raw == null) continue;
    // Quoted trigger phrases are the user's words ("find your own mistakes"), not the
    // description's own voice — drop them before looking for first/second person.
    const d = raw.replace(/"[^"\n]*"|“[^”\n]*”/g, '""');
    // Case matters for "I" (a pronoun); every other word is matched case-insensitively.
    const hitI = /(^|[^A-Za-z'])(I|I'm|I'll|I've|I'd)(?![A-Za-z'])/.exec(d);
    const hitOther = /\b(me|my|mine|myself|you|your|yours|yourself|you're|you'll|you've|you'd)\b/i.exec(d);
    const hit = hitI ? hitI[2] : hitOther ? hitOther[1] : null;
    if (hit) out.push({ key: p, msg: `${p}: description uses "${hit}" (write in third person)` });
  }
  return out;
}

// ---------- rule: description-use-when

// "Use when" / "Use for" as the description's own trigger clause — not the negative
// "Do NOT use for/when" clause, which says when the skill is the wrong pick.
const USE_WHEN = /(?<!NOT )\bUse when\b/;
const USE_FOR = /(?<!NOT )\bUse for\b/;

function ruleUseWhen(root, files) {
  const out = [];
  for (const p of files.filter((f) => f.startsWith('skills/') && f.endsWith('/SKILL.md'))) {
    const d = description(readLines(path.join(root, p)));
    if (d == null) continue;
    if (USE_FOR.test(d)) out.push({ key: p, msg: `${p}: description says "Use for" (write "Use when ...")` });
    else if (!USE_WHEN.test(d)) out.push({ key: p, msg: `${p}: description has no "Use when ..." trigger clause` });
  }
  return out;
}

// ---------- baseline

function emptyBaseline() {
  return { 'max-lines': {}, toc: [], 'must-read-depth': {}, 'description-person': [], 'description-use-when': [] };
}

function loadBaseline(file) {
  if (!file) return emptyBaseline();
  const b = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Object.assign(emptyBaseline(), b);
}

function toBaseline(found) {
  const b = emptyBaseline();
  for (const v of found['max-lines']) b['max-lines'][v.key] = v.value;
  b.toc = found.toc.map((v) => v.key).sort();
  for (const v of found['must-read-depth']) b['must-read-depth'][v.key] = v.value;
  b['description-person'] = found['description-person'].map((v) => v.key).sort();
  b['description-use-when'] = found['description-use-when'].map((v) => v.key).sort();
  return b;
}

// Split each rule's violations into new (fail), known (baselined, ok) and stale (fail).
function compare(found, base) {
  const res = {};
  for (const rule of RULES) {
    const b = base[rule];
    const allowed = Array.isArray(b) ? new Map(b.map((k) => [k, null])) : new Map(Object.entries(b));
    const now = new Set(found[rule].map((v) => v.key));
    const fresh = [];
    const known = [];
    for (const v of found[rule]) {
      if (!allowed.has(v.key)) fresh.push(v.msg);
      else if (allowed.get(v.key) != null && v.value > allowed.get(v.key)) {
        fresh.push(`${v.msg} — grew past baseline ${allowed.get(v.key)}`);
      } else known.push(v.msg);
    }
    const stale = [...allowed.keys()].filter((k) => !now.has(k))
      .map((k) => `${k}: in baseline but no longer violated — remove it from the baseline`);
    res[rule] = { total: found[rule].length, fresh, known, stale };
  }
  return res;
}

function lint(root) {
  const files = listFiles(root);
  return {
    'max-lines': ruleMaxLines(root, files),
    toc: ruleToc(root, files),
    'must-read-depth': ruleMustReadDepth(root, files),
    'description-person': rulePerson(root, files),
    'description-use-when': ruleUseWhen(root, files),
  };
}

// ---------- cli

function main(argv) {
  const args = { root: path.join(__dirname, '..', '..'), baseline: path.join(__dirname, 'baseline.json'), write: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') args.root = argv[++i];
    else if (a === '--baseline') args.baseline = argv[++i];
    else if (a === '--no-baseline') args.baseline = null;
    else if (a === '--write-baseline') args.write = true;
    else { console.error('usage: lint.js [--root <dir>] [--baseline <file>|--no-baseline] [--write-baseline]'); return 2; }
  }
  if (!args.root || !fs.existsSync(path.join(args.root, 'skills'))) {
    console.error('[skill-lint] no skills/ directory under the root — nothing checked, not a pass');
    return 2;
  }
  const root = path.resolve(args.root);
  const found = lint(root);

  if (args.write) {
    if (!args.baseline) { console.error('[skill-lint] --write-baseline needs a baseline path'); return 2; }
    fs.writeFileSync(args.baseline, JSON.stringify(toBaseline(found), null, 2) + '\n');
    console.log('[skill-lint] baseline written: ' + RULES.map((r) => `${r} ${found[r].length}`).join(' · '));
    return 0;
  }

  let base;
  try { base = args.baseline ? loadBaseline(args.baseline) : emptyBaseline(); } catch (e) {
    console.error('[skill-lint] cannot read baseline: ' + e.message);
    return 2;
  }

  const res = compare(found, base);
  let bad = 0;
  for (const rule of RULES) {
    const r = res[rule];
    console.log(`[skill-lint] ${rule}: ${r.total} violation(s) · new ${r.fresh.length} · baselined ${r.known.length} · stale ${r.stale.length}`);
    for (const m of r.fresh) console.log('  NEW    ' + m);
    for (const m of r.stale) console.log('  STALE  ' + m);
    bad += r.fresh.length + r.stale.length;
  }
  console.log(bad ? `[skill-lint] FAIL — ${bad} new or stale violation(s)` : '[skill-lint] OK — no new violations');
  return bad ? 1 : 0;
}

module.exports = { lint, compare, toBaseline, emptyBaseline, description, classify, hasToc, lineCount };

if (require.main === module) process.exitCode = main(process.argv.slice(2));
