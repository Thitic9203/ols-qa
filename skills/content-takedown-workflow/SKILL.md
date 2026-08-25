---
name: content-takedown-workflow
description: |
  Take a set of published content items out of public view — inventory the set, prove the items are otherwise healthy, pick the least damaging mechanism the available accounts can actually use, execute, then prove with guest-side evidence that every item is gone and nothing else moved.
  Use when the user says hide this content, take these down, remove from the public catalogue, unpublish this batch, ซ่อนสื่อ, นำออกจากคลัง, or /content-takedown.
  Do NOT use for deleting content permanently, for renaming or fixing item metadata (name-guard fixers), or for retesting a bug fix (retest-bug-workflow).
proactive_triggers:
  - /content-takedown
  - hide this content
  - take these down
  - remove from the public catalogue
  - unpublish this batch
  - ซ่อนสื่อ
  - นำออกจากคลัง
---

# Content takedown (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/content-takedown-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **content-takedown-workflow** to take the named set out of public view.`
2. **Confirm the environment and the account set first** — one message, then wait. Never pick an
   environment yourself; see the intake gate in [ols-project-guide.md](../../references/ols-project-guide.md).
3. **Show the batch before touching it** — titles and count, plus the rule buckets when the batch is
   defined by a quality judgement (run `tools/name-guard/name_rules.js`, not your own taste).
4. **Work down the mechanism ladder** in WORKFLOW.md Step 3 and stop at the first rung a real call
   proves available: owner unpublish → platform team → administrative action → user report at a
   hiding severity. The last rung writes a permanent accusation against a named person and needs the
   user's informed approval, restated after hearing what it says about them.
5. Read and follow [WORKFLOW.md](../deprecated/content-takedown-workflow/WORKFLOW.md) **end-to-end** —
   every step, gate and trap.

Claude Code shortcut: `/content-takedown` → [commands/content-takedown.md](../../commands/content-takedown.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without an explicit
instruction naming the set, a confirmed environment, accounts whose roles were verified live, and a
stated scope boundary. MUST refuse on a hands-off environment.

## The two traps that decide whether this works

- **One report per (account, item), first one binding** — a low-severity report filed first
  permanently spends that account's only chance to hide that item, and still answers `201`. Decide
  severity before the first call.
- **Severity, not count, controls visibility** — only the HIGH tier opens a case in the state that
  hides; every other tier opens a queue entry that changes nothing. Read severity from an
  authoritative source, never from the label's tone.

## QA closing (mandatory before "done")

Five-layer guest-side verification in WORKFLOW.md Step 6 — write responses, public list `total 0`,
**every** item id refused, whole-catalogue count down by exactly the batch size, and a guest
screenshot sent in chat. MUST NOT claim done from write responses alone or from a sampled subset,
and MUST state the rollback call with the ids needed to run it.
