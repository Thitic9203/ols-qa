# Intent — notify-send-hook

Written in the originator's own words, before `spec.md`. Spec: docs/sdd/ai-native-sdlc-alignment R1.

## What is wanted

Layer 7 of the owner-approved 10-layer guard against hand-formatted Discord QA notifies (relayed by the
main thread, 2026-11-18): "Add an independent PreToolUse(Bash) hook in this repo that blocks, before it runs,
any Bash command invoking `discord_qa_notify.py` that is a REAL send (no `--dry-run`) when: (a) `--registry`
is absent, or (b) `--body` text contains a bullet that restates a verdict/count … or a status line …, or
(c) no dry-run of the same ticket ran earlier in this session."

## Why

Post-mortem #0202: a QA notify body was typed by hand and restated the verdict/count line the helper already
renders. The helper in the bot repo now refuses such bodies itself; this hook is an independent ring in this
repo so a send that bypasses or predates the helper check is still stopped before it runs.

## Constraints

Free (node only, no dependency, no network). Must not block dry-runs, other Bash commands, or the existing
hooks. No other repo is touched. Public repo: no hosts, webhooks, ids or customer ticket keys.

## Reviewed by owner on 2026-11-18

2026-11-18 — the 10-layer plan was approved by the owner (relayed by the main thread). Owner review of this
file's exact text happens on the PR.
