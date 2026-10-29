# Plan — catch-ai-workflow: hedged conclusions

## Files touched

- `skills/catch-ai-workflow/SKILL.md` — description WHEN line, Quick reference row, step 5 class, step 7 rule, new section "Hedged conclusions — dig to the deepest layer", Rationalizations rows, Red flag, QA closing item, MUST / NEVER row.
- `skills/catch-ai-workflow/reference.md` — report template: hedge-free conclusion lines + where hedged-conclusion defects go.
- Both files already exist in helix (`~/GitHub/helix/skills/catch-ai-workflow/`), so the sync script copies them without `HELIX_SYNC_NEW`.

## Approach

Reuse the existing hedge list and confidence labels in `references/root-cause-investigation.md` § 4 instead of a second list; the skill names the Thai + English words inline so the check is greppable. No code change: catch-ai has no tool of its own, and the existing `tools/investigation-guard` already scans chat for hedges — this change covers the audit side.

## Options weighed

- New tool that greps reports for hedges → rejected for now: catch-ai reports live in chat, not files; a `grep -nE` command in QA closing gives the same mechanical check without new code.
- Editing `references/root-cause-investigation.md` → not needed; it already bans hedges. Touching a shared reference widens blast radius to every skill.

## What could break

- `tools/skill-structure` / `tools/skill-lint` limits (description length, Do NOT use line within 20 lines, Contents anchors) — run the suite.
- helix parity: both files must land identically.
