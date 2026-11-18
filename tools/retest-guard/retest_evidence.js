'use strict';

/**
 * Pre-review evidence checks — the file-reading half of spec
 * docs/sdd/test-time-cut-guard/spec.md R1–R5. The decisions themselves (what a
 * width claim is, what backs a role, what a verifier line looks like) live in
 * retest_rules.js; this module only reads the disk and feeds them.
 *
 * Severity `unchecked` means the check could not be decided from what was given.
 * It is never a pass: retest_guard.js exits 2 when it is all that stands.
 *
 * Node >= 18, no dependencies.
 */

const fs = require('fs');
const path = require('path');
const R = require('./retest_rules');

function unchecked(rule, field, message, fix) {
  return { rule, field, message, fix, severity: 'unchecked' };
}
function err(rule, field, message, fix) {
  return { rule, field, message, fix, severity: 'error' };
}
function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}
function results(m) { return (m && Array.isArray(m.results)) ? m.results : []; }

/** R1 — every px width a row claims is backed by an evidence file of that width. */
function checkWidthClaims(m, evidenceDir) {
  const out = [];
  results(m).forEach((r, i) => {
    const claims = [...new Set(R.widthClaims(r.actual))];
    if (!claims.length) return;
    const backed = new Set();
    (r.evidence || []).forEach((f) => {
      R.widthsBackedByName(f).forEach((w) => backed.add(w));
      if (evidenceDir) {
        const stem = String(f).replace(/\.[A-Za-z0-9]+$/, '');
        const cap = readJson(path.join(evidenceDir, `${stem}.capture.json`));
        const w = cap && cap.viewport && Number(cap.viewport.width);
        if (w) backed.add(w);
      }
    });
    const missing = claims.filter((w) => !backed.has(w));
    if (!missing.length) return;
    if (!evidenceDir) {
      out.push(unchecked('width-claim-unchecked', `results[${i}].actual`,
        `claims ${missing.join(' / ')} px; no file name backs it and no --evidence-dir to read capture.json`,
        'pass --evidence-dir'));
      return;
    }
    out.push(err('width-claim-without-evidence', `results[${i}].actual`,
      `claims ${missing.join(' / ')} px but no evidence file of that row is of that width`,
      'capture that width (name it w<width> or keep its <stem>.capture.json), or remove the width from the row'));
  });
  return out;
}

/** R2 — every role a row names is backed by that row's evidence. */
function checkRoleClaims(m) {
  const out = [];
  const vocab = R.roleVocabulary(m);
  results(m).forEach((r, i) => {
    const claims = R.roleClaims(r.actual, vocab);
    if (!claims.length) return;
    const backed = new Set();
    (r.evidence || []).forEach((f) => R.rolesBackedByFile(f, m.cases, vocab).forEach((k) => backed.add(k)));
    claims.filter((role) => !backed.has(R.roleKey(role))).forEach((role) => {
      out.push(err('role-claim-without-evidence', `results[${i}].actual`,
        `names role "${role}" but none of the row's evidence is from a ${role} case or names that role`,
        'cite that role\'s evidence on the row, or narrow the claim to the roles the evidence shows'));
    });
  });
  return out;
}

/** Every `.txt` verifier output in a directory, parsed. */
function verifierResults(dir) {
  const map = new Map();
  let names;
  try { names = fs.readdirSync(dir); } catch (_) { return null; }
  names.filter((n) => n.endsWith('.txt')).forEach((n) => {
    let text = '';
    try { text = fs.readFileSync(path.join(dir, n), 'utf8'); } catch (_) { return; }
    R.parseVerifierOutput(text).forEach(({ clip, pass }) => {
      const prev = map.get(clip) || { pass: 0, fail: 0 };
      if (pass) prev.pass += 1; else prev.fail += 1;
      map.set(clip, prev);
    });
  });
  return map;
}

/** R3 — each cited clip has a verifier PASS (no FAIL), or a decisions row naming it. */
function checkClips(m, body, evidenceDir, verifyDir, decisionsPath) {
  const clips = new Set();
  results(m).forEach((r) => (r.evidence || []).forEach((f) => { if (/\.mp4$/i.test(f)) clips.add(path.basename(f)); }));
  ((m && m.cases) || []).forEach((c) => (c.evidence || []).forEach((f) => { if (/\.mp4$/i.test(f)) clips.add(path.basename(f)); }));
  (String(body || '').match(/[\w.-]+\.mp4/gi) || []).forEach((f) => clips.add(f));
  if (!clips.size) return [];

  const dir = verifyDir || evidenceDir;
  const verdicts = dir ? verifierResults(dir) : null;
  let decisions = null;
  if (decisionsPath) {
    try { decisions = fs.readFileSync(decisionsPath, 'utf8'); } catch (_) { decisions = null; }
  }
  const out = [];
  [...clips].sort().forEach((clip) => {
    const v = verdicts && verdicts.get(clip);
    if (v && v.pass > 0 && v.fail === 0) return;
    if (decisions === null) {
      out.push(unchecked(verdicts ? 'clip-decision-unchecked' : 'clip-verify-unchecked', clip,
        verdicts ? `${clip} has no passing verifier output and no decisions file was given`
          : `${clip}: no verifier output directory to read`,
        verdicts ? 'pass --decisions <ROUND_DECISIONS.md>' : 'pass --verify-dir (or --evidence-dir) holding the verify_video output'));
      return;
    }
    if (R.decisionNamesClip(decisions, clip)) return;
    const why = !v ? 'no verifier output names it' : 'its verifier output has a FAIL line';
    out.push(err('clip-unverified-no-decision', clip,
      `${clip}: ${why}, and no row of the decisions file names it`,
      'run verify_video on it and save the output, re-capture, or record the owner\'s decision naming the clip'));
  });
  return out;
}

/** R4 — the decisions file, read and checked; absent = unchecked. */
function checkDecisionsFile(decisionsPath) {
  if (!decisionsPath) {
    return [unchecked('decision-times-unchecked', '(decisions)',
      'no --decisions file — times in it cannot be checked', 'pass --decisions <ROUND_DECISIONS.md>')];
  }
  const text = fs.readFileSync(decisionsPath, 'utf8');      // unreadable: the caller exits 2
  return R.checkDecisionTimes(text).map((f) => Object.assign(f, { field: `${path.basename(decisionsPath)}:${f.line}` }));
}

/** R5 — every inline wiki image is a PNG ≤ INLINE_IMAGE_MAX_WIDTH px wide. */
function checkInlineImages(body, evidenceDir) {
  const out = [];
  [...new Set(R.inlineWikiImages(body))].forEach((name) => {
    let buf = null;
    if (evidenceDir) {
      try { buf = fs.readFileSync(path.join(evidenceDir, name)); } catch (_) { buf = null; }
    }
    const w = buf ? R.pngWidth(buf) : null;
    if (w === null) {
      out.push(unchecked('inline-image-unchecked', name,
        evidenceDir ? `${name} is not a readable PNG in ${evidenceDir}` : `${name}: no --evidence-dir to read it from`,
        'put the embedded file in the evidence dir'));
      return;
    }
    if (w > R.INLINE_IMAGE_MAX_WIDTH) {
      out.push(err('inline-image-too-wide', name,
        `${name} is ${w} px wide; an inline image is at most ${R.INLINE_IMAGE_MAX_WIDTH} px`,
        `embed a resized copy (≤ ${R.INLINE_IMAGE_MAX_WIDTH} px) and keep the original as the evidence of record`));
    }
  });
  return out;
}

/** All five, in spec order. */
function check({ manifest, body, evidenceDir, verifyDir, decisionsPath }) {
  const claims = manifest
    ? [...checkWidthClaims(manifest, evidenceDir), ...checkRoleClaims(manifest)]
    : [unchecked('row-claims-unchecked', '(manifest)',
      'width and role claims are checked against run.json, and no --manifest was given', 'pass --manifest run.json')];
  return [
    ...claims,
    ...checkClips(manifest, body, evidenceDir, verifyDir, decisionsPath),
    ...checkDecisionsFile(decisionsPath),
    ...checkInlineImages(body, evidenceDir),
  ];
}

module.exports = {
  checkWidthClaims,
  checkRoleClaims,
  checkClips,
  checkDecisionsFile,
  checkInlineImages,
  verifierResults,
  check,
};
