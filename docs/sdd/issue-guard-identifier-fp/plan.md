# Plan — issue-creation-guard: names are not orders

## Files
- `tools/issue-creation-guard/check.js` — new `stripIdentifiers(line)` used inside `inspectAgentPrompt` before the verb/object tests; export it for tests.
- `tools/issue-creation-guard/issue_creation_guard.test.js` — known-answer cases from spec R1–R3.

## Approach
Replace identifier tokens with a space before matching, per line. Tokens: `\S+` pieces that (a) contain `/` and also `-` or `.`, or (b) end in `.<letters>` extension, or (c) are kebab-case with ≥3 parts, or (d) are 2-part kebab made of one guard verb + one guard object. Negation check keeps reading the original line.

## Options weighed
- Allow-list of skill names: rejected — goes stale with every new skill.
- Raise NEAR_CHARS / require sentence start: rejected — changes what real orders are caught.
- One-off `--confirm` unlock: rejected by owner; it means "issue creation allowed", which is not what is wanted.

## Libraries / cost
Node built-ins only. New cost: NO. Touches other repos: NO.

## What could break
- A real order written only as an identifier (`run create-bug-workflow`) is no longer blocked by the Agent check — that is a skill invocation, not an issue order; the skill's own approval gate and the Bash patterns (`gh issue create`, REST POST) still block the actual write.
