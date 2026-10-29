# Deny the OLS worker the credential folder: spec

2026-10-29 · Owner decision D26 in `Thitic9203/pluton-ai-agent` `docs/plans/qa-agent-slack-ols.md`

## Why
The OLS QA agent (`pluton-ai-agent`) runs work orders through the agent type `ols-qa-worker`
(tools `Read, Write, Edit, Glob, Grep, Bash`) with its working folder in this repo. ols-real R4 says
the worker must not read credentials, but only its prompt said so. Credentials live in
`~/.ols-qa-secrets/` on the owner's Mac.

## Rules
- **R1.** `.claude/settings.json` must deny `Read`, `Edit` and `Bash` access to `~/.ols-qa-secrets`:
  `Read(~/.ols-qa-secrets/**)`, `Edit(~/.ols-qa-secrets/**)`, `Bash(*ols-qa-secrets*)`. Claude Code expands `~/` to the home folder, so no
  machine-specific absolute path is written (this repo may be public). Source: D26, ols-real R4.
- **R2.** Adding them must not remove or reorder any existing setting. Source: owner rule 5 (do not break existing code).
- **R3.** A test must fail when any R1 entry is missing or the file is not valid JSON. Source: owner rule 18.

## Done when
- R1 entries present; existing entries unchanged; the test is red without them and green with them.
