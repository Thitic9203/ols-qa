#!/usr/bin/env node
'use strict';

/**
 * check.js — the PreToolUse entry point for the Agent tool, and the CLI.
 *
 * This layer PRINTS and RELAYS. It holds no rule of its own: every decision
 * comes from `dispatch_rules.js`. Two runtimes holding the same rules are two
 * answers waiting to disagree (report #0003).
 *
 * Exit codes — and "could not run" is never a pass (#0002, #0005, #0006):
 *   0  the brief carries the persistence contract (notes may still print)
 *   2  a BLOCK finding — the dispatch is refused
 *   2  the brief could not be read or zero checks ran — refused
 *
 * Hook usage (PreToolUse, matcher "Agent"): the hook payload arrives on stdin
 * as JSON. Exit 2 with a message on stderr is how a PreToolUse hook blocks.
 *
 * CLI usage:
 *   node check.js --file brief.md
 *   echo "<brief>" | node check.js --stdin-text
 *   node check.js --explain           # print the contract a brief must carry
 */

const fs = require('fs');
const path = require('path');
const rules = require('./dispatch_rules.js');

function readAllStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (err) {
    return null; // cannot read -> caller refuses
  }
}

/**
 * Pull the agent brief out of a PreToolUse payload. Returns
 * { ok: true, text } or { ok: false, why } — never a guessed empty string,
 * because "" would sail through every regex and read as a clean brief.
 */
function briefFromHookPayload(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, why: 'empty stdin' };
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    return { ok: false, why: 'stdin is not JSON: ' + err.message };
  }
  const toolName = payload && (payload.tool_name || payload.toolName);
  if (toolName && String(toolName) !== 'Agent') {
    return { ok: false, why: 'not an Agent dispatch (tool_name=' + toolName + ')', skip: true };
  }
  const input = (payload && (payload.tool_input || payload.toolInput)) || null;
  if (!input || typeof input !== 'object') {
    return { ok: false, why: 'payload carries no tool_input' };
  }
  if (typeof input.prompt !== 'string') {
    return { ok: false, why: 'tool_input.prompt is absent or not a string' };
  }
  return { ok: true, text: input.prompt };
}

function explain() {
  return [
    'A background-agent brief must tell the agent to put each result on disk',
    'BEFORE it calls the next tool. Measured 2026-09-18: 328 of 328 agents that',
    'the watchdog killed were waiting on the model, so anything the agent held',
    'only in its own context was lost with it.',
    '',
    'Satisfy the rule either way:',
    '',
    '  (a) put the literal token ' + rules.PERSIST_MARKER + ' in the brief, or',
    '  (b) name an output file, say to append to it, and say when — e.g.',
    '      "append one JSON line per case to out/<round>/lane1.jsonl before',
    '       calling the next tool"',
    '',
    'Reported but not blocked: asking for screenshots without keeping them out',
    'of context, and asking for an unbounded sweep. Both are how an agent grows',
    'past ~300k context, where the per-request stall hazard roughly triples.',
    '',
    'Reproduce the numbers: node tools/agent-stall-metrics/measure.js --help',
  ].join('\n');
}

function main(argv) {
  const args = argv.slice(2);

  if (args.includes('--explain') || args.includes('-h') || args.includes('--help')) {
    process.stdout.write(explain() + '\n');
    return 0;
  }

  let text = null;
  let fromHook = false;

  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1) {
    const p = args[fileIdx + 1];
    if (!p) {
      process.stderr.write('[agent-dispatch-guard] --file needs a path — cannot check, refusing\n');
      return 2;
    }
    try {
      text = fs.readFileSync(path.resolve(p), 'utf8');
    } catch (err) {
      process.stderr.write(
        '[agent-dispatch-guard] cannot read ' + p + ': ' + err.message + ' — refusing\n'
      );
      return 2;
    }
  } else if (args.includes('--stdin-text')) {
    text = readAllStdin();
    if (text === null) {
      process.stderr.write('[agent-dispatch-guard] cannot read stdin — refusing\n');
      return 2;
    }
  } else {
    fromHook = true;
    const raw = readAllStdin();
    if (raw === null) {
      process.stderr.write('[agent-dispatch-guard] cannot read stdin — refusing\n');
      return 2;
    }
    const got = briefFromHookPayload(raw);
    if (!got.ok) {
      if (got.skip) {
        // Not our tool. Saying nothing and allowing is correct here: this is
        // the one branch where "no finding" is a fact, not an absence of
        // measurement.
        return 0;
      }
      process.stderr.write(
        '[agent-dispatch-guard] could not read the agent brief (' + got.why + ') — refusing ' +
          'rather than allowing an unchecked dispatch\n'
      );
      return 2;
    }
    text = got.text;
  }

  let result;
  try {
    result = rules.assessBrief(text);
  } catch (err) {
    process.stderr.write('[agent-dispatch-guard] ' + err.message + '\n');
    return 2;
  }

  const report = rules.formatAssessment(result);
  if (result.ok) {
    process.stdout.write(report + '\n');
    return 0;
  }
  process.stderr.write(report + '\n');
  if (fromHook) {
    process.stderr.write(
      '\nAdd the line and dispatch again. `node tools/agent-dispatch-guard/check.js --explain` ' +
        'prints the contract.\n'
    );
  }
  return 2;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { main, briefFromHookPayload, explain };
